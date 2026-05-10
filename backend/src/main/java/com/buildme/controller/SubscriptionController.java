package com.buildme.controller;

import com.buildme.dto.request.CreateSubscriptionRequest;
import com.buildme.dto.request.VerifyPaymentRequest;
import com.buildme.dto.response.SubscriptionResponse;
import com.buildme.service.SubscriptionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
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
     * Creates a Razorpay Order and returns orderId + keyId for the frontend checkout popup.
     */
    @PostMapping("/api/subscriptions/initiate")
    @Operation(summary = "Create Razorpay order for plan upgrade")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<Map<String, Object>> initiateUpgrade(
        @Valid @RequestBody CreateSubscriptionRequest request
    ) {
        return ResponseEntity.ok(subscriptionService.initiateUpgrade(request.workspaceId(), request.planType()));
    }

    /**
     * Verifies Razorpay payment signature and activates the subscription.
     */
    @PostMapping("/api/subscriptions/verify")
    @Operation(summary = "Verify Razorpay payment and activate subscription")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<SubscriptionResponse> verifyPayment(
        @Valid @RequestBody VerifyPaymentRequest request
    ) {
        return ResponseEntity.ok(subscriptionService.verifyAndActivate(
            request.orderId(), request.paymentId(), request.signature(),
            request.workspaceId(), request.planType()
        ));
    }

    @PostMapping("/api/subscriptions/{workspaceId}/cancel")
    @Operation(summary = "Cancel subscription at period end")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<SubscriptionResponse> cancelSubscription(@PathVariable Long workspaceId) {
        return ResponseEntity.ok(subscriptionService.cancelSubscription(workspaceId));
    }
}
