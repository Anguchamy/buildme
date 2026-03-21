package com.buildme.controller;

import com.buildme.dto.request.CreateSubscriptionRequest;
import com.buildme.dto.request.VerifyPaymentRequest;
import com.buildme.dto.response.SubscriptionResponse;
import com.buildme.model.User;
import com.buildme.service.SubscriptionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
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

    @PostMapping("/api/subscriptions/initiate")
    @Operation(summary = "Initiate subscription upgrade — returns Razorpay subscription ID")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<Map<String, String>> initiateUpgrade(
        @Valid @RequestBody CreateSubscriptionRequest request,
        @AuthenticationPrincipal User user
    ) {
        Map<String, String> result = subscriptionService.initiateUpgrade(
            request.workspaceId(), request.planType()
        );
        return ResponseEntity.ok(result);
    }

    @PostMapping("/api/subscriptions/verify")
    @Operation(summary = "Verify Razorpay payment and activate subscription")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<SubscriptionResponse> verifyPayment(
        @Valid @RequestBody VerifyPaymentRequest request
    ) {
        return ResponseEntity.ok(subscriptionService.verifyAndActivate(
            request.razorpayPaymentId(),
            request.razorpaySubscriptionId(),
            request.razorpaySignature()
        ));
    }

    @PostMapping("/api/subscriptions/{workspaceId}/cancel")
    @Operation(summary = "Cancel subscription at period end")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<SubscriptionResponse> cancelSubscription(@PathVariable Long workspaceId) {
        return ResponseEntity.ok(subscriptionService.cancelSubscription(workspaceId));
    }

    // Razorpay webhook — PUBLIC, verified by signature
    @PostMapping("/api/razorpay/webhook")
    @Operation(summary = "Razorpay webhook endpoint (public)")
    public ResponseEntity<Void> webhook(
        HttpServletRequest request,
        @RequestBody String rawBody
    ) {
        String signature = request.getHeader("X-Razorpay-Signature");
        subscriptionService.handleWebhook(rawBody, signature);
        return ResponseEntity.ok().build();
    }
}
