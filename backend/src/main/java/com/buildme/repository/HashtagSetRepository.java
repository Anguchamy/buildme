package com.buildme.repository;

import com.buildme.model.HashtagSet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HashtagSetRepository extends JpaRepository<HashtagSet, Long> {
    List<HashtagSet> findByWorkspaceIdOrderByUseCountDesc(Long workspaceId);
}
