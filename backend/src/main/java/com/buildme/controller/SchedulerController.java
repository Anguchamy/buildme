package com.buildme.controller;

import com.buildme.exception.CustomExceptions;
import com.buildme.model.User;
import com.buildme.service.SchedulerService;
import com.buildme.service.WorkspaceAuthorization;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/scheduler")
@RequiredArgsConstructor
@Tag(name = "Admin - Scheduler")
@SecurityRequirement(name = "bearerAuth")
public class SchedulerController {

    private final SchedulerService schedulerService;
    private final WorkspaceAuthorization auth;

    @PostMapping("/trigger/{scheduledPostId}")
    @Operation(summary = "Manually trigger a scheduled post (must own the post's workspace)")
    public ResponseEntity<Map<String, String>> triggerPost(
        @PathVariable Long scheduledPostId,
        @AuthenticationPrincipal User user
    ) {
        // "/admin/" in the URL is a naming legacy — this only lets a user
        // re-trigger their OWN scheduled posts (retry a failed publish, e.g.).
        auth.assertScheduledPostOwner(user.getId(), scheduledPostId);
        schedulerService.triggerManual(scheduledPostId);
        return ResponseEntity.ok(Map.of("status", "triggered", "id", scheduledPostId.toString()));
    }

    @PostMapping("/run")
    @Operation(summary = "Manually run the scheduler cycle (disabled — no admin role modeled)")
    public ResponseEntity<Map<String, String>> runScheduler() {
        // Global scheduler tick is a real admin action, and no admin role is
        // modeled today. Deny to close off the pre-fix behavior where any
        // logged-in user could kick the scheduler. Re-enable behind a proper
        // admin check when a role/permission system lands.
        throw new CustomExceptions.AccessDeniedException();
    }
}
