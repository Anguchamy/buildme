package com.buildme.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record VerifyPaymentRequest(
    @NotBlank String orderId,
    @NotBlank String paymentId,
    @NotBlank String signature,
    @NotNull Long workspaceId,
    @NotBlank String planType
) {}
