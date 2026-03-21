package com.buildme.controller;

import com.buildme.dto.response.AnalyticsResponse;
import com.buildme.service.AnalyticsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
@Tag(name = "Analytics")
@SecurityRequirement(name = "bearerAuth")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/workspace/{workspaceId}")
    @Operation(summary = "Get workspace analytics for date range")
    public ResponseEntity<List<AnalyticsResponse>> getWorkspaceAnalytics(
        @PathVariable Long workspaceId,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        return ResponseEntity.ok(analyticsService.getWorkspaceAnalytics(workspaceId, from, to));
    }

    @GetMapping("/posts/{postId}")
    @Operation(summary = "Get analytics for a specific post")
    public ResponseEntity<List<AnalyticsResponse>> getPostAnalytics(
        @PathVariable Long postId
    ) {
        return ResponseEntity.ok(analyticsService.getPostAnalytics(postId));
    }

    @PostMapping("/workspace/{workspaceId}/sync")
    @Operation(summary = "Sync analytics from all platforms")
    public ResponseEntity<Void> syncAnalytics(@PathVariable Long workspaceId) {
        analyticsService.syncFromPlatforms(workspaceId);
        return ResponseEntity.accepted().build();
    }
}
