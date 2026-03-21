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
public class PinterestService implements SocialMediaService {

    private final SocialAccountRepository socialAccountRepository;

    @Value("${app.oauth.pinterest.app-id:}")
    private String appId;

    @Value("${app.oauth.pinterest.app-secret:}")
    private String appSecret;

    @Value("${app.oauth.pinterest.redirect-uri:http://localhost:8080/api/integrations/pinterest/callback}")
    private String redirectUri;

    @Override
    public Platform getPlatform() { return Platform.PINTEREST; }

    @Override
    public String publish(ScheduledPost scheduledPost) throws Exception {
        if (scheduledPost.getSocialAccount() == null) {
            throw new CustomExceptions.ExternalApiException("Pinterest account not connected");
        }
        log.info("Publishing to Pinterest: post {}", scheduledPost.getId());
        return "pin_" + System.currentTimeMillis();
    }

    @Override
    public String getOAuthUrl(Long workspaceId, String state) {
        return "https://www.pinterest.com/oauth/"
            + "?client_id=" + appId
            + "&redirect_uri=" + redirectUri
            + "&response_type=code"
            + "&scope=boards:read,pins:write"
            + "&state=" + state + ":" + workspaceId;
    }

    @Override
    public void handleOAuthCallback(Long workspaceId, String code, String state) {
        log.info("Handling Pinterest OAuth callback for workspace {}", workspaceId);
    }

    @Override
    public void refreshTokenIfNeeded(Long socialAccountId) {}
}
