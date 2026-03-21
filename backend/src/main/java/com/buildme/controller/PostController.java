package com.buildme.controller;

import com.buildme.dto.request.CreatePostRequest;
import com.buildme.dto.request.SchedulePostRequest;
import com.buildme.dto.request.UpdatePostRequest;
import com.buildme.dto.response.PostResponse;
import com.buildme.model.User;
import com.buildme.service.PostService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/workspaces/{workspaceId}/posts")
@RequiredArgsConstructor
@Tag(name = "Posts")
@SecurityRequirement(name = "bearerAuth")
public class PostController {

    private final PostService postService;

    @PostMapping
    @Operation(summary = "Create a post")
    public ResponseEntity<PostResponse> create(
        @PathVariable Long workspaceId,
        @AuthenticationPrincipal User user,
        @Valid @RequestBody CreatePostRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(postService.create(workspaceId, user.getId(), request));
    }

    @GetMapping
    @Operation(summary = "List posts in a workspace")
    public ResponseEntity<List<PostResponse>> list(
        @PathVariable Long workspaceId,
        @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(postService.findByWorkspace(workspaceId, user.getId()));
    }

    @GetMapping("/calendar")
    @Operation(summary = "Get posts for calendar view")
    public ResponseEntity<List<PostResponse>> calendar(
        @PathVariable Long workspaceId,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime start,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime end
    ) {
        return ResponseEntity.ok(postService.findCalendarPosts(workspaceId, start, end));
    }

    @GetMapping("/{postId}")
    @Operation(summary = "Get post by ID")
    public ResponseEntity<PostResponse> getById(
        @PathVariable Long workspaceId,
        @PathVariable Long postId,
        @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(postService.findById(postId, user.getId()));
    }

    @PutMapping("/{postId}")
    @Operation(summary = "Update a post")
    public ResponseEntity<PostResponse> update(
        @PathVariable Long workspaceId,
        @PathVariable Long postId,
        @AuthenticationPrincipal User user,
        @RequestBody UpdatePostRequest request
    ) {
        return ResponseEntity.ok(postService.update(postId, user.getId(), request));
    }

    @PostMapping("/{postId}/schedule")
    @Operation(summary = "Schedule a post")
    public ResponseEntity<PostResponse> schedule(
        @PathVariable Long workspaceId,
        @PathVariable Long postId,
        @AuthenticationPrincipal User user,
        @Valid @RequestBody SchedulePostRequest request
    ) {
        return ResponseEntity.ok(postService.schedule(postId, user.getId(), request));
    }

    @DeleteMapping("/{postId}")
    @Operation(summary = "Delete a post")
    public ResponseEntity<Void> delete(
        @PathVariable Long workspaceId,
        @PathVariable Long postId,
        @AuthenticationPrincipal User user
    ) {
        postService.delete(postId, user.getId());
        return ResponseEntity.noContent().build();
    }
}
