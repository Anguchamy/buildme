package com.buildme.repository;

import com.buildme.model.Workspace;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WorkspaceRepository extends JpaRepository<Workspace, Long> {
    List<Workspace> findAllByOwnerId(Long ownerId);
    Optional<Workspace> findBySlug(String slug);
    boolean existsBySlug(String slug);

    @Query("""
        SELECT w FROM Workspace w
        WHERE w.owner.id = :userId
        """)
    List<Workspace> findAllAccessibleByUserId(@Param("userId") Long userId);
}
