package com.buildme.service.platform;

import com.buildme.model.Platform;
import com.buildme.model.ScheduledPost;

public interface SocialMediaService {
    Platform getPlatform();
    String publish(ScheduledPost scheduledPost) throws Exception;
    String getOAuthUrl(Long workspaceId, String state);
    void handleOAuthCallback(Long workspaceId, String code, String state);
    void refreshTokenIfNeeded(Long socialAccountId);
}
