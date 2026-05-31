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

        String igUserId    = account.getAccountId();
        String accessToken = account.getAccessToken();
        String caption     = scheduledPost.getPost().getCaption();

        log.info("Publishing post {} to Instagram account {}", scheduledPost.getId(), account.getHandle());

        // Instagram Graph API does not support text-only posts — every post must
        // contain an image or video. Fail fast with a clear message so the user
        // knows to attach media instead of cycling through 3 retries.
        List<com.buildme.model.MediaAsset> assets = scheduledPost.getPost().getMediaAssets();
        if (assets == null || assets.isEmpty()) {
            throw new CustomExceptions.ExternalApiException(
                "Instagram requires an image or video. Attach a media asset to this post.");
        }

        try (CloseableHttpClient http = HttpClients.createDefault()) {

            // Step 1: create media container. Use graph.facebook.com because we store
            // the Facebook Page access token (required for IG Business publishing).
            HttpPost containerRequest = new HttpPost(
                "https://graph.facebook.com/v19.0/" + igUserId + "/media"
            );
            List<NameValuePair> containerParams = new java.util.ArrayList<>(List.of(
                new BasicNameValuePair("caption", caption != null ? caption : ""),
                new BasicNameValuePair("access_token", accessToken)
            ));

            com.buildme.model.MediaAsset first = assets.get(0);
            String mediaUrl = first.getUrl();
            if (mediaUrl == null || mediaUrl.isBlank()) {
                throw new CustomExceptions.ExternalApiException(
                    "Media asset has no URL — cannot publish to Instagram.");
            }
            if (first.getContentType() != null && first.getContentType().startsWith("video/")) {
                containerParams.add(new BasicNameValuePair("media_type", "REELS"));
                containerParams.add(new BasicNameValuePair("video_url", mediaUrl));
            } else {
                containerParams.add(new BasicNameValuePair("image_url", mediaUrl));
            }

            containerRequest.setEntity(new UrlEncodedFormEntity(containerParams));
            String containerJson = http.execute(containerRequest, r -> EntityUtils.toString(r.getEntity()));
            JsonNode containerNode = objectMapper.readTree(containerJson);

            if (containerNode.has("error")) {
                throw new CustomExceptions.ExternalApiException(
                    "Instagram container creation failed: " + containerNode.path("error").path("message").asText("unknown error"));
            }

            String containerId = containerNode.path("id").asText();
            if (containerId.isBlank()) {
                throw new CustomExceptions.ExternalApiException("Instagram returned empty container id");
            }

            // For video/REELS the container needs time to finish processing before publish.
            // Poll status_code until FINISHED (or fail), with a hard cap.
            boolean isVideo = first.getContentType() != null
                && first.getContentType().startsWith("video/");
            if (isVideo) {
                waitForContainerReady(http, containerId, accessToken);
            }

            // Step 2: publish the container
            HttpPost publishRequest = new HttpPost(
                "https://graph.facebook.com/v19.0/" + igUserId + "/media_publish"
            );
            publishRequest.setEntity(new UrlEncodedFormEntity(List.of(
                new BasicNameValuePair("creation_id", containerId),
                new BasicNameValuePair("access_token", accessToken)
            )));
            String publishJson = http.execute(publishRequest, r -> EntityUtils.toString(r.getEntity()));
            JsonNode publishNode = objectMapper.readTree(publishJson);

            if (publishNode.has("error")) {
                throw new CustomExceptions.ExternalApiException(
                    "Instagram publish failed: " + publishNode.path("error").path("message").asText("unknown error"));
            }

            String postId = publishNode.path("id").asText();
            log.info("Published to Instagram account {} — post id {}", account.getHandle(), postId);
            return postId;
        }
    }

    private void waitForContainerReady(CloseableHttpClient http, String containerId, String accessToken) throws Exception {
        int maxAttempts = 30;          // ~5 minutes worst case
        long sleepMs = 10_000L;
        for (int i = 0; i < maxAttempts; i++) {
            HttpGet statusReq = new HttpGet(
                "https://graph.facebook.com/v19.0/" + containerId
                + "?fields=status_code,status"
                + "&access_token=" + accessToken
            );
            String json = http.execute(statusReq, r -> EntityUtils.toString(r.getEntity()));
            JsonNode node = objectMapper.readTree(json);
            String code = node.path("status_code").asText("");
            if ("FINISHED".equals(code)) return;
            if ("ERROR".equals(code) || "EXPIRED".equals(code)) {
                throw new CustomExceptions.ExternalApiException(
                    "Instagram media container " + code + ": " + node.path("status").asText(""));
            }
            Thread.sleep(sleepMs);
        }
        throw new CustomExceptions.ExternalApiException(
            "Instagram media container did not finish processing in time");
    }

    @Override
    public String getOAuthUrl(Long workspaceId, String state) {
        // Instagram Graph API now uses Facebook OAuth login
        String stateKey = state + ":" + workspaceId;
        return "https://www.facebook.com/v19.0/dialog/oauth"
            + "?client_id=" + clientId
            + "&redirect_uri=" + URLEncoder.encode(redirectUri, StandardCharsets.UTF_8)
            + "&scope=instagram_basic,instagram_content_publish,pages_read_engagement,pages_show_list,business_management"
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

            String shortLivedToken = tokenNode.path("access_token").asText();

            // 1b. Exchange short-lived token for a long-lived token (valid 60 days)
            HttpGet longLivedRequest = new HttpGet(
                "https://graph.facebook.com/v19.0/oauth/access_token"
                + "?grant_type=fb_exchange_token"
                + "&client_id=" + clientId
                + "&client_secret=" + clientSecret
                + "&fb_exchange_token=" + shortLivedToken
            );
            String longLivedJson = http.execute(longLivedRequest, r -> EntityUtils.toString(r.getEntity()));
            JsonNode longLivedNode = objectMapper.readTree(longLivedJson);
            String accessToken = longLivedNode.has("access_token")
                ? longLivedNode.path("access_token").asText()
                : shortLivedToken; // fallback to short-lived if exchange fails

            // 2. Get list of Facebook Pages
            HttpGet pagesRequest = new HttpGet(
                "https://graph.facebook.com/v19.0/me/accounts"
                + "?access_token=" + accessToken
            );
            String pagesJson = http.execute(pagesRequest, r -> EntityUtils.toString(r.getEntity()));
            JsonNode pagesNode = objectMapper.readTree(pagesJson);
            JsonNode pages = pagesNode.path("data");

            String igUserId = null;
            String igUsername = null;
            String displayName = null;
            String publishingToken = null; // the Page access token tied to the IG Business account

            // 3. For each page, fetch linked Instagram business account
            for (JsonNode page : pages) {
                String pageId = page.path("id").asText();
                String pageToken = page.path("access_token").asText();
                HttpGet igRequest = new HttpGet(
                    "https://graph.facebook.com/v19.0/" + pageId
                    + "?fields=instagram_business_account"
                    + "&access_token=" + pageToken
                );
                String igJson = http.execute(igRequest, r -> EntityUtils.toString(r.getEntity()));
                JsonNode igNode = objectMapper.readTree(igJson).path("instagram_business_account");
                if (!igNode.isMissingNode() && igNode.has("id")) {
                    igUserId = igNode.path("id").asText();
                    publishingToken = pageToken;
                    // Fetch username separately
                    HttpGet igProfileRequest = new HttpGet(
                        "https://graph.facebook.com/v19.0/" + igUserId
                        + "?fields=username,name"
                        + "&access_token=" + pageToken
                    );
                    String igProfileJson = http.execute(igProfileRequest, r -> EntityUtils.toString(r.getEntity()));
                    JsonNode igProfile = objectMapper.readTree(igProfileJson);
                    igUsername = igProfile.path("username").asText(igUserId);
                    displayName = igProfile.path("name").asText(igUsername);
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
            // Save the Page access token — that's what graph.facebook.com requires for
            // IG Business publishing. Page tokens derived from a long-lived user token
            // do not expire as long as the user token stays valid.
            account.setAccessToken(publishingToken);
            account.setConnected(true);
            account.setTokenExpiresAt(OffsetDateTime.now().plusDays(60));
            account.setScopes("instagram_basic,instagram_content_publish,pages_read_engagement,pages_show_list");

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
        // We persist a Facebook Page access token (derived from a long-lived user token)
        // for IG Business publishing. Page tokens have no expiry of their own — they
        // remain valid as long as the parent user token does. If the user token is
        // invalidated, the user must re-OAuth; there is no automatic refresh path.
        log.debug("Instagram refresh is a no-op for Page access tokens (account {})", socialAccountId);
    }
}
