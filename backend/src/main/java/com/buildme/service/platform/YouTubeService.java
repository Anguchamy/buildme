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
        SocialAccount account = scheduledPost.getSocialAccount();
        if (account == null || !account.isConnected()) {
            throw new CustomExceptions.ExternalApiException("YouTube account not connected");
        }

        String accessToken = account.getAccessToken();
        String caption = scheduledPost.getPost() != null ? scheduledPost.getPost().getCaption() : "";
        List<com.buildme.model.MediaAsset> assets =
            scheduledPost.getPost() != null ? scheduledPost.getPost().getMediaAssets() : null;

        // YouTube requires a video — if no video asset, publish as community post (text)
        if (assets == null || assets.isEmpty()) {
            // YouTube does not have a public text-only post API via Data API v3;
            // post as a channel community post is only available to channels with 500+ subscribers.
            // We gracefully fail rather than silently succeed with a fake ID.
            throw new CustomExceptions.ExternalApiException(
                "YouTube requires a video to publish. Please attach a video asset to this post.");
        }

        // Find first video asset
        com.buildme.model.MediaAsset videoAsset = assets.stream()
            .filter(a -> a.getContentType() != null && a.getContentType().startsWith("video/"))
            .findFirst()
            .orElseThrow(() -> new CustomExceptions.ExternalApiException(
                "YouTube requires a video asset. No video found in media assets."));

        String videoUrl = videoAsset.getUrl();
        log.info("Publishing to YouTube: post {}, videoUrl={}", scheduledPost.getId(), videoUrl);

        try {
            String title = caption.length() > 100 ? caption.substring(0, 100) : caption;

            String metadataJson = objectMapper.writeValueAsString(java.util.Map.of(
                "snippet", java.util.Map.of(
                    "title", title.isBlank() ? "New Video" : title,
                    "description", caption,
                    "categoryId", "22"
                ),
                "status", java.util.Map.of(
                    "privacyStatus", "public"
                )
            ));

            okhttp3.OkHttpClient okHttp = new okhttp3.OkHttpClient.Builder()
                .connectTimeout(60, java.util.concurrent.TimeUnit.SECONDS)
                .writeTimeout(300, java.util.concurrent.TimeUnit.SECONDS)
                .readTimeout(300, java.util.concurrent.TimeUnit.SECONDS)
                .build();

            // Download video bytes from CDN
            okhttp3.Request downloadReq = new okhttp3.Request.Builder()
                .url(videoUrl)
                .build();
            byte[] videoBytes;
            try (okhttp3.Response downloadResp = okHttp.newCall(downloadReq).execute()) {
                if (!downloadResp.isSuccessful() || downloadResp.body() == null) {
                    throw new CustomExceptions.ExternalApiException(
                        "Failed to download video from: " + videoUrl);
                }
                videoBytes = downloadResp.body().bytes();
            }

            String videoMime = videoAsset.getContentType() != null ? videoAsset.getContentType() : "video/mp4";

            // Upload to YouTube via multipart (metadata + video bytes)
            okhttp3.RequestBody multipartBody = new okhttp3.MultipartBody.Builder()
                .setType(okhttp3.MultipartBody.MIXED)
                .addPart(
                    okhttp3.Headers.of("Content-Type", "application/json; charset=UTF-8"),
                    okhttp3.RequestBody.create(metadataJson, okhttp3.MediaType.parse("application/json"))
                )
                .addPart(
                    okhttp3.Headers.of("Content-Type", videoMime),
                    okhttp3.RequestBody.create(videoBytes, okhttp3.MediaType.parse(videoMime))
                )
                .build();

            okhttp3.Request uploadReq = new okhttp3.Request.Builder()
                .url("https://www.googleapis.com/upload/youtube/v3/videos?uploadType=multipart&part=snippet,status")
                .header("Authorization", "Bearer " + accessToken)
                .post(multipartBody)
                .build();

            String responseJson;
            try (okhttp3.Response uploadResp = okHttp.newCall(uploadReq).execute()) {
                responseJson = uploadResp.body() != null ? uploadResp.body().string() : "";
            }

            JsonNode responseNode = objectMapper.readTree(responseJson);
            if (responseNode.has("error")) {
                throw new CustomExceptions.ExternalApiException(
                    "YouTube upload failed: " + responseNode.path("error").path("message").asText("unknown error"));
            }

            String videoId = responseNode.path("id").asText();
            if (videoId.isBlank()) {
                throw new CustomExceptions.ExternalApiException(
                    "YouTube returned empty video id. Response: " + responseJson);
            }

            log.info("Published to YouTube — video id {}", videoId);
            return videoId;

        } catch (CustomExceptions.ExternalApiException e) {
            throw e;
        } catch (Exception e) {
            throw new CustomExceptions.ExternalApiException("YouTube publish failed: " + e.getMessage());
        }
    }

    @Override
    public String getOAuthUrl(Long workspaceId, String state) {
        return getOAuthUrl(workspaceId, state, false);
    }

    @Override
    public String getOAuthUrl(Long workspaceId, String state, boolean forceReauth) {
        // Google accepts space-separated values for prompt. select_account makes
        // the account chooser appear even when the user is already signed in to
        // a Google account in this browser — required for connecting a second
        // YouTube/Google identity. We keep "consent" to ensure refresh_token is
        // re-issued when needed.
        String prompt = forceReauth ? "select_account+consent" : "consent";
        return "https://accounts.google.com/o/oauth2/v2/auth"
            + "?client_id=" + clientId
            + "&redirect_uri=" + redirectUri
            + "&scope=https://www.googleapis.com/auth/youtube.upload"
            + "+https://www.googleapis.com/auth/userinfo.profile"
            + "+https://www.googleapis.com/auth/userinfo.email"
            + "&response_type=code"
            + "&access_type=offline"
            + "&prompt=" + prompt
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
    public void refreshTokenIfNeeded(Long socialAccountId) {
        socialAccountRepository.findById(socialAccountId).ifPresent(account -> {
            if (account.getRefreshToken() == null) return;
            if (account.getTokenExpiresAt() != null &&
                account.getTokenExpiresAt().isAfter(OffsetDateTime.now().plusMinutes(5))) return;

            try (CloseableHttpClient http = HttpClients.createDefault()) {
                HttpPost tokenRequest = new HttpPost("https://oauth2.googleapis.com/token");
                List<NameValuePair> params = List.of(
                    new BasicNameValuePair("client_id", clientId),
                    new BasicNameValuePair("client_secret", clientSecret),
                    new BasicNameValuePair("refresh_token", account.getRefreshToken()),
                    new BasicNameValuePair("grant_type", "refresh_token")
                );
                tokenRequest.setEntity(new UrlEncodedFormEntity(params));
                String json = http.execute(tokenRequest, r -> EntityUtils.toString(r.getEntity()));
                JsonNode node = objectMapper.readTree(json);
                String newToken = node.path("access_token").asText();
                if (!newToken.isBlank()) {
                    account.setAccessToken(newToken);
                    account.setTokenExpiresAt(OffsetDateTime.now().plusSeconds(
                        node.path("expires_in").asLong(3600)));
                    socialAccountRepository.save(account);
                    log.info("Refreshed YouTube token for account {}", socialAccountId);
                }
            } catch (Exception e) {
                log.warn("Failed to refresh YouTube token for account {}: {}", socialAccountId, e.getMessage());
            }
        });
    }
}
