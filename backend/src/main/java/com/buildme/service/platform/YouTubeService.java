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
public class YouTubeService implements SocialMediaService {

    private final SocialAccountRepository socialAccountRepository;

    @Value("${app.oauth.youtube.client-id:}")
    private String clientId;

    @Value("${app.oauth.youtube.client-secret:}")
    private String clientSecret;

    @Value("${app.oauth.youtube.redirect-uri:http://localhost:8080/api/integrations/youtube/callback}")
    private String redirectUri;

    @Override
    public Platform getPlatform() { return Platform.YOUTUBE; }

    @Override
    public String publish(ScheduledPost scheduledPost) throws Exception {
        if (scheduledPost.getSocialAccount() == null) {
            throw new CustomExceptions.ExternalApiException("YouTube account not connected");
        }
        log.info("Publishing to YouTube: post {}", scheduledPost.getId());
        return "yt_" + System.currentTimeMillis();
    }

    @Override
    public String getOAuthUrl(Long workspaceId, String state) {
        return "https://accounts.google.com/o/oauth2/v2/auth"
            + "?client_id=" + clientId
            + "&redirect_uri=" + redirectUri
            + "&scope=https://www.googleapis.com/auth/youtube.upload"
            + "&response_type=code"
            + "&access_type=offline"
            + "&state=" + state + ":" + workspaceId;
    }

    @Override
    public void handleOAuthCallback(Long workspaceId, String code, String state) {
        log.info("Handling YouTube OAuth callback for workspace {}", workspaceId);
    }

    @Override
    public void refreshTokenIfNeeded(Long socialAccountId) {}
}
