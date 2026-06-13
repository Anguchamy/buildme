package com.buildme.service.platform;

import com.buildme.model.Platform;
import com.buildme.model.ScheduledPost;

public interface SocialMediaService {
    Platform getPlatform();
    String publish(ScheduledPost scheduledPost) throws Exception;
    String getOAuthUrl(Long workspaceId, String state);

    /**
     * OAuth URL that forces the provider's account chooser / re-auth when
     * {@code forceReauth} is true. Used by the "+ Add another" flow so the
     * user can pick a different account even if they're already signed in
     * to the provider in the same browser. Default impl ignores the flag —
     * platforms that support it override.
     */
    default String getOAuthUrl(Long workspaceId, String state, boolean forceReauth) {
        return getOAuthUrl(workspaceId, state);
    }

    void handleOAuthCallback(Long workspaceId, String code, String state);
    void refreshTokenIfNeeded(Long socialAccountId);
}
