package com.buildme.service.platform;

import com.buildme.exception.CustomExceptions;
import com.buildme.model.Platform;
import com.buildme.model.ScheduledPost;
import com.buildme.repository.SocialAccountRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class FacebookService implements SocialMediaService {

    private final SocialAccountRepository socialAccountRepository;

    @Value("${app.oauth.facebook.app-id:}")
    private String appId;

    @Value("${app.oauth.facebook.app-secret:}")
    private String appSecret;

    @Value("${app.oauth.facebook.redirect-uri:http://localhost:8080/api/integrations/facebook/callback}")
    private String redirectUri;

    @Override
    public Platform getPlatform() { return Platform.FACEBOOK; }

    @Override
    public String publish(ScheduledPost scheduledPost) throws Exception {
        if (scheduledPost.getSocialAccount() == null) {
            throw new CustomExceptions.ExternalApiException("Facebook account not connected");
        }
        log.info("Publishing to Facebook: post {}", scheduledPost.getId());
        return "fb_" + System.currentTimeMillis();
    }

    @Override
    public String getOAuthUrl(Long workspaceId, String state) {
        return "https://www.facebook.com/v18.0/dialog/oauth"
            + "?client_id=" + appId
            + "&redirect_uri=" + redirectUri
            + "&scope=pages_manage_posts,pages_read_engagement"
            + "&state=" + state + ":" + workspaceId;
    }

    @Override
    public void handleOAuthCallback(Long workspaceId, String code, String state) {
        log.info("Handling Facebook OAuth callback for workspace {}", workspaceId);
    }

    @Override
    public void refreshTokenIfNeeded(Long socialAccountId) {}
}
