package com.buildme.service;

import com.buildme.dto.response.AnalyticsResponse;
import com.buildme.model.Analytics;
import com.buildme.model.Platform;
import com.buildme.repository.AnalyticsRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AnalyticsService {

    private final AnalyticsRepository analyticsRepository;

    @Transactional(readOnly = true)
    public List<AnalyticsResponse> getWorkspaceAnalytics(Long workspaceId, LocalDate from, LocalDate to) {
        return analyticsRepository
            .findByWorkspaceIdAndMetricDateBetweenOrderByMetricDateAsc(workspaceId, from, to)
            .stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<AnalyticsResponse> getPostAnalytics(Long postId) {
        return analyticsRepository.findByPostIdOrderByMetricDateAsc(postId)
            .stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public Map<Platform, Long> getPlatformEngagementTotals(Long workspaceId, LocalDate from, LocalDate to) {
        List<Analytics> analytics = analyticsRepository
            .findByWorkspaceIdAndMetricDateBetweenOrderByMetricDateAsc(workspaceId, from, to);
        return analytics.stream().collect(
            Collectors.groupingBy(
                Analytics::getPlatform,
                Collectors.summingLong(a ->
                    a.getLikes() + a.getComments() + a.getShares() + a.getSaves()
                )
            )
        );
    }

    /**
     * Sync analytics from all connected platforms for a workspace.
     * Platform-specific API calls would go here.
     */
    @Transactional
    public void syncFromPlatforms(Long workspaceId) {
        log.info("Syncing analytics for workspace {}", workspaceId);
        // Stub: platform integrations would call their APIs and save results
    }

    public AnalyticsResponse toResponse(Analytics a) {
        return new AnalyticsResponse(
            a.getId(), a.getPost() != null ? a.getPost().getId() : null,
            a.getWorkspace().getId(), a.getPlatform(), a.getMetricDate(),
            a.getImpressions(), a.getReach(), a.getLikes(), a.getComments(),
            a.getShares(), a.getSaves(), a.getClicks(), a.getProfileVisits(),
            a.getFollows(), a.getEngagementRate()
        );
    }
}
