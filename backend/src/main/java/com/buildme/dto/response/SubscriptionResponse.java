package com.buildme.dto.response;

import java.time.OffsetDateTime;

public record SubscriptionResponse(
    Long id,
    Long workspaceId,
    String planType,
    String status,
    String razorpaySubscriptionId,
    OffsetDateTime currentPeriodStart,
    OffsetDateTime currentPeriodEnd,
    boolean cancelAtPeriodEnd,
    int seats,
    int monthlyPostLimit,
    int postsUsedThisMonth
) {}
