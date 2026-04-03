package com.buildme.repository;

import com.buildme.model.MediaAsset;
import com.buildme.model.MediaSource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MediaAssetRepository extends JpaRepository<MediaAsset, Long> {
    Page<MediaAsset> findByWorkspaceIdOrderByCreatedAtDesc(Long workspaceId, Pageable pageable);
    List<MediaAsset> findByWorkspaceIdAndSource(Long workspaceId, MediaSource source);
    long countByWorkspaceId(Long workspaceId);

    @Modifying
    @Query(value = "DELETE FROM post_media WHERE media_asset_id = :assetId", nativeQuery = true)
    void deletePostMediaReferences(@Param("assetId") Long assetId);
}
