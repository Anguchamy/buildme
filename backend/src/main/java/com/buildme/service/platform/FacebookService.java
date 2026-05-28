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
public class FacebookService implements SocialMediaService {

    private final SocialAccountRepository socialAccountRepository;
    private final WorkspaceRepository workspaceRepository;
    private final ObjectMapper objectMapper;

    @Value("${app.oauth.facebook.app-id:}")
    private String appId;

    @Value("${app.oauth.facebook.app-secret:}")
    private String appSecret;

    @Value("${app.oauth.facebook.redirect-uri:http://localhost:8080/api/integrations/facebook/callback}")
    private String redirectUri;

    public FacebookService(SocialAccountRepository socialAccountRepository,
                           WorkspaceRepository workspaceRepository,
                           ObjectMapper objectMapper) {
        this.socialAccountRepository = socialAccountRepository;
        this.workspaceRepository = workspaceRepository;
        this.objectMapper = objectMapper;
    }

    @Override
    public Platform getPlatform() { return Platform.FACEBOOK; }

    @Override
    public String publish(ScheduledPost scheduledPost) throws Exception {
        if (scheduledPost.getSocialAccount() == null) {
            throw new CustomExceptions.ExternalApiException("Facebook account not connected");
        }

        String accessToken = scheduledPost.getSocialAccount().getAccessToken();
        String accountId = scheduledPost.getSocialAccount().getAccountId();
        String caption = scheduledPost.getPost() != null ? scheduledPost.getPost().getCaption() : "";
        List<com.buildme.model.MediaAsset> assets =
            scheduledPost.getPost() != null ? scheduledPost.getPost().getMediaAssets() : null;

        log.info("Publishing to Facebook page {}: post {}", accountId, scheduledPost.getId());

        try (CloseableHttpClient http = HttpClients.createDefault()) {
            // If there's an image asset, publish as photo
            if (assets != null && !assets.isEmpty()) {
                com.buildme.model.MediaAsset first = assets.get(0);
                String mediaUrl = first.getUrl();
                boolean isVideo = first.getContentType() != null && first.getContentType().startsWith("video/");

                if (isVideo) {
                    // Facebook video upload: POST to /videos endpoint
                    HttpPost videoRequest = new HttpPost(
                        "https://graph.facebook.com/v19.0/" + accountId + "/videos"
                    );
                    List<NameValuePair> params = new java.util.ArrayList<>(List.of(
                        new BasicNameValuePair("file_url", mediaUrl),
                        new BasicNameValuePair("description", caption),
                        new BasicNameValuePair("access_token", accessToken)
                    ));
                    videoRequest.setEntity(new UrlEncodedFormEntity(params));
                    String response = http.execute(videoRequest, r -> EntityUtils.toString(r.getEntity()));
                    JsonNode node = objectMapper.readTree(response);
                    if (node.has("error")) {
                        throw new CustomExceptions.ExternalApiException(
                            "Facebook video publish failed: " + node.path("error").path("message").asText("unknown error"));
                    }
                    String postId = node.path("id").asText();
                    log.info("Published video to Facebook page {} — post id {}", accountId, postId);
                    return postId;
                } else {
                    // Facebook photo upload: POST to /photos endpoint
                    HttpPost photoRequest = new HttpPost(
                        "https://graph.facebook.com/v19.0/" + accountId + "/photos"
                    );
                    List<NameValuePair> params = List.of(
                        new BasicNameValuePair("url", mediaUrl),
                        new BasicNameValuePair("caption", caption),
                        new BasicNameValuePair("access_token", accessToken)
                    );
                    photoRequest.setEntity(new UrlEncodedFormEntity(params));
                    String response = http.execute(photoRequest, r -> EntityUtils.toString(r.getEntity()));
                    JsonNode node = objectMapper.readTree(response);
                    if (node.has("error")) {
                        throw new CustomExceptions.ExternalApiException(
                            "Facebook photo publish failed: " + node.path("error").path("message").asText("unknown error"));
                    }
                    String postId = node.path("post_id").asText(node.path("id").asText());
                    log.info("Published photo to Facebook page {} — post id {}", accountId, postId);
                    return postId;
                }
            }

            // Text-only post
            HttpPost postRequest = new HttpPost(
                "https://graph.facebook.com/v19.0/" + accountId + "/feed"
            );
            List<NameValuePair> params = List.of(
                new BasicNameValuePair("message", caption),
                new BasicNameValuePair("access_token", accessToken)
            );
            postRequest.setEntity(new UrlEncodedFormEntity(params));
            String response = http.execute(postRequest, r -> EntityUtils.toString(r.getEntity()));
            JsonNode node = objectMapper.readTree(response);
            if (node.has("error")) {
                throw new CustomExceptions.ExternalApiException(
                    "Facebook publish failed: " + node.path("error").path("message").asText("unknown error"));
            }
            String postId = node.path("id").asText();
            log.info("Published to Facebook page {} — post id {}", accountId, postId);
            return postId;
        } catch (CustomExceptions.ExternalApiException e) {
            throw e;
        } catch (Exception e) {
            throw new CustomExceptions.ExternalApiException("Facebook publish failed: " + e.getMessage());
        }
    }

    @Override
    public String getOAuthUrl(Long workspaceId, String state) {
        String stateKey = state + ":" + workspaceId;
        return "https://www.facebook.com/v19.0/dialog/oauth"
            + "?client_id=" + appId
            + "&redirect_uri=" + URLEncoder.encode(redirectUri, StandardCharsets.UTF_8)
            + "&scope=pages_show_list,pages_read_engagement,business_management"
            + "&response_type=code"
            + "&state=" + URLEncoder.encode(stateKey, StandardCharsets.UTF_8);
    }

    @Override
    public void handleOAuthCallback(Long workspaceId, String code, String state) {
        log.info("Handling Facebook OAuth callback for workspace {}", workspaceId);

        if (appId.isBlank() || appSecret.isBlank()) {
            throw new CustomExceptions.ExternalApiException("Facebook OAuth credentials not configured");
        }

        try (CloseableHttpClient http = HttpClients.createDefault()) {
            // 1. Exchange code for access token
            HttpPost tokenRequest = new HttpPost("https://graph.facebook.com/v19.0/oauth/access_token");
            List<NameValuePair> params = List.of(
                new BasicNameValuePair("client_id", appId),
                new BasicNameValuePair("client_secret", appSecret),
                new BasicNameValuePair("grant_type", "authorization_code"),
                new BasicNameValuePair("redirect_uri", redirectUri),
                new BasicNameValuePair("code", code)
            );
            tokenRequest.setEntity(new UrlEncodedFormEntity(params));
            String tokenJson = http.execute(tokenRequest, r -> EntityUtils.toString(r.getEntity()));
            JsonNode tokenNode = objectMapper.readTree(tokenJson);

            if (tokenNode.has("error")) {
                throw new CustomExceptions.ExternalApiException(
                    "Facebook token exchange failed: " + tokenNode.path("error").path("message").asText("unknown error"));
            }

            String accessToken = tokenNode.path("access_token").asText();

            // 2. Fetch user profile
            HttpGet profileRequest = new HttpGet(
                "https://graph.facebook.com/v19.0/me?fields=id,name&access_token=" + accessToken
            );
            String profileJson = http.execute(profileRequest, r -> EntityUtils.toString(r.getEntity()));
            JsonNode profile = objectMapper.readTree(profileJson);
            String userId = profile.path("id").asText();
            String displayName = profile.path("name").asText(userId);

            // 3. Fetch Facebook Pages managed by user
            HttpGet pagesRequest = new HttpGet(
                "https://graph.facebook.com/v19.0/me/accounts?access_token=" + accessToken
            );
            String pagesJson = http.execute(pagesRequest, r -> EntityUtils.toString(r.getEntity()));
            JsonNode pagesNode = objectMapper.readTree(pagesJson);
            JsonNode pages = pagesNode.path("data");

            // Use first page if available, otherwise use user account
            String accountId = userId;
            String handle = displayName;
            String pageToken = accessToken;

            if (pages.isArray() && pages.size() > 0) {
                JsonNode firstPage = pages.get(0);
                accountId = firstPage.path("id").asText(userId);
                handle = firstPage.path("name").asText(displayName);
                pageToken = firstPage.path("access_token").asText(accessToken);
            }

            // 4. Save or update SocialAccount
            Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new CustomExceptions.ExternalApiException("Workspace not found"));

            Optional<SocialAccount> existing = socialAccountRepository
                .findByWorkspaceIdAndPlatform(workspaceId, Platform.FACEBOOK)
                .stream().findFirst();

            SocialAccount account = existing.orElse(SocialAccount.builder()
                .workspace(workspace)
                .platform(Platform.FACEBOOK)
                .accountId(accountId)
                .build());

            account.setAccountId(accountId);
            account.setHandle(handle);
            account.setDisplayName(displayName);
            account.setAccessToken(pageToken);
            account.setConnected(true);
            account.setTokenExpiresAt(OffsetDateTime.now().plusDays(60));
            account.setScopes("pages_show_list,pages_read_engagement,business_management");

            socialAccountRepository.save(account);
            log.info("Facebook account '{}' connected for workspace {}", handle, workspaceId);

        } catch (CustomExceptions.ExternalApiException e) {
            throw e;
        } catch (Exception e) {
            throw new CustomExceptions.ExternalApiException("Facebook OAuth callback failed: " + e.getMessage());
        }
    }

    @Override
    public void refreshTokenIfNeeded(Long socialAccountId) {
        // Facebook long-lived tokens last ~60 days; extend if < 7 days left
        socialAccountRepository.findById(socialAccountId).ifPresent(account -> {
            if (account.getTokenExpiresAt() != null &&
                account.getTokenExpiresAt().isAfter(OffsetDateTime.now().plusDays(7))) return;

            try (CloseableHttpClient http = HttpClients.createDefault()) {
                HttpGet req = new HttpGet(
                    "https://graph.facebook.com/v19.0/oauth/access_token"
                    + "?grant_type=fb_exchange_token"
                    + "&client_id=" + appId
                    + "&client_secret=" + appSecret
                    + "&fb_exchange_token=" + account.getAccessToken()
                );
                String json = http.execute(req, r -> EntityUtils.toString(r.getEntity()));
                JsonNode node = objectMapper.readTree(json);
                String newToken = node.path("access_token").asText();
                if (!newToken.isBlank()) {
                    account.setAccessToken(newToken);
                    account.setTokenExpiresAt(OffsetDateTime.now().plusDays(60));
                    socialAccountRepository.save(account);
                    log.info("Refreshed Facebook token for account {}", socialAccountId);
                }
            } catch (Exception e) {
                log.warn("Failed to refresh Facebook token for account {}: {}", socialAccountId, e.getMessage());
            }
        });
    }
}
