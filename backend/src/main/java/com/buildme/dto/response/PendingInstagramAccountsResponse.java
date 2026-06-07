package com.buildme.dto.response;

import com.buildme.dto.PendingInstagramAccount;

import java.time.OffsetDateTime;
import java.util.List;

public record PendingInstagramAccountsResponse(
    List<PendingInstagramAccount> accounts,
    OffsetDateTime expiresAt
) {}
