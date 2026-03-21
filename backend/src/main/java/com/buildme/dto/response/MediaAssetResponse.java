package com.buildme.dto.response;

import com.buildme.model.MediaSource;

import java.time.OffsetDateTime;

public record MediaAssetResponse(
    Long id,
    String fileName,
    String originalName,
    String contentType,
    Long fileSize,
    String url,
    String thumbnailUrl,
    Integer width,
    Integer height,
    Integer durationSeconds,
    MediaSource source,
    String externalId,
    OffsetDateTime createdAt
) {}
