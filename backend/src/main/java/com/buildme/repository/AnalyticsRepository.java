package com.buildme.repository;

import com.buildme.model.Analytics;
import com.buildme.model.Platform;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface AnalyticsRepository extends JpaRepository<Analytics, Long> {
    List<Analytics> findByWorkspaceIdAndMetricDateBetweenOrderByMetricDateAsc(
        Long workspaceId, LocalDate from, LocalDate to);

    List<Analytics> findByPostIdOrderByMetricDateAsc(Long postId);

    @Query("""
        SELECT a FROM Analytics a
        WHERE a.workspace.id = :workspaceId
        AND a.platform = :platform
        AND a.metricDate BETWEEN :from AND :to
        ORDER BY a.metricDate ASC
        """)
    List<Analytics> findByWorkspaceAndPlatformAndDateRange(
        @Param("workspaceId") Long workspaceId,
        @Param("platform") Platform platform,
        @Param("from") LocalDate from,
        @Param("to") LocalDate to
    );
}
