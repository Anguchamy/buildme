package com.buildme.dto.request;

import jakarta.validation.constraints.NotBlank;

public record UploadMediaRequest(
    @NotBlank String fileName,
    @NotBlank String contentType,
    Long fileSize
) {}
