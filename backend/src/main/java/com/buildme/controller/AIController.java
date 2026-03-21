package com.buildme.controller;

import com.buildme.dto.request.GenerateCaptionRequest;
import com.buildme.dto.response.AICaptionResponse;
import com.buildme.service.AIService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
@Tag(name = "AI Features")
@SecurityRequirement(name = "bearerAuth")
public class AIController {

    private final AIService aiService;

    @PostMapping("/generate-caption")
    @Operation(summary = "Generate AI captions for a post")
    public ResponseEntity<AICaptionResponse> generateCaption(
        @Valid @RequestBody GenerateCaptionRequest request
    ) {
        return ResponseEntity.ok(aiService.generateCaption(request));
    }

    @PostMapping("/suggest-hashtags")
    @Operation(summary = "Suggest hashtags for a topic")
    public ResponseEntity<Map<String, List<String>>> suggestHashtags(
        @RequestBody Map<String, String> request
    ) {
        List<String> hashtags = aiService.suggestHashtags(
            request.get("topic"),
            request.getOrDefault("platform", "general")
        );
        return ResponseEntity.ok(Map.of("hashtags", hashtags));
    }

    @GetMapping("/best-time")
    @Operation(summary = "Get best time to post for a workspace and platform")
    public ResponseEntity<Map<String, String>> getBestTime(
        @RequestParam Long workspaceId,
        @RequestParam String platform
    ) {
        String bestTime = aiService.getBestTimeToPost(workspaceId, platform);
        return ResponseEntity.ok(Map.of("bestTime", bestTime, "platform", platform));
    }
}
