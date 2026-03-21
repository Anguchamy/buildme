package com.buildme.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateSubscriptionRequest(
    @NotNull Long workspaceId,
    @NotBlank String planType
) {}
