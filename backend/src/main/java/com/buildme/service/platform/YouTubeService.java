package com.buildme.service.platform;

import com.buildme.exception.CustomExceptions;
import com.buildme.model.Platform;
import com.buildme.model.ScheduledPost;
import com.buildme.model.SocialAccount;
import com.buildme.model.Workspace;
import com.buildme.repository.SocialAccountRepository;
import com.buildme.repository.WorkspaceRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.hc.client5.http.classic.methods.HttpGet;
import org.apache.hc.client5.http.classic.methods.HttpPost;
import org.apache.hc.client5.http.entity.UrlEncodedFormEntity;
import org.apache.hc.client5.http.impl.classic.CloseableHttpClient;
import org.apache.hc.client5.http.impl.classic.HttpClients;
import org.apache.hc.core5.http.NameValuePair;
import org.apache.hc.core5.http.io.entity.EntityUtils;
import org.apache.hc.core5.http.message.BasicNameValuePair;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class YouTubeService implements SocialMediaService {

    private final SocialAccountRepository socialAccountRepository;
    private final WorkspaceRepository workspaceRepository;
    private final ObjectMapper objectMapper;

    @Value("${app.oauth.youtube.client-id:}")
    private String clientId;

    @Value("${app.oauth.youtube.client-secret:}")
    private String clientSecret;

    @Value("${app.oauth.youtube.redirect-uri:}")
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
            + "+https://www.googleapis.com/auth/userinfo.profile"
            + "+https://www.googleapis.com/auth/userinfo.email"
            + "&response_type=code"
            + "&access_type=offline"
            + "&prompt=consent"
            + "&state=" + state + ":" + workspaceId;
    }

    @Override
    public void handleOAuthCallback(Long workspaceId, String code, String state) {
        log.info("Handling YouTube OAuth callback for workspace {}", workspaceId);

        if (clientId.isBlank() || clientSecret.isBlank()) {
            throw new CustomExceptions.ExternalApiException("YouTube OAuth credentials not configured");
        }

        try (CloseableHttpClient http = HttpClients.createDefault()) {
            // 1. Exchange code for tokens
            HttpPost tokenRequest = new HttpPost("https://oauth2.googleapis.com/token");
            List<NameValuePair> params = List.of(
                new BasicNameValuePair("code", code),
                new BasicNameValuePair("client_id", clientId),
                new BasicNameValuePair("client_secret", clientSecret),
                new BasicNameValuePair("redirect_uri", redirectUri),
                new BasicNameValuePair("grant_type", "authorization_code")
            );
            tokenRequest.setEntity(new UrlEncodedFormEntity(params));
            String tokenJson = http.execute(tokenRequest, r -> EntityUtils.toString(r.getEntity()));
            JsonNode tokenNode = objectMapper.readTree(tokenJson);

            if (tokenNode.has("error")) {
                throw new CustomExceptions.ExternalApiException(
                    "YouTube token exchange failed: " + tokenNode.path("error_description").asText());
            }

            String accessToken = tokenNode.path("access_token").asText();
            String refreshToken = tokenNode.path("refresh_token").asText(null);
            long expiresIn = tokenNode.path("expires_in").asLong(3600);

            // 2. Fetch user profile
            HttpGet profileRequest = new HttpGet("https://www.googleapis.com/oauth2/v2/userinfo");
            profileRequest.setHeader("Authorization", "Bearer " + accessToken);
            String profileJson = http.execute(profileRequest, r -> EntityUtils.toString(r.getEntity()));
            JsonNode profileNode = objectMapper.readTree(profileJson);

            String googleId = profileNode.path("id").asText();
            String name = profileNode.path("name").asText();
            String email = profileNode.path("email").asText(null);

            // 3. Upsert social account
            Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new CustomExceptions.ResourceNotFoundException("Workspace not found: " + workspaceId));

            Optional<SocialAccount> existing = socialAccountRepository
                .findByWorkspaceIdAndPlatformAndAccountId(workspaceId, Platform.YOUTUBE, googleId);

            SocialAccount account = existing.orElseGet(() -> SocialAccount.builder()
                .workspace(workspace)
                .platform(Platform.YOUTUBE)
                .accountId(googleId)
                .build());

            account.setDisplayName(name);
            account.setHandle(email);
            account.setAccessToken(accessToken);
            if (refreshToken != null) account.setRefreshToken(refreshToken);
            account.setTokenExpiresAt(OffsetDateTime.now().plusSeconds(expiresIn));
            account.setScopes("youtube.upload userinfo.profile userinfo.email");
            account.setConnected(true);

            socialAccountRepository.save(account);
            log.info("YouTube account connected: {} for workspace {}", googleId, workspaceId);

        } catch (CustomExceptions.ExternalApiException e) {
            throw e;
        } catch (Exception e) {
            log.error("YouTube OAuth callback failed for workspace {}: {}", workspaceId, e.getMessage(), e);
            throw new CustomExceptions.ExternalApiException("YouTube connection failed: " + e.getMessage());
        }
    }

    @Override
    public void refreshTokenIfNeeded(Long socialAccountId) {}
}
