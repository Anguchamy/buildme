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
        Subscription sub = getOrCreate(workspaceId);
        sub.setStatus("PENDING");
        sub.setPaymentProvider("RAZORPAY");
        subscriptionRepository.save(sub);
        return razorpayService.createOrder(planType, workspaceId);
    }

    @Transactional
    public SubscriptionResponse verifyAndActivate(String orderId, String paymentId, String signature, Long workspaceId, String planType) {
        if (!razorpayService.verifySignature(orderId, paymentId, signature)) {
            throw new IllegalArgumentException("Invalid payment signature");
        }

        Subscription sub = getOrCreate(workspaceId);
        PlanType newPlan = PlanType.valueOf(planType.toUpperCase());

        sub.setStatus("ACTIVE");
        sub.setRazorpayOrderId(orderId);
        sub.setRazorpayPaymentId(paymentId);
        sub.setPlanType(newPlan);
        sub.setSeats(PlanType.AGENCY == newPlan ? 10 : 3);
        sub.setMonthlyPostLimit(null);
        sub.setPaymentProvider("RAZORPAY");

        OffsetDateTime now = OffsetDateTime.now();
        sub.setCurrentPeriodStart(now);
        sub.setCurrentPeriodEnd(now.plusMonths(1));
        sub.setCancelAtPeriodEnd(false);

        subscriptionRepository.save(sub);
        log.info("Activated {} plan for workspace {} via Razorpay orderId={}", newPlan, workspaceId, orderId);
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
            sub.getMonthlyPostLimit() != null ? sub.getMonthlyPostLimit() : 10,
            sub.getPostsUsedThisMonth() != null ? sub.getPostsUsedThisMonth() : 0
        );
    }
}
