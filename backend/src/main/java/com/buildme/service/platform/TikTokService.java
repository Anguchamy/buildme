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
public class TikTokService implements SocialMediaService {

    private final SocialAccountRepository socialAccountRepository;

    @Value("${app.oauth.tiktok.client-key:}")
    private String clientKey;

    @Value("${app.oauth.tiktok.client-secret:}")
    private String clientSecret;

    @Value("${app.oauth.tiktok.redirect-uri:http://localhost:8080/api/integrations/tiktok/callback}")
    private String redirectUri;

    @Override
    public Platform getPlatform() { return Platform.TIKTOK; }

    @Override
    public String publish(ScheduledPost scheduledPost) throws Exception {
        if (scheduledPost.getSocialAccount() == null) {
            throw new CustomExceptions.ExternalApiException("TikTok account not connected");
        }
        log.info("Publishing to TikTok: post {}", scheduledPost.getId());
        return "tt_" + System.currentTimeMillis();
    }

    @Override
    public String getOAuthUrl(Long workspaceId, String state) {
        return "https://www.tiktok.com/auth/authorize/"
            + "?client_key=" + clientKey
            + "&redirect_uri=" + redirectUri
            + "&scope=user.info.basic,video.upload"
            + "&response_type=code"
            + "&state=" + state + ":" + workspaceId;
    }

    @Override
    public void handleOAuthCallback(Long workspaceId, String code, String state) {
        log.info("Handling TikTok OAuth callback for workspace {}", workspaceId);
    }

    @Override
    public void refreshTokenIfNeeded(Long socialAccountId) {}
}
