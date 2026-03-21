package com.buildme.service;

import com.buildme.dto.request.CreateWorkspaceRequest;
import com.buildme.dto.response.WorkspaceResponse;
import com.buildme.exception.CustomExceptions;
import com.buildme.model.User;
import com.buildme.model.Workspace;
import com.buildme.repository.WorkspaceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.util.List;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class WorkspaceService {

    private final WorkspaceRepository workspaceRepository;
    private final UserService userService;

    @Transactional
    public WorkspaceResponse create(Long userId, CreateWorkspaceRequest request) {
        User owner = userService.getUserById(userId);
        String slug = generateUniqueSlug(request.name());

        Workspace workspace = Workspace.builder()
            .name(request.name())
            .slug(slug)
            .description(request.description())
            .logoUrl(request.logoUrl())
            .owner(owner)
            .build();

        return toResponse(workspaceRepository.save(workspace));
    }

    @Transactional(readOnly = true)
    public List<WorkspaceResponse> findAllByOwner(Long userId) {
        return workspaceRepository.findAllByOwnerId(userId)
            .stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public WorkspaceResponse findById(Long id, Long userId) {
        Workspace workspace = getWorkspace(id);
        checkAccess(workspace, userId);
        return toResponse(workspace);
    }

    @Transactional
    public WorkspaceResponse update(Long id, Long userId, CreateWorkspaceRequest request) {
        Workspace workspace = getWorkspace(id);
        checkOwnership(workspace, userId);

        workspace.setName(request.name());
        if (request.description() != null) workspace.setDescription(request.description());
        if (request.logoUrl() != null) workspace.setLogoUrl(request.logoUrl());

        return toResponse(workspaceRepository.save(workspace));
    }

    @Transactional
    public void delete(Long id, Long userId) {
        Workspace workspace = getWorkspace(id);
        checkOwnership(workspace, userId);
        workspaceRepository.delete(workspace);
    }

    public Workspace getWorkspace(Long id) {
        return workspaceRepository.findById(id)
            .orElseThrow(() -> new CustomExceptions.ResourceNotFoundException("Workspace", id));
    }

    private void checkAccess(Workspace workspace, Long userId) {
        if (!workspace.getOwner().getId().equals(userId)) {
            throw new CustomExceptions.AccessDeniedException();
        }
    }

    private void checkOwnership(Workspace workspace, Long userId) {
        if (!workspace.getOwner().getId().equals(userId)) {
            throw new CustomExceptions.AccessDeniedException("Only the workspace owner can perform this action");
        }
    }

    private String generateUniqueSlug(String name) {
        String base = slugify(name);
        String slug = base;
        int counter = 1;
        while (workspaceRepository.existsBySlug(slug)) {
            slug = base + "-" + counter++;
        }
        return slug;
    }

    private String slugify(String input) {
        String normalized = Normalizer.normalize(input, Normalizer.Form.NFD);
        Pattern pattern = Pattern.compile("\\p{InCombiningDiacriticalMarks}+");
        return pattern.matcher(normalized).replaceAll("")
            .toLowerCase()
            .replaceAll("[^a-z0-9\\s-]", "")
            .replaceAll("\\s+", "-")
            .replaceAll("-+", "-")
            .replaceAll("^-|-$", "");
    }

    public WorkspaceResponse toResponse(Workspace w) {
        return new WorkspaceResponse(
            w.getId(), w.getName(), w.getSlug(), w.getDescription(), w.getLogoUrl(),
            w.getOwner().getId(), w.getOwner().getFullName(), w.getPlanType(), w.getCreatedAt()
        );
    }
}
