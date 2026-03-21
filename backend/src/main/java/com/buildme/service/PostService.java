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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PostService {

    private final PostRepository postRepository;
    private final ScheduledPostRepository scheduledPostRepository;
    private final MediaAssetRepository mediaAssetRepository;
    private final SocialAccountRepository socialAccountRepository;
    private final WorkspaceService workspaceService;
    private final UserService userService;

    @Transactional
    public PostResponse create(Long workspaceId, Long userId, CreatePostRequest request) {
        Workspace workspace = workspaceService.getWorkspace(workspaceId);
        User author = userService.getUserById(userId);

        List<MediaAsset> mediaAssets = new ArrayList<>();
        if (request.mediaAssetIds() != null) {
            mediaAssets = mediaAssetRepository.findAllById(request.mediaAssetIds());
        }

        Post post = Post.builder()
            .workspace(workspace)
            .author(author)
            .caption(request.caption())
            .status(request.status() != null ? request.status() : PostStatus.DRAFT)
            .scheduledAt(request.scheduledAt())
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
        if (request.status() != null) post.setStatus(request.status());
        if (request.scheduledAt() != null) post.setScheduledAt(request.scheduledAt());
        if (request.gridPosition() != null) post.setGridPosition(request.gridPosition());
        if (request.notes() != null) post.setNotes(request.notes());

        if (request.mediaAssetIds() != null) {
            List<MediaAsset> mediaAssets = mediaAssetRepository.findAllById(request.mediaAssetIds());
            post.setMediaAssets(mediaAssets);
        }

        Post saved = postRepository.save(post);
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
        // Cancel any existing pending scheduled posts
        scheduledPostRepository.findByPostId(post.getId())
            .stream()
            .filter(sp -> sp.getStatus() == ScheduledPostStatus.PENDING)
            .forEach(sp -> {
                sp.setStatus(ScheduledPostStatus.CANCELLED);
                scheduledPostRepository.save(sp);
            });

        // Create new scheduled posts per platform
        for (String platformStr : post.getPlatforms()) {
            Platform platform;
            try {
                platform = Platform.valueOf(platformStr);
            } catch (IllegalArgumentException e) {
                continue;
            }

            List<SocialAccount> accounts = socialAccountRepository
                .findByWorkspaceIdAndPlatform(post.getWorkspace().getId(), platform);

            SocialAccount account = accounts.isEmpty() ? null : accounts.get(0);

            ScheduledPost scheduledPost = ScheduledPost.builder()
                .post(post)
                .platform(platform)
                .socialAccount(account)
                .scheduledTime(post.getScheduledAt())
                .status(ScheduledPostStatus.PENDING)
                .build();

            scheduledPostRepository.save(scheduledPost);
        }
    }

    public Post getPost(Long id) {
        return postRepository.findById(id)
            .orElseThrow(() -> new CustomExceptions.ResourceNotFoundException("Post", id));
    }

    public PostResponse toResponse(Post p) {
        List<MediaAssetResponse> mediaResponses = p.getMediaAssets().stream()
            .map(ma -> new MediaAssetResponse(
                ma.getId(), ma.getFileName(), ma.getOriginalName(), ma.getContentType(),
                ma.getFileSize(), ma.getUrl(), ma.getThumbnailUrl(), ma.getWidth(),
                ma.getHeight(), ma.getDurationSeconds(), ma.getSource(),
                ma.getExternalId(), ma.getCreatedAt()
            )).toList();

        return new PostResponse(
            p.getId(), p.getWorkspace().getId(),
            p.getAuthor().getId(), p.getAuthor().getFullName(),
            p.getCaption(), p.getStatus(), p.getScheduledAt(), p.getPublishedAt(),
            p.getPlatforms(), p.getGridPosition(), p.getNotes(),
            mediaResponses, p.getCreatedAt(), p.getUpdatedAt()
        );
    }
}
