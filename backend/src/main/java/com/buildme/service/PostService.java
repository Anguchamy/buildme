package com.buildme.service;

import com.buildme.dto.request.CreatePostRequest;
import com.buildme.dto.request.SchedulePostRequest;
import com.buildme.dto.request.UpdatePostRequest;
import com.buildme.dto.response.MediaAssetResponse;
import com.buildme.dto.response.PostResponse;
import com.buildme.exception.CustomExceptions;
import com.buildme.model.*;
import com.buildme.repository.MediaAssetRepository;
import com.buildme.repository.PostRepository;
import com.buildme.repository.ScheduledPostRepository;
import com.buildme.repository.SocialAccountRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class PostService {

    private final PostRepository postRepository;
    private final ScheduledPostRepository scheduledPostRepository;
    private final MediaAssetRepository mediaAssetRepository;
    private final SocialAccountRepository socialAccountRepository;
    private final WorkspaceService workspaceService;
    private final UserService userService;
    private final MediaService mediaService;

    @Transactional
    public PostResponse create(Long workspaceId, Long userId, CreatePostRequest request) {
        Workspace workspace = workspaceService.getWorkspace(workspaceId);
        User author = userService.getUserById(userId);

        List<MediaAsset> mediaAssets = new ArrayList<>();
        if (request.mediaAssetIds() != null) {
            mediaAssets = mediaAssetRepository.findAllById(request.mediaAssetIds());
        }

        // "Post Now" from the composer sends status=PUBLISHED. Treat that as
        // SCHEDULED with scheduledAt=now so the scheduler creates ScheduledPost
        // rows per platform and actually pushes to the social networks on its
        // next tick. Previously we'd just save a Post row labelled PUBLISHED
        // and never call any platform service — the UI showed Published but
        // nothing actually went to Twitter / Instagram / LinkedIn.
        PostStatus requestedStatus = request.status() != null ? request.status() : PostStatus.DRAFT;
        boolean postNow = requestedStatus == PostStatus.PUBLISHED;
        OffsetDateTime scheduledAt = request.scheduledAt();
        if (postNow) {
            scheduledAt = OffsetDateTime.now();
            requestedStatus = PostStatus.SCHEDULED;
        }

        Post post = Post.builder()
            .workspace(workspace)
            .author(author)
            .caption(request.caption())
            .status(requestedStatus)
            .scheduledAt(scheduledAt)
            .platforms(request.platforms())
            .gridPosition(request.gridPosition())
            .notes(request.notes())
            .mediaAssets(mediaAssets)
            .build();

        Post saved = postRepository.save(post);

        if (post.getStatus() == PostStatus.SCHEDULED && post.getScheduledAt() != null) {
            createScheduledPosts(saved);
        }

        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<PostResponse> findByWorkspace(Long workspaceId, Long userId) {
        workspaceService.getWorkspace(workspaceId); // verify exists
        return postRepository.findByWorkspaceIdOrderByCreatedAtDesc(workspaceId)
            .stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public PostResponse findById(Long postId, Long userId) {
        Post post = getPost(postId);
        return toResponse(post);
    }

    @Transactional(readOnly = true)
    public List<PostResponse> findCalendarPosts(Long workspaceId, OffsetDateTime start, OffsetDateTime end) {
        return postRepository.findByWorkspaceIdAndScheduledAtBetween(workspaceId, start, end)
            .stream().map(this::toResponse).toList();
    }

    @Transactional
    public PostResponse update(Long postId, Long userId, UpdatePostRequest request) {
        Post post = getPost(postId);

        if (request.caption() != null) post.setCaption(request.caption());
        if (request.platforms() != null) post.setPlatforms(request.platforms());
        // "Post Now" path also reaches here for edits of existing drafts; same
        // PUBLISHED→SCHEDULED+now translation as in create() so the scheduler
        // can actually push to platforms.
        boolean postNow = request.status() == PostStatus.PUBLISHED;
        if (request.status() != null) {
            post.setStatus(postNow ? PostStatus.SCHEDULED : request.status());
        }
        if (postNow) {
            post.setScheduledAt(OffsetDateTime.now());
        } else if (request.scheduledAt() != null) {
            post.setScheduledAt(request.scheduledAt());
        }
        if (request.gridPosition() != null) post.setGridPosition(request.gridPosition());
        if (request.notes() != null) post.setNotes(request.notes());

        if (request.mediaAssetIds() != null) {
            List<MediaAsset> mediaAssets = mediaAssetRepository.findAllById(request.mediaAssetIds());
            post.setMediaAssets(mediaAssets);
        }

        Post saved = postRepository.save(post);

        // If this edit transitioned the post into SCHEDULED (either via the
        // explicit Schedule action or via Post Now), make sure ScheduledPost
        // rows exist so the scheduler picks it up. Without this, editing a
        // draft to PUBLISHED would silently do nothing.
        if (saved.getStatus() == PostStatus.SCHEDULED && saved.getScheduledAt() != null) {
            createScheduledPosts(saved);
        }

        return toResponse(saved);
    }

    @Transactional
    public PostResponse schedule(Long postId, Long userId, SchedulePostRequest request) {
        Post post = getPost(postId);

        post.setScheduledAt(request.scheduledAt());
        post.setStatus(PostStatus.SCHEDULED);
        if (request.platforms() != null) post.setPlatforms(request.platforms());

        Post saved = postRepository.save(post);
        createScheduledPosts(saved);
        return toResponse(saved);
    }

    @Transactional
    public void delete(Long postId, Long userId) {
        Post post = getPost(postId);
        postRepository.delete(post);
    }

    private void createScheduledPosts(Post post) {
        log.info("Creating scheduled posts for post {} ({} platforms, scheduledAt={})",
            post.getId(), post.getPlatforms().size(), post.getScheduledAt());

        // Cancel any existing pending scheduled posts
        scheduledPostRepository.findByPostId(post.getId())
            .stream()
            .filter(sp -> sp.getStatus() == ScheduledPostStatus.PENDING)
            .forEach(sp -> {
                sp.setStatus(ScheduledPostStatus.CANCELLED);
                scheduledPostRepository.save(sp);
            });

        int created = 0;
        // Create new scheduled posts per platform
        for (String platformStr : post.getPlatforms()) {
            Platform platform;
            try {
                platform = Platform.valueOf(platformStr);
            } catch (IllegalArgumentException e) {
                log.warn("Skipping unknown platform '{}' on post {}", platformStr, post.getId());
                continue;
            }

            List<SocialAccount> accounts = socialAccountRepository
                .findByWorkspaceIdAndPlatform(post.getWorkspace().getId(), platform);

            SocialAccount account = accounts.isEmpty() ? null : accounts.get(0);
            if (account == null) {
                log.warn("No connected {} account for workspace {} — ScheduledPost will be created but will fail at publish time",
                    platform, post.getWorkspace().getId());
            }

            ScheduledPost scheduledPost = ScheduledPost.builder()
                .post(post)
                .platform(platform)
                .socialAccount(account)
                .scheduledTime(post.getScheduledAt())
                .status(ScheduledPostStatus.PENDING)
                .build();

            scheduledPostRepository.save(scheduledPost);
            created++;
        }
        log.info("Created {} ScheduledPost rows for post {}", created, post.getId());
    }

    public Post getPost(Long id) {
        return postRepository.findById(id)
            .orElseThrow(() -> new CustomExceptions.ResourceNotFoundException("Post", id));
    }

    public PostResponse toResponse(Post p) {
        // Delegate to MediaService so R2 presigning is applied uniformly across
        // all post media responses (otherwise raw private-endpoint URLs leak to
        // the frontend and <img> tags show broken icons).
        List<MediaAssetResponse> mediaResponses = p.getMediaAssets().stream()
            .map(mediaService::toResponse).toList();

        return new PostResponse(
            p.getId(), p.getWorkspace().getId(),
            p.getAuthor().getId(), p.getAuthor().getFullName(),
            p.getCaption(), p.getStatus(), p.getScheduledAt(), p.getPublishedAt(),
            p.getPlatforms(), p.getGridPosition(), p.getNotes(),
            mediaResponses, p.getCreatedAt(), p.getUpdatedAt()
        );
    }
}
