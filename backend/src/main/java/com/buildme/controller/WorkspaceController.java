package com.buildme.controller;

import com.buildme.dto.request.CreateWorkspaceRequest;
import com.buildme.dto.response.WorkspaceResponse;
import com.buildme.model.User;
import com.buildme.service.WorkspaceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/workspaces")
@RequiredArgsConstructor
@Tag(name = "Workspaces")
@SecurityRequirement(name = "bearerAuth")
public class WorkspaceController {

    private final WorkspaceService workspaceService;

    @PostMapping
    @Operation(summary = "Create a new workspace")
    public ResponseEntity<WorkspaceResponse> create(
        @AuthenticationPrincipal User user,
        @Valid @RequestBody CreateWorkspaceRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(workspaceService.create(user.getId(), request));
    }

    @GetMapping
    @Operation(summary = "List workspaces owned by current user")
    public ResponseEntity<List<WorkspaceResponse>> list(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(workspaceService.findAllByOwner(user.getId()));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get workspace by ID")
    public ResponseEntity<WorkspaceResponse> getById(
        @PathVariable Long id,
        @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(workspaceService.findById(id, user.getId()));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update workspace")
    public ResponseEntity<WorkspaceResponse> update(
        @PathVariable Long id,
        @AuthenticationPrincipal User user,
        @Valid @RequestBody CreateWorkspaceRequest request
    ) {
        return ResponseEntity.ok(workspaceService.update(id, user.getId(), request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete workspace")
    public ResponseEntity<Void> delete(
        @PathVariable Long id,
        @AuthenticationPrincipal User user
    ) {
        workspaceService.delete(id, user.getId());
        return ResponseEntity.noContent().build();
    }
}
