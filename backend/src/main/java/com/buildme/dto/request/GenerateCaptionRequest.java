package com.buildme.dto.request;

import com.buildme.model.Platform;
import jakarta.validation.constraints.NotBlank;

public record GenerateCaptionRequest(
    @NotBlank String topic,
    String tone,
    Platform platform,
    Boolean includeHashtags,
    Boolean includeEmojis
) {}
