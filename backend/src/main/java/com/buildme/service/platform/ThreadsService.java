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

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

@Service
@Slf4j
public class ThreadsService implements SocialMediaService {

    private final SocialAccountRepository socialAccountRepository;
    private final WorkspaceRepository workspaceRepository;
    private final ObjectMapper objectMapper;

    @Value("${app.oauth.threads.client-id:}")
    private String clientId;

    @Value("${app.oauth.threads.client-secret:}")
    private String clientSecret;

    @Value("${app.oauth.threads.redirect-uri:http://localhost:8080/api/integrations/threads/callback}")
    private String redirectUri;

    public ThreadsService(SocialAccountRepository socialAccountRepository,
                          WorkspaceRepository workspaceRepository,
                          ObjectMapper objectMapper) {
        this.socialAccountRepository = socialAccountRepository;
        this.workspaceRepository = workspaceRepository;
        this.objectMapper = objectMapper;
    }

    @Override
    public Platform getPlatform() { return Platform.THREADS; }

    @Override
    public String publish(ScheduledPost scheduledPost) throws Exception {
        if (scheduledPost.getSocialAccount() == null) {
            throw new CustomExceptions.ExternalApiException("Threads account not connected");
        }

        String accessToken = scheduledPost.getSocialAccount().getAccessToken();
        String userId = scheduledPost.getSocialAccount().getAccountId();
        String caption = scheduledPost.getPost() != null ? scheduledPost.getPost().getCaption() : "";

        List<com.buildme.model.MediaAsset> assets =
            scheduledPost.getPost() != null ? scheduledPost.getPost().getMediaAssets() : null;

        try (CloseableHttpClient http = HttpClients.createDefault()) {
            // Step 1: Create a Threads media container
            HttpPost containerRequest = new HttpPost(
                "https://graph.threads.net/v1.0/" + userId + "/threads"
            );

            List<NameValuePair> containerParams = new java.util.ArrayList<>();
            containerParams.add(new BasicNameValuePair("text", caption));
            containerParams.add(new BasicNameValuePair("access_token", accessToken));

            if (assets != null && !assets.isEmpty()) {
                com.buildme.model.MediaAsset first = assets.get(0);
                String mediaUrl = first.getUrl();
                if (first.getContentType() != null && first.getContentType().startsWith("video/")) {
                    containerParams.add(new BasicNameValuePair("media_type", "VIDEO"));
                    containerParams.add(new BasicNameValuePair("video_url", mediaUrl));
                } else {
                    containerParams.add(new BasicNameValuePair("media_type", "IMAGE"));
                    containerParams.add(new BasicNameValuePair("image_url", mediaUrl));
                }
            } else {
                containerParams.add(new BasicNameValuePair("media_type", "TEXT"));
            }

            containerRequest.setEntity(new UrlEncodedFormEntity(containerParams));
            log.info("Threads container request: userId={}, media_type={}, hasMedia={}",
                userId,
                containerParams.stream()
                    .filter(p -> "media_type".equals(p.getName()))
                    .map(NameValuePair::getValue).findFirst().orElse("?"),
                assets != null && !assets.isEmpty());
            String containerJson = http.execute(containerRequest, r -> EntityUtils.toString(r.getEntity()));
            log.info("Threads container raw response: {}", containerJson);
            JsonNode containerNode = objectMapper.readTree(containerJson);

            if (containerNode.has("error")) {
                JsonNode err = containerNode.path("error");
                String msg = err.path("error_user_msg").asText(
                    err.path("message").asText("unknown error"));
                log.error("Threads container creation failed. Response: {}", containerJson);
                throw new CustomExceptions.ExternalApiException(
                    "Threads container creation failed: " + msg);
            }

            String containerId = containerNode.path("id").asText();

            // Step 2: Publish the container
            HttpPost publishRequest = new HttpPost(
                "https://graph.threads.net/v1.0/" + userId + "/threads_publish"
            );
            List<NameValuePair> publishParams = List.of(
                new BasicNameValuePair("creation_id", containerId),
                new BasicNameValuePair("access_token", accessToken)
            );
            publishRequest.setEntity(new UrlEncodedFormEntity(publishParams));
            String publishJson = http.execute(publishRequest, r -> EntityUtils.toString(r.getEntity()));
            log.info("Threads publish raw response: {}", publishJson);
            JsonNode publishNode = objectMapper.readTree(publishJson);

            if (publishNode.has("error")) {
                JsonNode err = publishNode.path("error");
                String msg = err.path("error_user_msg").asText(
                    err.path("message").asText("unknown error"));
                log.error("Threads publish failed. Response: {}", publishJson);
                throw new CustomExceptions.ExternalApiException(
                    "Threads publish failed: " + msg);
            }

            String threadId = publishNode.path("id").asText();
            log.info("Published Threads post {} for post {}", threadId, scheduledPost.getId());
            return threadId;
        } catch (CustomExceptions.ExternalApiException e) {
            throw e;
        } catch (Exception e) {
            throw new CustomExceptions.ExternalApiException("Threads publish failed: " + e.getMessage());
        }
    }

    @Override
    public String getOAuthUrl(Long workspaceId, String state) {
        String stateKey = state + ":" + workspaceId;
        return "https://threads.net/oauth/authorize"
            + "?client_id=" + clientId
            + "&redirect_uri=" + URLEncoder.encode(redirectUri, StandardCharsets.UTF_8)
            + "&scope=threads_basic,threads_content_publish"
            + "&response_type=code"
            + "&state=" + URLEncoder.encode(stateKey, StandardCharsets.UTF_8);
    }

    @Override
    public void handleOAuthCallback(Long workspaceId, String code, String state) {
        log.info("Handling Threads OAuth callback for workspace {}", workspaceId);

        if (clientId.isBlank() || clientSecret.isBlank()) {
            throw new CustomExceptions.ExternalApiException("Threads OAuth credentials not configured");
        }

        try (CloseableHttpClient http = HttpClients.createDefault()) {
            // 1. Exchange code for short-lived token
            HttpPost tokenRequest = new HttpPost("https://graph.threads.net/oauth/access_token");
            List<NameValuePair> params = List.of(
                new BasicNameValuePair("client_id", clientId),
                new BasicNameValuePair("client_secret", clientSecret),
                new BasicNameValuePair("grant_type", "authorization_code"),
                new BasicNameValuePair("redirect_uri", redirectUri),
                new BasicNameValuePair("code", code)
            );
            tokenRequest.setEntity(new UrlEncodedFormEntity(params));
            log.info("Threads token exchange request: client_id={}, redirect_uri={}, code={}",
                clientId, redirectUri, code);
            String tokenJson = http.execute(tokenRequest, r -> EntityUtils.toString(r.getEntity()));
            log.info("Threads token exchange raw response: {}", tokenJson);
            JsonNode tokenNode = objectMapper.readTree(tokenJson);

            if (tokenNode.has("error") || tokenNode.has("error_type") || tokenNode.has("error_message")) {
                String msg = tokenNode.path("error_message").asText(
                    tokenNode.path("error").path("message").asText(
                        tokenNode.path("error").asText(tokenJson)));
                log.error("Threads token exchange failed. Response: {}", tokenJson);
                throw new CustomExceptions.ExternalApiException("Threads token exchange failed: " + msg);
            }

            String shortToken = tokenNode.path("access_token").asText();
            String userId = tokenNode.path("user_id").asText();

            if (shortToken.isBlank()) {
                log.error("Threads token exchange returned no access_token. Response: {}", tokenJson);
                throw new CustomExceptions.ExternalApiException(
                    "Threads token exchange failed: no access_token in response — " + tokenJson);
            }

            // 2. Exchange for long-lived token (60 days)
            HttpGet longTokenRequest = new HttpGet(
                "https://graph.threads.net/access_token"
                + "?grant_type=th_exchange_token"
                + "&client_secret=" + clientSecret
                + "&access_token=" + shortToken
            );
            String longTokenJson = http.execute(longTokenRequest, r -> EntityUtils.toString(r.getEntity()));
            JsonNode longTokenNode = objectMapper.readTree(longTokenJson);
            String longToken = longTokenNode.path("access_token").asText(shortToken);
            long expiresIn = longTokenNode.path("expires_in").asLong(5184000);

            // 3. Fetch profile
            HttpGet profileRequest = new HttpGet(
                "https://graph.threads.net/v1.0/me?fields=id,username,name&access_token=" + longToken
            );
            String profileJson = http.execute(profileRequest, r -> EntityUtils.toString(r.getEntity()));
            JsonNode profile = objectMapper.readTree(profileJson);
            String username = profile.path("username").asText(userId);
            String displayName = profile.path("name").asText(username);

            // 4. Save or update SocialAccount
            Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new CustomExceptions.ExternalApiException("Workspace not found"));

            Optional<SocialAccount> existing = socialAccountRepository
                .findByWorkspaceIdAndPlatformAndAccountId(workspaceId, Platform.THREADS, userId);

            SocialAccount account = existing.orElseGet(() -> SocialAccount.builder()
                .workspace(workspace)
                .platform(Platform.THREADS)
                .accountId(userId)
                .build());

            account.setAccountId(userId);
            account.setHandle("@" + username);
            account.setDisplayName(displayName);
            account.setAccessToken(longToken);
            account.setConnected(true);
            account.setTokenExpiresAt(OffsetDateTime.now().plusSeconds(expiresIn));
            account.setScopes("threads_basic,threads_content_publish");

            socialAccountRepository.save(account);
            log.info("Threads account @{} connected for workspace {}", username, workspaceId);

        } catch (CustomExceptions.ExternalApiException e) {
            throw e;
        } catch (Exception e) {
            throw new CustomExceptions.ExternalApiException("Threads OAuth callback failed: " + e.getMessage());
        }
    }

    @Override
    public void refreshTokenIfNeeded(Long socialAccountId) {
        socialAccountRepository.findById(socialAccountId).ifPresent(account -> {
            if (account.getTokenExpiresAt() != null &&
                account.getTokenExpiresAt().isAfter(OffsetDateTime.now().plusDays(7))) return;

            try (CloseableHttpClient http = HttpClients.createDefault()) {
                HttpGet req = new HttpGet(
                    "https://graph.threads.net/refresh_access_token"
                    + "?grant_type=th_refresh_token"
                    + "&access_token=" + account.getAccessToken()
                );
                String json = http.execute(req, r -> EntityUtils.toString(r.getEntity()));
                JsonNode node = objectMapper.readTree(json);
                String newToken = node.path("access_token").asText();
                if (!newToken.isBlank()) {
                    account.setAccessToken(newToken);
                    account.setTokenExpiresAt(OffsetDateTime.now().plusSeconds(
                        node.path("expires_in").asLong(5184000)));
                    socialAccountRepository.save(account);
                    log.info("Refreshed Threads token for account {}", socialAccountId);
                }
            } catch (Exception e) {
                log.warn("Failed to refresh Threads token for account {}: {}", socialAccountId, e.getMessage());
            }
        });
    }
}
