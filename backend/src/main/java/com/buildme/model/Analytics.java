package com.buildme.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

@Entity
@Table(name = "analytics")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Analytics {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id")
    private Post post;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "scheduled_post_id")
    private ScheduledPost scheduledPost;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workspace_id", nullable = false)
    private Workspace workspace;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private Platform platform;

    @Column(name = "metric_date", nullable = false)
    private LocalDate metricDate;

    @Builder.Default
    private Long impressions = 0L;

    @Builder.Default
    private Long reach = 0L;

    @Builder.Default
    private Long likes = 0L;

    @Builder.Default
    private Long comments = 0L;

    @Builder.Default
    private Long shares = 0L;

    @Builder.Default
    private Long saves = 0L;

    @Builder.Default
    private Long clicks = 0L;

    @Column(name = "profile_visits")
    @Builder.Default
    private Long profileVisits = 0L;

    @Builder.Default
    private Long follows = 0L;

    @Column(name = "engagement_rate", precision = 5, scale = 4)
    @Builder.Default
    private BigDecimal engagementRate = BigDecimal.ZERO;

    @Column(name = "raw_data", columnDefinition = "JSONB")
    private String rawData;

    @Column(name = "synced_at")
    @Builder.Default
    private OffsetDateTime syncedAt = OffsetDateTime.now();
}
