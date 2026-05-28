package com.buildme.service;

import com.buildme.model.NotificationType;
import com.buildme.model.Post;
import com.buildme.model.PostStatus;
import com.buildme.model.ScheduledPost;
import com.buildme.model.ScheduledPostStatus;
import com.buildme.repository.PostRepository;
import com.buildme.repository.ScheduledPostRepository;
import com.buildme.service.platform.SocialMediaService;
import com.buildme.util.DateUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SchedulerService {

    private static final int MAX_RETRIES = 3;
    private static final int MAX_POSTS_PER_RUN = 50;

    private final ScheduledPostRepository scheduledPostRepository;
    private final PostRepository postRepository;
    private final List<SocialMediaService> platformServices;
    private final NotificationService notificationService;

    private Map<com.buildme.model.Platform, SocialMediaService> platformServiceMap;

    @jakarta.annotation.PostConstruct
    public void init() {
        platformServiceMap = platformServices.stream()
            .collect(Collectors.toMap(SocialMediaService::getPlatform, Function.identity()));
        log.info("Scheduler initialized with {} platform services: {}", platformServiceMap.size(), platformServiceMap.keySet());
    }

    /**
     * Main scheduler tick: runs every 30 seconds.
     * Processes posts that are due and retries eligible failed posts.
     */
    @Scheduled(fixedDelay = 30_000)
    public void processScheduledPosts() {
        log.debug("Scheduler tick at {}", OffsetDateTime.now());
        AtomicInteger processed = new AtomicInteger(0);

        try {
            // 1. Process due pending posts
            List<ScheduledPost> duePosts = scheduledPostRepository
                .findByStatusAndScheduledTimeBefore(ScheduledPostStatus.PENDING, OffsetDateTime.now());

            for (ScheduledPost sp : duePosts) {
                if (processed.get() >= MAX_POSTS_PER_RUN) {
                    log.warn("Scheduler: reached max posts per run ({}), deferring rest", MAX_POSTS_PER_RUN);
                    break;
                }
                processPost(sp);
                processed.incrementAndGet();
            }

            // 2. Retry eligible failed posts
            List<ScheduledPost> retryPosts = scheduledPostRepository
                .findFailedForRetry(ScheduledPostStatus.FAILED, OffsetDateTime.now());

            for (ScheduledPost sp : retryPosts) {
                if (processed.get() >= MAX_POSTS_PER_RUN) break;
                log.info("Scheduler: retrying post {} on {} (attempt {})", sp.getPost().getId(), sp.getPlatform(), sp.getRetryCount() + 1);
                processPost(sp);
                processed.incrementAndGet();
            }

            if (processed.get() > 0) {
                log.info("Scheduler: processed {} scheduled posts", processed.get());
            }

        } catch (Exception e) {
            log.error("Scheduler: unexpected error during tick", e);
        }
    }

    /**
     * Hourly cleanup: mark posts stuck in PROCESSING (> 10 minutes) as FAILED.
     */
    @Scheduled(fixedDelay = 3_600_000)
    public void cleanupStuckPosts() {
        OffsetDateTime staleThreshold = OffsetDateTime.now().minusMinutes(10);
        List<ScheduledPost> stuck = scheduledPostRepository
            .findByStatusAndScheduledTimeBefore(ScheduledPostStatus.PROCESSING, staleThreshold);

        for (ScheduledPost sp : stuck) {
            log.warn("Scheduler: marking stuck PROCESSING post {} as FAILED (platform={})", sp.getId(), sp.getPlatform());
            sp.setStatus(ScheduledPostStatus.FAILED);
            sp.setErrorMessage("Timed out — stuck in PROCESSING state");
            sp.setRetryCount(MAX_RETRIES); // No retry for stuck posts
            sp.setNextRetryAt(null);
            scheduledPostRepository.save(sp);
        }

        if (!stuck.isEmpty()) {
            log.info("Scheduler: cleaned up {} stuck posts", stuck.size());
        }
    }

    /**
     * Process a single ScheduledPost: publish to platform and handle success/failure.
     */
    @Transactional
    public void processPost(ScheduledPost sp) {
        // Guard: only process PENDING or FAILED (retry-eligible)
        if (sp.getStatus() == ScheduledPostStatus.PUBLISHED || sp.getStatus() == ScheduledPostStatus.CANCELLED) {
            log.debug("Scheduler: skipping post {} in terminal state {}", sp.getId(), sp.getStatus());
            return;
        }

        // Mark as processing immediately to prevent duplicate runs
        sp.setStatus(ScheduledPostStatus.PROCESSING);
        scheduledPostRepository.save(sp);

        try {
            SocialMediaService service = platformServiceMap.get(sp.getPlatform());
            if (service == null) {
                throw new IllegalStateException("No service registered for platform: " + sp.getPlatform());
            }

            String externalId = service.publish(sp);

            sp.setStatus(ScheduledPostStatus.PUBLISHED);
            sp.setPublishedTime(OffsetDateTime.now());
            sp.setExternalPostId(externalId);
            sp.setErrorMessage(null);
            sp.setNextRetryAt(null);
            scheduledPostRepository.save(sp);

            updateParentPostStatus(sp.getPost());
            log.info("Scheduler: successfully published post {} to {} (externalId={})",
                sp.getPost().getId(), sp.getPlatform(), externalId);

            notificationService.create(
                sp.getPost().getAuthor().getId(),
                NotificationType.POST_PUBLISHED,
                "Post published",
                "Your post was published to " + platformLabel(sp.getPlatform())
            );

        } catch (Exception e) {
            handlePublishFailure(sp, e);
        }
    }

    private void handlePublishFailure(ScheduledPost sp, Exception e) {
        int newRetryCount = sp.getRetryCount() + 1;
        sp.setRetryCount(newRetryCount);
        sp.setErrorMessage(truncate(e.getMessage(), 500));

        if (newRetryCount >= MAX_RETRIES) {
            // Dead-letter: no more retries
            sp.setStatus(ScheduledPostStatus.FAILED);
            sp.setNextRetryAt(null);
            log.error("Scheduler: post {} to {} PERMANENTLY FAILED after {} attempts. Error: {}",
                sp.getPost().getId(), sp.getPlatform(), newRetryCount, e.getMessage());

            notificationService.create(
                sp.getPost().getAuthor().getId(),
                NotificationType.POST_FAILED,
                "Post failed to publish",
                "Could not publish your post to " + platformLabel(sp.getPlatform()) + " after " + newRetryCount + " attempts."
            );
        } else {
            // Exponential backoff retry
            long delayMinutes = DateUtil.backoffDelayMinutes(newRetryCount);
            sp.setStatus(ScheduledPostStatus.FAILED);
            sp.setNextRetryAt(OffsetDateTime.now().plusMinutes(delayMinutes));
            log.warn("Scheduler: post {} to {} failed (attempt {}/{}), retrying in {} minutes. Error: {}",
                sp.getPost().getId(), sp.getPlatform(), newRetryCount, MAX_RETRIES, delayMinutes, e.getMessage());
        }

        scheduledPostRepository.save(sp);

        // Update parent post if all sub-posts are in terminal state
        updateParentPostStatus(sp.getPost());
    }

    private void updateParentPostStatus(Post post) {
        try {
            List<ScheduledPost> allScheduled = scheduledPostRepository.findByPostId(post.getId());

            boolean allTerminal = allScheduled.stream()
                .allMatch(sp -> sp.getStatus() == ScheduledPostStatus.PUBLISHED
                    || (sp.getStatus() == ScheduledPostStatus.FAILED && sp.getRetryCount() >= MAX_RETRIES)
                    || sp.getStatus() == ScheduledPostStatus.CANCELLED);

            boolean anyPublished = allScheduled.stream()
                .anyMatch(sp -> sp.getStatus() == ScheduledPostStatus.PUBLISHED);

            boolean allFailed = allScheduled.stream()
                .allMatch(sp -> sp.getStatus() == ScheduledPostStatus.FAILED
                    || sp.getStatus() == ScheduledPostStatus.CANCELLED);

            if (allTerminal) {
                if (anyPublished) {
                    post.setStatus(PostStatus.PUBLISHED);
                    post.setPublishedAt(OffsetDateTime.now());
                    log.info("Scheduler: parent post {} marked as PUBLISHED", post.getId());
                } else if (allFailed) {
                    post.setStatus(PostStatus.FAILED);
                    log.warn("Scheduler: parent post {} marked as FAILED (all platforms failed)", post.getId());
                }
                postRepository.save(post);
            }
        } catch (Exception e) {
            log.error("Scheduler: failed to update parent post status for post {}", post.getId(), e);
        }
    }

    public void triggerManual(Long scheduledPostId) {
        ScheduledPost sp = scheduledPostRepository.findById(scheduledPostId)
            .orElseThrow(() -> new RuntimeException("ScheduledPost not found: " + scheduledPostId));
        log.info("Scheduler: manual trigger for scheduled post {}", scheduledPostId);
        processPost(sp);
    }

    private String truncate(String s, int max) {
        if (s == null) return null;
        return s.length() > max ? s.substring(0, max) + "..." : s;
    }

    private String platformLabel(com.buildme.model.Platform platform) {
        String name = platform.name();
        return name.charAt(0) + name.substring(1).toLowerCase();
    }
}
