package com.buildme.service;

import com.buildme.dto.response.MediaAssetResponse;
import com.buildme.exception.CustomExceptions;
import com.buildme.model.MediaAsset;
import com.buildme.model.MediaSource;
import com.buildme.model.User;
import com.buildme.model.Workspace;
import com.buildme.repository.MediaAssetRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class MediaService {

    private final MediaAssetRepository mediaAssetRepository;
    private final WorkspaceService workspaceService;
    private final UserService userService;
    private final R2StorageService r2StorageService;

    @Value("${app.upload.local-dir:${user.home}/buildme-uploads}")
    private String localUploadDir;

    @Transactional
    public MediaAssetResponse uploadDirect(Long workspaceId, Long userId, MultipartFile file) {
        Workspace workspace = workspaceService.getWorkspace(workspaceId);
        User uploader = userService.getUserById(userId);

        String originalName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "upload";
        String ext = originalName.contains(".") ? originalName.substring(originalName.lastIndexOf('.')) : "";
        String storedName = UUID.randomUUID() + ext;
        String key = "workspaces/" + workspaceId + "/" + storedName;
        String contentType = file.getContentType() != null ? file.getContentType() : "application/octet-stream";
        if ("image/jpg".equalsIgnoreCase(contentType)) contentType = "image/jpeg";

        String url;

        if (r2StorageService.isEnabled()) {
            // Upload to Cloudflare R2
            try {
                url = r2StorageService.upload(key, file.getBytes(), contentType);
                log.info("Uploaded {} to R2: {}", originalName, key);
            } catch (IOException e) {
                throw new CustomExceptions.ExternalApiException("Failed to upload file to R2", e);
            }
        } else {
            // Fall back to local disk
            Path uploadPath = Paths.get(localUploadDir).resolve(key);
            try {
                Files.createDirectories(uploadPath.getParent());
                file.transferTo(uploadPath);
            } catch (IOException e) {
                throw new CustomExceptions.ExternalApiException("Failed to save uploaded file", e);
            }
            url = "/static/uploads/" + key;
            log.info("Saved {} to local storage: {}", originalName, uploadPath);
        }

        MediaAsset asset = MediaAsset.builder()
            .workspace(workspace)
            .uploadedBy(uploader)
            .fileName(storedName)
            .originalName(originalName)
            .contentType(contentType)
            .fileSize(file.getSize())
            .s3Key(key)
            .url(url)
            .thumbnailUrl(url)
            .source(MediaSource.UPLOAD)
            .build();

        return toResponse(mediaAssetRepository.save(asset));
    }

    @Transactional
    public Map<String, Object> generateUploadUrl(Long workspaceId, Long userId,
                                                  String fileName, String contentType, Long fileSize) {
        String ext = fileName.contains(".") ? fileName.substring(fileName.lastIndexOf('.')) : "";
        String storedName = UUID.randomUUID() + ext;
        String key = "workspaces/" + workspaceId + "/" + storedName;

        Workspace workspace = workspaceService.getWorkspace(workspaceId);
        User uploader = userService.getUserById(userId);

        String resolvedContentType = (contentType != null && !contentType.isBlank())
            ? contentType : "application/octet-stream";
        if ("image/jpg".equalsIgnoreCase(resolvedContentType)) resolvedContentType = "image/jpeg";

        String publicUrl;
        String presignedUrl;

        if (r2StorageService.isEnabled()) {
            // Generate a 15-minute presigned PUT URL for direct browser-to-R2 upload
            presignedUrl = r2StorageService.generatePresignedPutUrl(key, resolvedContentType, 900);
            // Compute the public URL the asset will have after upload
            publicUrl = r2StorageService.resolvePublicUrl(key);
        } else {
            presignedUrl = "";
            publicUrl = "/static/uploads/" + key;
        }

        MediaAsset asset = MediaAsset.builder()
            .workspace(workspace).uploadedBy(uploader)
            .fileName(storedName).originalName(fileName)
            .contentType(resolvedContentType).fileSize(fileSize)
            .s3Key(key).url(publicUrl)
            .thumbnailUrl(publicUrl)
            .source(MediaSource.UPLOAD).build();
        MediaAsset saved = mediaAssetRepository.save(asset);

        return Map.of("uploadUrl", presignedUrl, "assetId", saved.getId(), "s3Key", key);
    }

    @Transactional
    public MediaAssetResponse confirmUpload(Long assetId, Long userId) {
        MediaAsset asset = mediaAssetRepository.findById(assetId)
            .orElseThrow(() -> new CustomExceptions.ResourceNotFoundException("MediaAsset", assetId));
        return toResponse(asset);
    }

    public ResponseEntity<byte[]> getFile(Long workspaceId, Long assetId) {
        MediaAsset asset = mediaAssetRepository.findById(assetId)
            .orElseThrow(() -> new CustomExceptions.ResourceNotFoundException("MediaAsset", assetId));

        // R2 assets — redirect to public URL or presigned GET URL
        if (r2StorageService.isEnabled() && asset.getS3Key() != null) {
            String redirectUrl = r2StorageService.hasPublicUrl()
                ? r2StorageService.resolvePublicUrl(asset.getS3Key())
                : r2StorageService.generatePresignedGetUrl(asset.getS3Key(), 3600);
            HttpHeaders headers = new HttpHeaders();
            headers.set(HttpHeaders.LOCATION, redirectUrl);
            headers.set(HttpHeaders.CACHE_CONTROL, "max-age=3600");
            return ResponseEntity.status(302).headers(headers).build();
        }

        byte[] data;
        try {
            Path filePath = Paths.get(localUploadDir).resolve(asset.getS3Key());
            data = java.nio.file.Files.readAllBytes(filePath);
        } catch (IOException e) {
            throw new CustomExceptions.ExternalApiException("Failed to read local file", e);
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(asset.getContentType()));
        headers.setContentLength(data.length);
        headers.set(HttpHeaders.CACHE_CONTROL, "max-age=3600");
        return ResponseEntity.ok().headers(headers).body(data);
    }

    @Transactional(readOnly = true)
    public List<MediaAssetResponse> findByWorkspace(Long workspaceId, int page, int size) {
        return mediaAssetRepository.findByWorkspaceIdOrderByCreatedAtDesc(
                workspaceId, PageRequest.of(page, size))
            .stream().map(this::toResponse).toList();
    }

    @Transactional
    public void delete(Long assetId, Long userId) {
        MediaAsset asset = mediaAssetRepository.findById(assetId)
            .orElseThrow(() -> new CustomExceptions.ResourceNotFoundException("MediaAsset", assetId));
        log.info("Deleting media asset: {}", asset.getS3Key());

        if (r2StorageService.isEnabled()) {
            r2StorageService.delete(asset.getS3Key());
        } else {
            try {
                Path filePath = Paths.get(localUploadDir).resolve(asset.getS3Key());
                Files.deleteIfExists(filePath);
            } catch (IOException e) {
                log.warn("Could not delete local file: {}", e.getMessage());
            }
        }

        mediaAssetRepository.deletePostMediaReferences(assetId);
        mediaAssetRepository.delete(asset);
    }

    public MediaAssetResponse toResponse(MediaAsset ma) {
        String url = ma.getUrl();
        // If R2 is enabled but no public URL is configured, the stored URL is the
        // private S3 endpoint which browsers can't access. Serve a presigned GET URL instead.
        if (r2StorageService.isEnabled() && !r2StorageService.hasPublicUrl()
                && ma.getS3Key() != null && !ma.getS3Key().isBlank()) {
            try {
                url = r2StorageService.generatePresignedGetUrl(ma.getS3Key(), 3600);
            } catch (Exception e) {
                log.warn("Could not generate presigned GET URL for asset {}: {}", ma.getId(), e.getMessage());
            }
        }
        return new MediaAssetResponse(
            ma.getId(), ma.getFileName(), ma.getOriginalName(), ma.getContentType(),
            ma.getFileSize(), url, url, ma.getWidth(),
            ma.getHeight(), ma.getDurationSeconds(), ma.getSource(),
            ma.getExternalId(), ma.getCreatedAt()
        );
    }
}
