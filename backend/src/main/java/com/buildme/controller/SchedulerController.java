package com.buildme.controller;

import com.buildme.service.SchedulerService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/scheduler")
@RequiredArgsConstructor
@Tag(name = "Admin - Scheduler")
@SecurityRequirement(name = "bearerAuth")
public class SchedulerController {

    private final SchedulerService schedulerService;

    @PostMapping("/trigger/{scheduledPostId}")
    @Operation(summary = "Manually trigger a scheduled post (admin)")
    public ResponseEntity<Map<String, String>> triggerPost(
        @PathVariable Long scheduledPostId
    ) {
        schedulerService.triggerManual(scheduledPostId);
        return ResponseEntity.ok(Map.of("status", "triggered", "id", scheduledPostId.toString()));
    }

    @PostMapping("/run")
    @Operation(summary = "Manually run the scheduler cycle (admin)")
    public ResponseEntity<Map<String, String>> runScheduler() {
        schedulerService.processScheduledPosts();
        return ResponseEntity.ok(Map.of("status", "completed"));
    }
}
