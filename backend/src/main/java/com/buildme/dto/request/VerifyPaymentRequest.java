package com.buildme.dto.request;

import jakarta.validation.constraints.NotBlank;

/**
 * Payload sent from the frontend after Stripe Checkout completes.
 * sessionId — the Stripe Checkout Session ID (cs_xxx)
 */
public record VerifyPaymentRequest(
    @NotBlank String sessionId
) {}
