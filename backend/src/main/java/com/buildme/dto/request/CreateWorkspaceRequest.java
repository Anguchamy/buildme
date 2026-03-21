package com.buildme.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateWorkspaceRequest(
    @NotBlank @Size(min = 2, max = 100) String name,
    String description,
    String logoUrl
) {}
