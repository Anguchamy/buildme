package com.buildme.service;

import com.buildme.exception.CustomExceptions;
import com.buildme.model.MediaAsset;
import com.buildme.model.Post;
import com.buildme.model.ScheduledPost;
import com.buildme.model.SocialAccount;
import com.buildme.model.Workspace;
import com.buildme.repository.MediaAssetRepository;
import com.buildme.repository.PostRepository;
import com.buildme.repository.ScheduledPostRepository;
import com.buildme.repository.SocialAccountRepository;
import com.buildme.repository.WorkspaceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Central workspace-scoped authorization checks. Every controller endpoint
 * that accepts a resource id (workspaceId / postId / assetId / scheduledPostId
 * / socialAccountId) must first call the matching assert* method here.
 *
 * Callers get a resolved & owner-checked entity back so they don't reload it.
 * A failed check throws AccessDeniedException (403) or ResourceNotFoundException
 * (404) — never leak "exists but not yours" as a distinct signal.
 */
@Service
@RequiredArgsConstructor
public class WorkspaceAuthorization {

    private final WorkspaceRepository workspaceRepository;
    private final PostRepository postRepository;
    private final MediaAssetRepository mediaAssetRepository;
    private final ScheduledPostRepository scheduledPostRepository;
    private final SocialAccountRepository socialAccountRepository;

    /** Asserts the user owns the workspace. Returns it for reuse. */
    @Transactional(readOnly = true)
    public Workspace assertWorkspaceOwner(Long userId, Long workspaceId) {
        if (userId == null || workspaceId == null) {
            throw new CustomExceptions.AccessDeniedException();
        }
        Workspace ws = workspaceRepository.findById(workspaceId)
            .orElseThrow(() -> new CustomExceptions.ResourceNotFoundException("Workspace", workspaceId));
        if (!ws.getOwner().getId().equals(userId)) {
            throw new CustomExceptions.AccessDeniedException();
        }
        return ws;
    }

    /** Asserts the post exists and belongs to a workspace the user owns. */
    @Transactional(readOnly = true)
    public Post assertPostOwner(Long userId, Long postId) {
        Post post = postRepository.findById(postId)
            .orElseThrow(() -> new CustomExceptions.ResourceNotFoundException("Post", postId));
        assertWorkspaceOwner(userId, post.getWorkspace().getId());
        return post;
    }

    /**
     * Asserts the post is in this workspace AND the user owns the workspace.
     * Use when a URL carries both workspaceId and postId so we don't leak
     * "wrong workspace" as a distinct signal from "wrong owner".
     */
    @Transactional(readOnly = true)
    public Post assertPostInWorkspace(Long userId, Long workspaceId, Long postId) {
        Post post = postRepository.findById(postId)
            .orElseThrow(() -> new CustomExceptions.ResourceNotFoundException("Post", postId));
        if (!post.getWorkspace().getId().equals(workspaceId)) {
            throw new CustomExceptions.ResourceNotFoundException("Post", postId);
        }
        assertWorkspaceOwner(userId, workspaceId);
        return post;
    }

    /** Asserts the media asset exists in this workspace AND user owns it. */
    @Transactional(readOnly = true)
    public MediaAsset assertMediaInWorkspace(Long userId, Long workspaceId, Long assetId) {
        MediaAsset asset = mediaAssetRepository.findById(assetId)
            .orElseThrow(() -> new CustomExceptions.ResourceNotFoundException("MediaAsset", assetId));
        if (!asset.getWorkspace().getId().equals(workspaceId)) {
            throw new CustomExceptions.ResourceNotFoundException("MediaAsset", assetId);
        }
        assertWorkspaceOwner(userId, workspaceId);
        return asset;
    }

    /** Asserts the scheduled post belongs to a workspace the user owns. */
    @Transactional(readOnly = true)
    public ScheduledPost assertScheduledPostOwner(Long userId, Long scheduledPostId) {
        ScheduledPost sp = scheduledPostRepository.findById(scheduledPostId)
            .orElseThrow(() -> new CustomExceptions.ResourceNotFoundException("ScheduledPost", scheduledPostId));
        assertWorkspaceOwner(userId, sp.getPost().getWorkspace().getId());
        return sp;
    }

    /** Asserts the social account belongs to a workspace the user owns. */
    @Transactional(readOnly = true)
    public SocialAccount assertSocialAccountInWorkspace(Long userId, Long workspaceId, String platformAccountId) {
        assertWorkspaceOwner(userId, workspaceId);
        return socialAccountRepository.findByWorkspaceId(workspaceId).stream()
            .filter(a -> a.getAccountId().equals(platformAccountId))
            .findFirst()
            .orElseThrow(() -> new CustomExceptions.ResourceNotFoundException(
                "SocialAccount not found: " + platformAccountId));
    }
}
