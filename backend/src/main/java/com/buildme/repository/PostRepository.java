package com.buildme.repository;

import com.buildme.model.Post;
import com.buildme.model.PostStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;

@Repository
public interface PostRepository extends JpaRepository<Post, Long> {
    List<Post> findByWorkspaceIdAndStatus(Long workspaceId, PostStatus status);

    List<Post> findByWorkspaceIdOrderByCreatedAtDesc(Long workspaceId);

    @Query("""
        SELECT p FROM Post p
        WHERE p.workspace.id = :workspaceId
        AND p.scheduledAt BETWEEN :start AND :end
        ORDER BY p.scheduledAt ASC
        """)
    List<Post> findByWorkspaceIdAndScheduledAtBetween(
        @Param("workspaceId") Long workspaceId,
        @Param("start") OffsetDateTime start,
        @Param("end") OffsetDateTime end
    );

    @Query("""
        SELECT p FROM Post p
        WHERE p.workspace.id = :workspaceId
        AND p.gridPosition IS NOT NULL
        ORDER BY p.gridPosition ASC
        """)
    List<Post> findGridPostsByWorkspaceId(@Param("workspaceId") Long workspaceId);

    long countByWorkspaceIdAndStatus(Long workspaceId, PostStatus status);
}
