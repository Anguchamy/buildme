package com.buildme.controller;

import com.buildme.service.MediaService;
import com.buildme.util.MediaTokenUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Public, token-gated media endpoint for external ingestion (Instagram, etc).
 *
 * Why this exists: R2 presigned GET URLs were not working reliably with
 * Instagram's server-side fetcher — it kept rejecting with "Only photo or
 * video can be accepted as media type" regardless of `response-content-type`
 * overrides. Going through our own backend lets us guarantee a 200 with the
 * correct Content-Type, no CORS or signature quirks. Token is HMAC-signed
 * with a short TTL so the URL isn't enumerable.
 */
@RestController
@RequestMapping("/api/public/media")
@RequiredArgsConstructor
@Tag(name = "Public Media")
public class PublicMediaController {

    private final MediaService mediaService;
    private final MediaTokenUtil mediaTokenUtil;

    @GetMapping("/{assetId}")
    @Operation(summary = "Stream media via signed token (no auth)")
    public ResponseEntity<byte[]> getMedia(
        @PathVariable Long assetId,
        @RequestParam("t") String token
    ) {
        Long verifiedId = mediaTokenUtil.verify(token);
        if (verifiedId == null || !verifiedId.equals(assetId)) {
            return ResponseEntity.status(403).build();
        }
        // workspaceId isn't used inside MediaService.getFile, just look up by assetId.
        return mediaService.getFile(0L, assetId);
    }
}
