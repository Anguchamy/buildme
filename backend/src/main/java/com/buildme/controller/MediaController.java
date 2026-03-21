package com.buildme.controller;

import com.buildme.dto.request.UploadMediaRequest;
import com.buildme.dto.response.MediaAssetResponse;
import com.buildme.model.User;
import com.buildme.service.MediaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/workspaces/{workspaceId}/media")
@RequiredArgsConstructor
@Tag(name = "Media")
@SecurityRequirement(name = "bearerAuth")
public class MediaController {

    private final MediaService mediaService;

    @PostMapping(value = "/upload", consumes = "multipart/form-data")
    @Operation(summary = "Direct multipart upload (dev)")
    public ResponseEntity<MediaAssetResponse> uploadDirect(
        @PathVariable Long workspaceId,
        @AuthenticationPrincipal User user,
        @RequestParam("file") MultipartFile file
    ) {
        return ResponseEntity.ok(mediaService.uploadDirect(workspaceId, user.getId(), file));
    }

    @PostMapping("/upload-url")
    @Operation(summary = "Get presigned S3 upload URL")
    public ResponseEntity<Map<String, Object>> getUploadUrl(
        @PathVariable Long workspaceId,
        @AuthenticationPrincipal User user,
        @Valid @RequestBody UploadMediaRequest request
    ) {
        Map<String, Object> result = mediaService.generateUploadUrl(
            workspaceId, user.getId(), request.fileName(), request.contentType(), request.fileSize()
        );
        return ResponseEntity.ok(result);
    }

    @PostMapping("/{assetId}/confirm")
    @Operation(summary = "Confirm S3 upload completed")
    public ResponseEntity<MediaAssetResponse> confirmUpload(
        @PathVariable Long workspaceId,
        @PathVariable Long assetId,
        @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(mediaService.confirmUpload(assetId, user.getId()));
    }

    @GetMapping
    @Operation(summary = "List media assets")
    public ResponseEntity<List<MediaAssetResponse>> list(
        @PathVariable Long workspaceId,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(mediaService.findByWorkspace(workspaceId, page, size));
    }

    @DeleteMapping("/{assetId}")
    @Operation(summary = "Delete a media asset")
    public ResponseEntity<Void> delete(
        @PathVariable Long workspaceId,
        @PathVariable Long assetId,
        @AuthenticationPrincipal User user
    ) {
        mediaService.delete(assetId, user.getId());
        return ResponseEntity.noContent().build();
    }
}
