package com.buildme.service;

import com.buildme.dto.response.SubscriptionResponse;
import com.buildme.exception.CustomExceptions;
import com.buildme.model.PlanType;
import com.buildme.model.Subscription;
import com.buildme.model.Workspace;
import com.buildme.repository.SubscriptionRepository;
import com.buildme.repository.WorkspaceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class SubscriptionService {

    private final SubscriptionRepository subscriptionRepository;
    private final WorkspaceRepository workspaceRepository;
    private final RazorpayService razorpayService;

    @Transactional
    public SubscriptionResponse getSubscription(Long workspaceId) {
        return toResponse(getOrCreate(workspaceId));
    }

    @Transactional
    public Map<String, Object> initiateUpgrade(Long workspaceId, String planType) {
        validatePlanType(planType);
        // Ensure a Subscription row exists so verifyAndActivate has something to
        // update, but DO NOT flip the user's current status to PENDING here —
        // if they abandon checkout their ACTIVE plan would be stuck in a
        // pending state until they retry.
        getOrCreate(workspaceId);
        return razorpayService.createOrder(planType, workspaceId);
    }

    @Transactional
    public SubscriptionResponse verifyAndActivate(String orderId, String paymentId, String signature, Long workspaceId, String planType) {
        if (!razorpayService.verifySignature(orderId, paymentId, signature)) {
            throw new IllegalArgumentException("Invalid payment signature");
        }

        // Replay protection — a valid (orderId, paymentId, signature) tuple must
        // never activate twice. Razorpay charges each Order once, but the client
        // can retry the /verify endpoint; without this, retries would extend the
        // subscription period on every call.
        if (subscriptionRepository.existsByRazorpayPaymentId(paymentId)) {
            throw new IllegalArgumentException("Payment already processed");
        }

        // Cross-check the workspace/plan the client sent against what Razorpay
        // has on the actual Order. Without this, a user who legitimately pays
        // for their own workspace can call /verify with a *different* workspaceId
        // in the body and activate the plan on a workspace they don't own — or
        // on their own workspace with a plan they didn't pay for.
        com.razorpay.Payment payment = razorpayService.fetchPayment(paymentId);
        String payOrderId = payment.get("order_id");
        if (payOrderId == null || !payOrderId.equals(orderId)) {
            throw new IllegalArgumentException("Payment does not match order");
        }
        String paidStatus = payment.get("status");
        if (paidStatus == null || !("captured".equals(paidStatus) || "authorized".equals(paidStatus))) {
            throw new IllegalArgumentException("Payment not captured: " + paidStatus);
        }

        com.razorpay.Order order = razorpayService.fetchOrder(orderId);
        JSONObject notes = order.get("notes");
        String notesWorkspaceId = notes != null ? notes.optString("workspaceId", "") : "";
        String notesPlanType    = notes != null ? notes.optString("planType", "")    : "";
        if (!String.valueOf(workspaceId).equals(notesWorkspaceId)) {
            throw new IllegalArgumentException("Order/workspace mismatch");
        }
        if (!planType.equalsIgnoreCase(notesPlanType)) {
            throw new IllegalArgumentException("Order/plan mismatch");
        }

        // Amount check — reject if what Razorpay actually charged doesn't match
        // the plan's price. Guards against price tampering if the frontend ever
        // constructs orders with a client-supplied amount.
        Integer paidAmount = (Integer) order.get("amount");
        long expectedAmount = razorpayService.expectedPricePaise(planType);
        if (paidAmount == null || paidAmount.longValue() != expectedAmount) {
            throw new IllegalArgumentException("Amount mismatch: paid=" + paidAmount + " expected=" + expectedAmount);
        }

        Subscription sub = getOrCreate(workspaceId);
        PlanType newPlan = PlanType.valueOf(planType.toUpperCase());

        sub.setStatus("ACTIVE");
        sub.setRazorpayOrderId(orderId);
        sub.setRazorpayPaymentId(paymentId);
        sub.setPlanType(newPlan);
        sub.setSeats(PlanType.AGENCY == newPlan ? 10 : 3);
        // Paid plans have no monthly post cap. Persist a sentinel so the
        // response layer doesn't fall back to the FREE default of 10.
        sub.setMonthlyPostLimit(Integer.MAX_VALUE);
        sub.setPaymentProvider("RAZORPAY");

        OffsetDateTime now = OffsetDateTime.now();
        sub.setCurrentPeriodStart(now);
        sub.setCurrentPeriodEnd(now.plusMonths(1));
        sub.setCancelAtPeriodEnd(false);

        subscriptionRepository.save(sub);
        log.info("Activated {} plan for workspace {} via Razorpay orderId={} paymentId={}",
            newPlan, workspaceId, orderId, paymentId);
        return toResponse(sub);
    }

    @Transactional
    public SubscriptionResponse cancelSubscription(Long workspaceId) {
        Subscription sub = subscriptionRepository.findByWorkspaceId(workspaceId)
            .orElseThrow(() -> new CustomExceptions.ResourceNotFoundException("Subscription", workspaceId));
        sub.setCancelAtPeriodEnd(true);
        subscriptionRepository.save(sub);
        return toResponse(sub);
    }

    @Transactional
    public Subscription getOrCreate(Long workspaceId) {
        return subscriptionRepository.findByWorkspaceId(workspaceId).orElseGet(() -> {
            Workspace ws = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new CustomExceptions.ResourceNotFoundException("Workspace", workspaceId));
            return subscriptionRepository.save(Subscription.builder()
                .workspace(ws)
                .planType(PlanType.FREE)
                .status("ACTIVE")
                .monthlyPostLimit(10)
                .seats(1)
                .build());
        });
    }

    private void validatePlanType(String planType) {
        if (!"PRO".equalsIgnoreCase(planType) && !"AGENCY".equalsIgnoreCase(planType)) {
            throw new IllegalArgumentException("Invalid plan type: " + planType);
        }
    }

    public SubscriptionResponse toResponse(Subscription sub) {
        // Post-limit fallback matches the plan tier — paid plans are effectively
        // unlimited (Integer.MAX_VALUE is set on activation). Never fall back to
        // 10 for a paid plan just because monthly_post_limit is unexpectedly null.
        int postLimit;
        if (sub.getMonthlyPostLimit() != null) {
            postLimit = sub.getMonthlyPostLimit();
        } else if (sub.getPlanType() == PlanType.FREE) {
            postLimit = 10;
        } else {
            postLimit = Integer.MAX_VALUE;
        }
        return new SubscriptionResponse(
            sub.getId(),
            sub.getWorkspace().getId(),
            sub.getPlanType().name(),
            sub.getStatus(),
            sub.getRazorpayOrderId(),
            sub.getCurrentPeriodStart(),
            sub.getCurrentPeriodEnd(),
            sub.isCancelAtPeriodEnd(),
            sub.getSeats() != null ? sub.getSeats() : 1,
            postLimit,
            sub.getPostsUsedThisMonth() != null ? sub.getPostsUsedThisMonth() : 0
        );
    }
}
