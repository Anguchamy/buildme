package com.buildme.service;

import com.buildme.model.MediaAsset;
import com.buildme.util.MediaTokenUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class PublicMediaUrlResolver {

    private final R2StorageService r2StorageService;
    private final MediaTokenUtil mediaTokenUtil;

    @Value("${app.backend.url:}")
    private String backendUrl;

    /**
     * Returns a URL that an unauthenticated third party (Meta, TikTok, etc.)
     * can fetch the asset's bytes from. Order of preference:
     *   1. Our own backend's public media endpoint — full control over headers.
     *   2. R2's configured public URL.
     *   3. R2 pre-signed GET URL.
     * Falls back to the stored asset URL only if none of the above apply.
     */
    public String resolve(MediaAsset asset) {
        if (backendUrl != null && !backendUrl.isBlank()) {
            String base = backendUrl.replaceAll("/+$", "");
            if (!base.startsWith("http://") && !base.startsWith("https://")) {
                base = "https://" + base;
            }
            String token = mediaTokenUtil.issue(asset.getId(), 86_400);
            return base + "/api/public/media/" + asset.getId() + "?t=" + token;
        }
        if (r2StorageService.isEnabled() && asset.getS3Key() != null && !asset.getS3Key().isBlank()) {
            if (r2StorageService.hasPublicUrl()) {
                return r2StorageService.resolvePublicUrl(asset.getS3Key());
            }
            String contentType = asset.getContentType();
            if (contentType == null || contentType.isBlank()) {
                contentType = "image/jpeg";
            }
            return r2StorageService.generatePresignedGetUrl(asset.getS3Key(), 86_400, contentType);
        }
        return asset.getUrl();
    }
}
