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
public class LinkedInService implements SocialMediaService {

    private final SocialAccountRepository socialAccountRepository;

    @Value("${app.oauth.linkedin.client-id:}")
    private String clientId;

    @Value("${app.oauth.linkedin.client-secret:}")
    private String clientSecret;

    @Value("${app.oauth.linkedin.redirect-uri:http://localhost:8080/api/integrations/linkedin/callback}")
    private String redirectUri;

    @Override
    public Platform getPlatform() { return Platform.LINKEDIN; }

    @Override
    public String publish(ScheduledPost scheduledPost) throws Exception {
        if (scheduledPost.getSocialAccount() == null) {
            throw new CustomExceptions.ExternalApiException("LinkedIn account not connected");
        }
        log.info("Publishing to LinkedIn: post {}", scheduledPost.getId());
        return "li_" + System.currentTimeMillis();
    }

    @Override
    public String getOAuthUrl(Long workspaceId, String state) {
        return "https://www.linkedin.com/oauth/v2/authorization"
            + "?response_type=code"
            + "&client_id=" + clientId
            + "&redirect_uri=" + redirectUri
            + "&scope=r_liteprofile+w_member_social"
            + "&state=" + state + ":" + workspaceId;
    }

    @Override
    public void handleOAuthCallback(Long workspaceId, String code, String state) {
        log.info("Handling LinkedIn OAuth callback for workspace {}", workspaceId);
    }

    @Override
    public void refreshTokenIfNeeded(Long socialAccountId) {}
}
