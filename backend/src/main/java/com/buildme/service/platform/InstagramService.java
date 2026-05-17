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

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class InstagramService implements SocialMediaService {

    private final SocialAccountRepository socialAccountRepository;
    private final WorkspaceRepository workspaceRepository;
    private final ObjectMapper objectMapper;

    @Value("${app.oauth.instagram.client-id:}")
    private String clientId;

    @Value("${app.oauth.instagram.client-secret:}")
    private String clientSecret;

    @Value("${app.oauth.instagram.redirect-uri:http://localhost:8080/api/integrations/instagram/callback}")
    private String redirectUri;

    @Override
    public Platform getPlatform() {
        return Platform.INSTAGRAM;
    }

    @Override
    public String publish(ScheduledPost scheduledPost) throws Exception {
        SocialAccount account = scheduledPost.getSocialAccount();
        if (account == null || !account.isConnected()) {
            throw new CustomExceptions.ExternalApiException("Instagram account not connected");
        }

        // Instagram Graph API: create container then publish
        String caption = scheduledPost.getPost().getCaption();
        String accessToken = account.getAccessToken();

        log.info("Publishing post {} to Instagram account {}", scheduledPost.getId(), account.getHandle());

        // In production: call Instagram Graph API
        // POST /{ig-user-id}/media → get container_id
        // POST /{ig-user-id}/media_publish?creation_id={container_id}
        return "ig_" + System.currentTimeMillis(); // stub external ID
    }

    @Override
    public String getOAuthUrl(Long workspaceId, String state) {
        // Instagram Graph API now uses Facebook OAuth login
        String stateKey = state + ":" + workspaceId;
        return "https://www.facebook.com/v19.0/dialog/oauth"
            + "?client_id=" + clientId
            + "&redirect_uri=" + URLEncoder.encode(redirectUri, StandardCharsets.UTF_8)
            + "&scope=pages_show_list,instagram_basic,pages_read_engagement,instagram_manage_comments,instagram_content_publish"
            + "&response_type=code"
            + "&state=" + URLEncoder.encode(stateKey, StandardCharsets.UTF_8);
    }

    @Override
    public void handleOAuthCallback(Long workspaceId, String code, String state) {
        log.info("Handling Instagram OAuth callback for workspace {}", workspaceId);

        if (clientId.isBlank() || clientSecret.isBlank()) {
            throw new CustomExceptions.ExternalApiException("Instagram OAuth credentials not configured");
        }

        try (CloseableHttpClient http = HttpClients.createDefault()) {
            // 1. Exchange code for access token via Facebook Graph API
            HttpPost tokenRequest = new HttpPost("https://graph.facebook.com/v19.0/oauth/access_token");
            List<NameValuePair> params = List.of(
                new BasicNameValuePair("client_id", clientId),
                new BasicNameValuePair("client_secret", clientSecret),
                new BasicNameValuePair("grant_type", "authorization_code"),
                new BasicNameValuePair("redirect_uri", redirectUri),
                new BasicNameValuePair("code", code)
            );
            tokenRequest.setEntity(new UrlEncodedFormEntity(params));
            String tokenJson = http.execute(tokenRequest, r -> EntityUtils.toString(r.getEntity()));
            JsonNode tokenNode = objectMapper.readTree(tokenJson);

            if (tokenNode.has("error")) {
                throw new CustomExceptions.ExternalApiException(
                    "Instagram token exchange failed: " + tokenNode.path("error").path("message").asText("unknown error"));
            }

            String accessToken = tokenNode.path("access_token").asText();

            // 2. Fetch the user's Instagram Business Account linked to their Facebook account
            HttpGet igAccountRequest = new HttpGet(
                "https://graph.facebook.com/v19.0/me/accounts"
                + "?fields=instagram_business_account{id,username,name}"
                + "&access_token=" + accessToken
            );
            String igAccountJson = http.execute(igAccountRequest, r -> EntityUtils.toString(r.getEntity()));
            JsonNode igAccountNode = objectMapper.readTree(igAccountJson);

            // Find first page with a linked Instagram business account
            JsonNode pages = igAccountNode.path("data");
            String igUserId = null;
            String igUsername = null;
            String displayName = null;

            for (JsonNode page : pages) {
                JsonNode igAccount = page.path("instagram_business_account");
                if (!igAccount.isMissingNode() && igAccount.has("id")) {
                    igUserId = igAccount.path("id").asText();
                    igUsername = igAccount.path("username").asText(igUserId);
                    displayName = igAccount.path("name").asText(igUsername);
                    break;
                }
            }

            if (igUserId == null) {
                throw new CustomExceptions.ExternalApiException(
                    "No Instagram Business account linked to this Facebook account. " +
                    "Please link an Instagram Business or Creator account to your Facebook Page.");
            }

            // 3. Save or update SocialAccount
            Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new CustomExceptions.ResourceNotFoundException("Workspace", workspaceId));

            Optional<SocialAccount> existing = socialAccountRepository
                .findByWorkspaceIdAndPlatform(workspaceId, Platform.INSTAGRAM)
                .stream().findFirst();

            SocialAccount account = existing.orElse(SocialAccount.builder()
                .workspace(workspace)
                .platform(Platform.INSTAGRAM)
                .accountId(igUserId)
                .build());

            account.setAccountId(igUserId);
            account.setHandle(igUsername);
            account.setDisplayName(displayName);
            account.setAccessToken(accessToken);
            account.setConnected(true);
            // Facebook user tokens are long-lived (60 days)
            account.setTokenExpiresAt(OffsetDateTime.now().plusDays(60));
            account.setScopes("instagram_business_basic,instagram_manage_comments,instagram_content_publish");

            socialAccountRepository.save(account);
            log.info("Instagram Business account @{} connected for workspace {}", igUsername, workspaceId);

        } catch (CustomExceptions.ExternalApiException e) {
            throw e;
        } catch (Exception e) {
            throw new CustomExceptions.ExternalApiException("Instagram OAuth callback failed: " + e.getMessage(), e);
        }
    }

    @Override
    public void refreshTokenIfNeeded(Long socialAccountId) {
        // Instagram long-lived tokens expire in 60 days; refresh if < 7 days left
        socialAccountRepository.findById(socialAccountId).ifPresent(account -> {
            if (account.getTokenExpiresAt() != null
                && account.getTokenExpiresAt().isBefore(OffsetDateTime.now().plusDays(7))) {
                try (CloseableHttpClient http = HttpClients.createDefault()) {
                    HttpGet req = new HttpGet(
                        "https://graph.instagram.com/refresh_access_token"
                        + "?grant_type=ig_refresh_token"
                        + "&access_token=" + account.getAccessToken()
                    );
                    String json = http.execute(req, r -> EntityUtils.toString(r.getEntity()));
                    JsonNode node = objectMapper.readTree(json);
                    String newToken = node.path("access_token").asText();
                    long expiresIn = node.path("expires_in").asLong(5184000);
                    if (!newToken.isBlank()) {
                        account.setAccessToken(newToken);
                        account.setTokenExpiresAt(OffsetDateTime.now().plusSeconds(expiresIn));
                        socialAccountRepository.save(account);
                        log.info("Refreshed Instagram token for account {}", socialAccountId);
                    }
                } catch (Exception e) {
                    log.warn("Failed to refresh Instagram token for account {}: {}", socialAccountId, e.getMessage());
                }
            }
        });
    }
}
