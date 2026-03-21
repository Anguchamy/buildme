package com.buildme.service;

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
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SchedulerService {

    private final ScheduledPostRepository scheduledPostRepository;
    private final PostRepository postRepository;
    private final List<SocialMediaService> platformServices;

    private Map<com.buildme.model.Platform, SocialMediaService> platformServiceMap;

    @jakarta.annotation.PostConstruct
    public void init() {
        platformServiceMap = platformServices.stream()
            .collect(Collectors.toMap(SocialMediaService::getPlatform, Function.identity()));
    }

    @Scheduled(fixedDelay = 60000)
    public void processScheduledPosts() {
        log.debug("Scheduler: checking for due posts");
        try {
            List<ScheduledPost> duePosts = scheduledPostRepository
                .findByStatusAndScheduledTimeBefore(ScheduledPostStatus.PENDING, OffsetDateTime.now());

            for (ScheduledPost sp : duePosts) {
                processPost(sp);
            }

            // Also process failed posts ready for retry
            List<ScheduledPost> retryPosts = scheduledPostRepository
                .findFailedForRetry(ScheduledPostStatus.FAILED, OffsetDateTime.now());

            for (ScheduledPost sp : retryPosts) {
                processPost(sp);
            }
        } catch (Exception e) {
            log.error("Scheduler error", e);
        }
    }

    @Transactional
    public void processPost(ScheduledPost sp) {
        sp.setStatus(ScheduledPostStatus.PROCESSING);
        scheduledPostRepository.save(sp);

        try {
            SocialMediaService service = platformServiceMap.get(sp.getPlatform());
            if (service == null) {
                throw new IllegalStateException("No service for platform: " + sp.getPlatform());
            }

            String externalId = service.publish(sp);
            sp.setStatus(ScheduledPostStatus.PUBLISHED);
            sp.setPublishedTime(OffsetDateTime.now());
            sp.setExternalPostId(externalId);
            sp.setErrorMessage(null);
            scheduledPostRepository.save(sp);

            updatePostStatusIfAllPublished(sp.getPost());
            log.info("Published post {} to {}", sp.getPost().getId(), sp.getPlatform());

        } catch (Exception e) {
            log.error("Failed to publish post {} to {}: {}", sp.getPost().getId(), sp.getPlatform(), e.getMessage());
            sp.setRetryCount(sp.getRetryCount() + 1);
            sp.setErrorMessage(e.getMessage());

            if (sp.getRetryCount() >= 3) {
                sp.setStatus(ScheduledPostStatus.FAILED);
                sp.setNextRetryAt(null);
            } else {
                sp.setStatus(ScheduledPostStatus.FAILED);
                long delayMinutes = DateUtil.backoffDelayMinutes(sp.getRetryCount());
                sp.setNextRetryAt(OffsetDateTime.now().plusMinutes(delayMinutes));
            }
            scheduledPostRepository.save(sp);
        }
    }

    private void updatePostStatusIfAllPublished(Post post) {
        List<ScheduledPost> allScheduled = scheduledPostRepository.findByPostId(post.getId());
        boolean allDone = allScheduled.stream()
            .allMatch(sp -> sp.getStatus() == ScheduledPostStatus.PUBLISHED
                || sp.getStatus() == ScheduledPostStatus.FAILED);
        boolean anyPublished = allScheduled.stream()
            .anyMatch(sp -> sp.getStatus() == ScheduledPostStatus.PUBLISHED);

        if (allDone && anyPublished) {
            post.setStatus(PostStatus.PUBLISHED);
            post.setPublishedAt(OffsetDateTime.now());
            postRepository.save(post);
        }
    }

    public void triggerManual(Long scheduledPostId) {
        ScheduledPost sp = scheduledPostRepository.findById(scheduledPostId)
            .orElseThrow(() -> new RuntimeException("ScheduledPost not found: " + scheduledPostId));
        processPost(sp);
    }
}
