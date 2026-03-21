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
        Subscription sub = getOrCreate(workspaceId);
        return toResponse(sub);
    }

    /**
     * Initiates an upgrade: creates a Razorpay subscription and returns the subscription ID + key.
     */
    @Transactional
    public Map<String, String> initiateUpgrade(Long workspaceId, String planType) {
        validatePlanType(planType);
        Subscription sub = getOrCreate(workspaceId);

        String razorpaySubId = razorpayService.createSubscription(planType);
        sub.setRazorpaySubscriptionId(razorpaySubId);
        sub.setStatus("PENDING");
        sub.setPaymentProvider("RAZORPAY");
        // Pre-set the plan so verifyAndActivate can see it
        PlanType pt = PlanType.valueOf(planType.toUpperCase());
        sub.setPlanType(pt);
        sub.setMonthlyPostLimit("PRO".equalsIgnoreCase(planType) ? null : null); // unlimited
        sub.setSeats("AGENCY".equalsIgnoreCase(planType) ? 10 : 3);
        subscriptionRepository.save(sub);

        return Map.of(
            "razorpaySubscriptionId", razorpaySubId,
            "keyId", razorpayService.getKeyId()
        );
    }

    /**
     * Verifies payment signature and activates the subscription.
     */
    @Transactional
    public SubscriptionResponse verifyAndActivate(String paymentId, String subscriptionId, String signature) {
        boolean valid = razorpayService.verifyPaymentSignature(paymentId, subscriptionId, signature);
        if (!valid) {
            throw new CustomExceptions.AccessDeniedException("Invalid payment signature");
        }

        Subscription sub = subscriptionRepository.findByRazorpaySubscriptionId(subscriptionId)
            .orElseThrow(() -> new CustomExceptions.ResourceNotFoundException("Subscription", 0L));

        sub.setStatus("ACTIVE");
        sub.setRazorpayPaymentId(paymentId);

        // Determine plan from the razorpay subscription id prefix or look up
        // For now keep whatever planType was set during initiate; we'll update it here
        // The plan was already set in initiateUpgrade — but we need to confirm it
        // Activate: set billing period (monthly)
        OffsetDateTime now = OffsetDateTime.now();
        sub.setCurrentPeriodStart(now);
        sub.setCurrentPeriodEnd(now.plusMonths(1));

        subscriptionRepository.save(sub);
        log.info("Activated subscription {} for workspace {}", subscriptionId, sub.getWorkspace().getId());
        return toResponse(sub);
    }

    /**
     * Handles Razorpay webhook events.
     */
    @Transactional
    public void handleWebhook(String rawBody, String signature) {
        if (!razorpayService.verifyWebhookSignature(rawBody, signature)) {
            log.warn("Invalid webhook signature — ignoring");
            throw new CustomExceptions.AccessDeniedException("Invalid webhook signature");
        }

        JSONObject payload = new JSONObject(rawBody);
        String event = payload.optString("event");
        log.info("Razorpay webhook event: {}", event);

        switch (event) {
            case "subscription.activated" -> {
                String subId = payload.getJSONObject("payload")
                    .getJSONObject("subscription").getJSONObject("entity").getString("id");
                subscriptionRepository.findByRazorpaySubscriptionId(subId).ifPresent(sub -> {
                    sub.setStatus("ACTIVE");
                    OffsetDateTime now = OffsetDateTime.now();
                    sub.setCurrentPeriodStart(now);
                    sub.setCurrentPeriodEnd(now.plusMonths(1));
                    subscriptionRepository.save(sub);
                    log.info("Webhook: activated subscription {}", subId);
                });
            }
            case "subscription.cancelled", "subscription.completed" -> {
                String subId = payload.getJSONObject("payload")
                    .getJSONObject("subscription").getJSONObject("entity").getString("id");
                subscriptionRepository.findByRazorpaySubscriptionId(subId).ifPresent(sub -> {
                    sub.setStatus("CANCELLED");
                    sub.setPlanType(PlanType.FREE);
                    sub.setMonthlyPostLimit(10);
                    sub.setSeats(1);
                    subscriptionRepository.save(sub);
                    log.info("Webhook: cancelled subscription {}", subId);
                });
            }
            case "payment.failed" -> {
                log.warn("Webhook: payment failed for event payload");
            }
            default -> log.debug("Unhandled webhook event: {}", event);
        }
    }

    /**
     * Cancels subscription at period end.
     */
    @Transactional
    public SubscriptionResponse cancelSubscription(Long workspaceId) {
        Subscription sub = subscriptionRepository.findByWorkspaceId(workspaceId)
            .orElseThrow(() -> new CustomExceptions.ResourceNotFoundException("Subscription", workspaceId));

        razorpayService.cancelSubscription(sub.getRazorpaySubscriptionId());
        sub.setCancelAtPeriodEnd(true);
        subscriptionRepository.save(sub);
        return toResponse(sub);
    }

    // ── Internals ──────────────────────────────────────────────────────────────

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
            sub.getRazorpaySubscriptionId(),
            sub.getCurrentPeriodStart(),
            sub.getCurrentPeriodEnd(),
            sub.isCancelAtPeriodEnd(),
            sub.getSeats() != null ? sub.getSeats() : 1,
            sub.getMonthlyPostLimit() != null ? sub.getMonthlyPostLimit() : 30,
            sub.getPostsUsedThisMonth() != null ? sub.getPostsUsedThisMonth() : 0
        );
    }
}
