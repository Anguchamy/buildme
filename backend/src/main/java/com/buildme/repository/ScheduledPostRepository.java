package com.buildme.repository;

import com.buildme.model.ScheduledPost;
import com.buildme.model.ScheduledPostStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;

@Repository
public interface ScheduledPostRepository extends JpaRepository<ScheduledPost, Long> {

    @Query("""
        SELECT sp FROM ScheduledPost sp
        WHERE sp.status = :status
        AND sp.scheduledTime <= :before
        ORDER BY sp.scheduledTime ASC
        """)
    List<ScheduledPost> findByStatusAndScheduledTimeBefore(
        @Param("status") ScheduledPostStatus status,
        @Param("before") OffsetDateTime before
    );

    List<ScheduledPost> findByPostId(Long postId);

    @Query("""
        SELECT sp FROM ScheduledPost sp
        WHERE sp.status = :status
        AND sp.nextRetryAt IS NOT NULL
        AND sp.nextRetryAt <= :before
        AND sp.retryCount < 3
        """)
    List<ScheduledPost> findFailedForRetry(
        @Param("status") ScheduledPostStatus status,
        @Param("before") OffsetDateTime before
    );
}
