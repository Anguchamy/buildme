package com.buildme.service;

import com.buildme.dto.response.SubscriptionResponse;
import com.buildme.exception.CustomExceptions;
import com.buildme.model.PlanType;
import com.buildme.model.Subscription;
import com.buildme.model.Workspace;
import com.buildme.repository.SubscriptionRepository;
import com.buildme.repository.WorkspaceRepository;
import com.stripe.model.checkout.Session;
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
    private final StripeService stripeService;

    @Transactional
    public SubscriptionResponse getSubscription(Long workspaceId) {
        return toResponse(getOrCreate(workspaceId));
    }

    /**
     * Creates a Stripe Checkout Session for the plan upgrade.
     * Returns: sessionId, publishableKey, url.
     */
    @Transactional
    public Map<String, Object> initiateUpgrade(Long workspaceId, String planType) {
        validatePlanType(planType);
        Subscription sub = getOrCreate(workspaceId);
        sub.setStatus("PENDING");
        sub.setPaymentProvider("STRIPE");
        subscriptionRepository.save(sub);
        return stripeService.createCheckoutSession(planType, workspaceId);
    }

    /**
     * Verifies the Stripe Checkout Session and activates the subscription.
     */
    @Transactional
    public SubscriptionResponse verifyAndActivate(String sessionId) {
        Session session = stripeService.retrieveSession(sessionId);

        String planType = session.getMetadata().get("planType");
        Long workspaceId = Long.parseLong(session.getMetadata().get("workspaceId"));

        Subscription sub = getOrCreate(workspaceId);

        PlanType newPlan = PlanType.valueOf(planType);
        sub.setStatus("ACTIVE");
        sub.setStripeSessionId(sessionId);
        sub.setStripePaymentIntentId(session.getPaymentIntent());
        sub.setPlanType(newPlan);
        sub.setSeats(PlanType.AGENCY == newPlan ? 10 : 3);
        sub.setMonthlyPostLimit(null); // unlimited for paid plans
        sub.setPaymentProvider("STRIPE");

        OffsetDateTime now = OffsetDateTime.now();
        sub.setCurrentPeriodStart(now);
        sub.setCurrentPeriodEnd(now.plusMonths(1));
        sub.setCancelAtPeriodEnd(false);

        subscriptionRepository.save(sub);
        log.info("Activated {} plan for workspace {} via Stripe session={}", newPlan, workspaceId, sessionId);
        return toResponse(sub);
    }

    /**
     * Cancels subscription at period end (local only — no Stripe API call needed for one-time payments).
     */
    @Transactional
    public SubscriptionResponse cancelSubscription(Long workspaceId) {
        Subscription sub = subscriptionRepository.findByWorkspaceId(workspaceId)
            .orElseThrow(() -> new CustomExceptions.ResourceNotFoundException("Subscription", workspaceId));
        sub.setCancelAtPeriodEnd(true);
        subscriptionRepository.save(sub);
        log.info("Marked subscription for workspace {} to cancel at period end", workspaceId);
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
            sub.getStripeSessionId(),
            sub.getCurrentPeriodStart(),
            sub.getCurrentPeriodEnd(),
            sub.isCancelAtPeriodEnd(),
            sub.getSeats() != null ? sub.getSeats() : 1,
            sub.getMonthlyPostLimit() != null ? sub.getMonthlyPostLimit() : 10,
            sub.getPostsUsedThisMonth() != null ? sub.getPostsUsedThisMonth() : 0
        );
    }
}
