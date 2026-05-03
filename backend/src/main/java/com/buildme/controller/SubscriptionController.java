package com.buildme.controller;

import com.buildme.dto.request.CreateSubscriptionRequest;
import com.buildme.dto.request.VerifyPaymentRequest;
import com.buildme.dto.response.SubscriptionResponse;
import com.buildme.model.User;
import com.buildme.service.SubscriptionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequiredArgsConstructor
@Tag(name = "Subscriptions")
public class SubscriptionController {

    private final SubscriptionService subscriptionService;

    @GetMapping("/api/subscriptions/{workspaceId}")
    @Operation(summary = "Get workspace subscription")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<SubscriptionResponse> getSubscription(@PathVariable Long workspaceId) {
        return ResponseEntity.ok(subscriptionService.getSubscription(workspaceId));
    }

    /**
     * Creates a Stripe Checkout Session and returns sessionId + publishableKey + url.
     * Frontend redirects to the Stripe-hosted checkout page.
     */
    @PostMapping("/api/subscriptions/initiate")
    @Operation(summary = "Create Stripe Checkout Session for plan upgrade")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<Map<String, Object>> initiateUpgrade(
        @Valid @RequestBody CreateSubscriptionRequest request,
        @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(subscriptionService.initiateUpgrade(request.workspaceId(), request.planType()));
    }

    /**
     * Verifies the completed Stripe Checkout Session and activates the plan.
     * Called after Stripe redirects back to success URL with ?session_id=cs_xxx
     */
    @PostMapping("/api/subscriptions/verify")
    @Operation(summary = "Verify Stripe session and activate subscription")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<SubscriptionResponse> verifyPayment(
        @Valid @RequestBody VerifyPaymentRequest request
    ) {
        return ResponseEntity.ok(subscriptionService.verifyAndActivate(request.sessionId()));
    }

    @PostMapping("/api/subscriptions/{workspaceId}/cancel")
    @Operation(summary = "Cancel subscription at period end")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<SubscriptionResponse> cancelSubscription(@PathVariable Long workspaceId) {
        return ResponseEntity.ok(subscriptionService.cancelSubscription(workspaceId));
    }
}
