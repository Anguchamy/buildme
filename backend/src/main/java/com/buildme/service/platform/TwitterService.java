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
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.OffsetDateTime;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@Slf4j
public class TwitterService implements SocialMediaService {

    private final SocialAccountRepository socialAccountRepository;
    private final WorkspaceRepository workspaceRepository;
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    // state -> code_verifier (short-lived, in-memory)
    private final ConcurrentHashMap<String, String> pkceStore = new ConcurrentHashMap<>();

    @Value("${app.oauth.twitter.client-id:}")
    private String clientId;

    @Value("${app.oauth.twitter.client-secret:}")
    private String clientSecret;

    @Value("${app.oauth.twitter.redirect-uri:http://localhost:8080/api/integrations/twitter/callback}")
    private String redirectUri;

    public TwitterService(SocialAccountRepository socialAccountRepository,
                          WorkspaceRepository workspaceRepository) {
        this.socialAccountRepository = socialAccountRepository;
        this.workspaceRepository = workspaceRepository;
    }

    @Override
    public Platform getPlatform() { return Platform.TWITTER; }

    @Override
    public String publish(ScheduledPost scheduledPost) throws Exception {
        if (scheduledPost.getSocialAccount() == null) {
            throw new CustomExceptions.ExternalApiException("Twitter account not connected");
        }

        // Twitter OAuth 2.0 user-context tokens expire in ~2 hours. Refresh
        // proactively before publishing or we'll just get 401 on the tweet
        // create call and burn retries for nothing.
        refreshTokenIfNeeded(scheduledPost.getSocialAccount().getId());

        // Re-read after refresh so we use the new access token if it was rotated.
        SocialAccount refreshed = socialAccountRepository
            .findById(scheduledPost.getSocialAccount().getId())
            .orElse(scheduledPost.getSocialAccount());
        String accessToken = refreshed.getAccessToken();
        String content = scheduledPost.getPost() != null ? scheduledPost.getPost().getCaption() : "";
        List<com.buildme.model.MediaAsset> assets =
            scheduledPost.getPost() != null ? scheduledPost.getPost().getMediaAssets() : null;

        log.info("Publishing tweet for post {}", scheduledPost.getId());

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);
        headers.setContentType(MediaType.APPLICATION_JSON);

        // If media assets present, upload them first via v1.1 media upload API
        List<String> mediaIds = new java.util.ArrayList<>();
        if (assets != null && !assets.isEmpty()) {
            // Twitter media upload uses v1.1 API (OAuth 2.0 Bearer token accepted for uploads)
            for (com.buildme.model.MediaAsset asset : assets) {
                if (mediaIds.size() >= 4) break; // Twitter allows max 4 images or 1 video/GIF
                try {
                    String mediaId = uploadMediaToTwitter(accessToken, asset);
                    mediaIds.add(mediaId);
                    // Twitter allows only 1 video or GIF
                    if (asset.getContentType() != null &&
                        (asset.getContentType().startsWith("video/") || asset.getContentType().equals("image/gif"))) {
                        break;
                    }
                } catch (Exception e) {
                    log.warn("Failed to upload media asset {} to Twitter: {}", asset.getId(), e.getMessage());
                }
            }
        }

        Map<String, Object> tweetBody;
        if (!mediaIds.isEmpty()) {
            tweetBody = Map.of(
                "text", content,
                "media", Map.of("media_ids", mediaIds)
            );
        } else {
            tweetBody = Map.of("text", content);
        }

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(tweetBody, headers);
        ResponseEntity<String> response = restTemplate.postForEntity(
            "https://api.twitter.com/2/tweets", request, String.class);

        JsonNode root = objectMapper.readTree(response.getBody());
        if (root.has("errors")) {
            throw new CustomExceptions.ExternalApiException(
                "Twitter publish failed: " + root.path("errors").get(0).path("message").asText("unknown error"));
        }
        String tweetId = root.path("data").path("id").asText();
        log.info("Published tweet {} for post {}", tweetId, scheduledPost.getId());
        return tweetId;
    }

    private String uploadMediaToTwitter(String accessToken, com.buildme.model.MediaAsset asset) throws Exception {
        // Download media bytes from CDN URL
        org.apache.hc.client5.http.impl.classic.CloseableHttpClient http =
            org.apache.hc.client5.http.impl.classic.HttpClients.createDefault();

        byte[] mediaBytes;
        try (http) {
            org.apache.hc.client5.http.classic.methods.HttpGet downloadReq =
                new org.apache.hc.client5.http.classic.methods.HttpGet(asset.getUrl());
            mediaBytes = http.execute(downloadReq,
                r -> org.apache.hc.core5.http.io.entity.EntityUtils.toByteArray(r.getEntity()));
        }

        String mediaType = asset.getContentType() != null ? asset.getContentType() : "image/jpeg";
        String mediaCategory;
        if (mediaType.startsWith("video/")) {
            mediaCategory = "tweet_video";
        } else if (mediaType.equals("image/gif")) {
            mediaCategory = "tweet_gif";
        } else {
            mediaCategory = "tweet_image";
        }

        // Use v2 media upload. The v1.1 endpoint rejects OAuth 2.0 user-context
        // bearer tokens (it requires OAuth 1.0a signed requests with consumer
        // key/secret + access token/secret), which is why we kept getting 403.
        // v2 accepts the same OAuth 2.0 bearer token we use for /2/tweets.
        HttpHeaders uploadHeaders = new HttpHeaders();
        uploadHeaders.setBearerAuth(accessToken);
        uploadHeaders.setContentType(MediaType.MULTIPART_FORM_DATA);

        org.springframework.core.io.ByteArrayResource mediaResource =
            new org.springframework.core.io.ByteArrayResource(mediaBytes) {
                @Override public String getFilename() {
                    return asset.getFileName() != null ? asset.getFileName() : "upload";
                }
            };
        org.springframework.util.MultiValueMap<String, Object> form =
            new org.springframework.util.LinkedMultiValueMap<>();
        form.add("media", mediaResource);
        form.add("media_category", mediaCategory);

        HttpEntity<org.springframework.util.MultiValueMap<String, Object>> uploadRequest =
            new HttpEntity<>(form, uploadHeaders);

        ResponseEntity<String> uploadResponse = restTemplate.postForEntity(
            "https://api.x.com/2/media/upload", uploadRequest, String.class);

        JsonNode uploadNode = objectMapper.readTree(uploadResponse.getBody());
        if (uploadNode.has("errors")) {
            throw new CustomExceptions.ExternalApiException(
                "Twitter media upload failed: " + uploadNode.path("errors").toString());
        }
        // v2 response: { "data": { "id": "...", "media_key": "..." } }
        JsonNode data = uploadNode.path("data");
        String mediaId = data.path("id").asText();
        if (mediaId.isBlank()) {
            // Fall back to media_id_string for compatibility, though v2 should
            // always return id under data.
            mediaId = uploadNode.path("media_id_string").asText();
        }
        if (mediaId.isBlank()) {
            throw new CustomExceptions.ExternalApiException(
                "Twitter media upload returned no media id: " + uploadResponse.getBody());
        }
        return mediaId;
    }

    @Override
    public String getOAuthUrl(Long workspaceId, String state) {
        String codeVerifier = generateCodeVerifier();
        String codeChallenge = generateCodeChallenge(codeVerifier);
        String stateKey = state + ":" + workspaceId;

        pkceStore.put(stateKey, codeVerifier);

        return "https://twitter.com/i/oauth2/authorize"
            + "?response_type=code"
            + "&client_id=" + clientId
            + "&redirect_uri=" + URLEncoder.encode(redirectUri, StandardCharsets.UTF_8)
            + "&scope=tweet.read+tweet.write+users.read+offline.access"
            + "&state=" + URLEncoder.encode(stateKey, StandardCharsets.UTF_8)
            + "&code_challenge=" + codeChallenge
            + "&code_challenge_method=S256";
    }

    @Override
    public void handleOAuthCallback(Long workspaceId, String code, String state) {
        String codeVerifier = pkceStore.remove(state);
        if (codeVerifier == null) {
            log.error("No PKCE verifier found for state: {}", state);
            throw new CustomExceptions.ExternalApiException("Invalid OAuth state");
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        String credentials = Base64.getEncoder().encodeToString(
            (clientId + ":" + clientSecret).getBytes(StandardCharsets.UTF_8));
        headers.set(HttpHeaders.AUTHORIZATION, "Basic " + credentials);

        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.add("grant_type", "authorization_code");
        params.add("code", code);
        params.add("redirect_uri", redirectUri);
        params.add("code_verifier", codeVerifier);

        HttpEntity<MultiValueMap<String, String>> tokenRequest = new HttpEntity<>(params, headers);
        ResponseEntity<String> tokenResponse = restTemplate.postForEntity(
            "https://api.twitter.com/2/oauth2/token", tokenRequest, String.class);

        try {
            JsonNode tokens = objectMapper.readTree(tokenResponse.getBody());
            String accessToken = tokens.path("access_token").asText();
            String refreshToken = tokens.path("refresh_token").asText(null);
            int expiresIn = tokens.path("expires_in").asInt(7200);

            HttpHeaders userHeaders = new HttpHeaders();
            userHeaders.setBearerAuth(accessToken);
            ResponseEntity<String> userResponse = restTemplate.exchange(
                "https://api.twitter.com/2/users/me?user.fields=username,name",
                HttpMethod.GET, new HttpEntity<>(userHeaders), String.class);

            JsonNode userData = objectMapper.readTree(userResponse.getBody()).path("data");
            String accountId = userData.path("id").asText();
            String username = userData.path("username").asText();
            String displayName = userData.path("name").asText();

            Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new CustomExceptions.ExternalApiException("Workspace not found"));

            List<SocialAccount> existing = socialAccountRepository
                .findByWorkspaceIdAndPlatform(workspaceId, Platform.TWITTER);

            SocialAccount account = existing.stream()
                .filter(a -> a.getAccountId().equals(accountId))
                .findFirst()
                .orElse(SocialAccount.builder()
                    .workspace(workspace)
                    .platform(Platform.TWITTER)
                    .accountId(accountId)
                    .build());

            account.setHandle("@" + username);
            account.setDisplayName(displayName);
            account.setAccessToken(accessToken);
            account.setRefreshToken(refreshToken);
            account.setTokenExpiresAt(OffsetDateTime.now().plusSeconds(expiresIn));
            account.setScopes("tweet.read tweet.write users.read offline.access");
            account.setConnected(true);

            socialAccountRepository.save(account);
            log.info("Twitter account @{} connected for workspace {}", username, workspaceId);

        } catch (Exception e) {
            log.error("Failed to handle Twitter OAuth callback", e);
            throw new CustomExceptions.ExternalApiException("Twitter OAuth failed: " + e.getMessage());
        }
    }

    @Override
    public void refreshTokenIfNeeded(Long socialAccountId) {
        socialAccountRepository.findById(socialAccountId).ifPresent(account -> {
            if (account.getRefreshToken() == null) return;
            if (account.getTokenExpiresAt() != null &&
                account.getTokenExpiresAt().isAfter(OffsetDateTime.now().plusMinutes(5))) return;

            try {
                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
                String credentials = Base64.getEncoder().encodeToString(
                    (clientId + ":" + clientSecret).getBytes(StandardCharsets.UTF_8));
                headers.set(HttpHeaders.AUTHORIZATION, "Basic " + credentials);

                MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
                params.add("grant_type", "refresh_token");
                params.add("refresh_token", account.getRefreshToken());

                HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(params, headers);
                ResponseEntity<String> response = restTemplate.postForEntity(
                    "https://api.twitter.com/2/oauth2/token", request, String.class);

                JsonNode tokens = objectMapper.readTree(response.getBody());
                account.setAccessToken(tokens.path("access_token").asText());
                String newRefresh = tokens.path("refresh_token").asText(null);
                if (newRefresh != null) account.setRefreshToken(newRefresh);
                account.setTokenExpiresAt(OffsetDateTime.now().plusSeconds(
                    tokens.path("expires_in").asInt(7200)));

                socialAccountRepository.save(account);
                log.info("Refreshed Twitter token for account {}", socialAccountId);
            } catch (Exception e) {
                log.error("Failed to refresh Twitter token for account {}", socialAccountId, e);
            }
        });
    }

    private String generateCodeVerifier() {
        byte[] bytes = new byte[32];
        new SecureRandom().nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String generateCodeChallenge(String verifier) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(verifier.getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(hash);
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate PKCE challenge", e);
        }
    }
}
