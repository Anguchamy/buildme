package com.buildme.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record ConnectInstagramAccountsRequest(
    @NotBlank String session,
    @NotNull List<String> igUserIds
) {}
