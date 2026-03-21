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
public class TwitterService implements SocialMediaService {

    private final SocialAccountRepository socialAccountRepository;

    @Value("${app.oauth.twitter.client-id:}")
    private String clientId;

    @Value("${app.oauth.twitter.client-secret:}")
    private String clientSecret;

    @Value("${app.oauth.twitter.redirect-uri:http://localhost:8080/api/integrations/twitter/callback}")
    private String redirectUri;

    @Override
    public Platform getPlatform() { return Platform.TWITTER; }

    @Override
    public String publish(ScheduledPost scheduledPost) throws Exception {
        if (scheduledPost.getSocialAccount() == null) {
            throw new CustomExceptions.ExternalApiException("Twitter account not connected");
        }
        log.info("Publishing to Twitter: post {}", scheduledPost.getId());
        return "tw_" + System.currentTimeMillis();
    }

    @Override
    public String getOAuthUrl(Long workspaceId, String state) {
        return "https://twitter.com/i/oauth2/authorize"
            + "?response_type=code"
            + "&client_id=" + clientId
            + "&redirect_uri=" + redirectUri
            + "&scope=tweet.read+tweet.write+users.read"
            + "&state=" + state + ":" + workspaceId
            + "&code_challenge=challenge&code_challenge_method=plain";
    }

    @Override
    public void handleOAuthCallback(Long workspaceId, String code, String state) {
        log.info("Handling Twitter OAuth callback for workspace {}", workspaceId);
    }

    @Override
    public void refreshTokenIfNeeded(Long socialAccountId) {}
}
