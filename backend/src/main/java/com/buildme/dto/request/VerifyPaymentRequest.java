package com.buildme.dto.request;

import jakarta.validation.constraints.NotBlank;

public record VerifyPaymentRequest(
    @NotBlank String razorpayPaymentId,
    @NotBlank String razorpaySubscriptionId,
    @NotBlank String razorpaySignature
) {}
