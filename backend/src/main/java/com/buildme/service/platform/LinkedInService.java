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
public class LinkedInService implements SocialMediaService {

    private final SocialAccountRepository socialAccountRepository;
    private final WorkspaceRepository workspaceRepository;
    private final ObjectMapper objectMapper;

    @Value("${app.oauth.linkedin.client-id:}")
    private String clientId;

    @Value("${app.oauth.linkedin.client-secret:}")
    private String clientSecret;

    @Value("${app.oauth.linkedin.redirect-uri:}")
    private String redirectUri;

    @Override
    public Platform getPlatform() { return Platform.LINKEDIN; }

    @Override
    public String publish(ScheduledPost scheduledPost) throws Exception {
        if (scheduledPost.getSocialAccount() == null) {
            throw new CustomExceptions.ExternalApiException("LinkedIn account not connected");
        }

        String accessToken = scheduledPost.getSocialAccount().getAccessToken();
        String authorId    = scheduledPost.getSocialAccount().getAccountId();
        String caption     = scheduledPost.getPost() != null ? scheduledPost.getPost().getCaption() : "";

        log.info("Publishing to LinkedIn: post {}", scheduledPost.getId());

        // LinkedIn UGC Post API
        String body = """
            {
              "author": "urn:li:person:%s",
              "lifecycleState": "PUBLISHED",
              "specificContent": {
                "com.linkedin.ugc.ShareContent": {
                  "shareCommentary": { "text": %s },
                  "shareMediaCategory": "NONE"
                }
              },
              "visibility": {
                "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
              }
            }
            """.formatted(authorId, objectMapper.writeValueAsString(caption));

        try (CloseableHttpClient http = HttpClients.createDefault()) {
            org.apache.hc.client5.http.classic.methods.HttpPost req =
                new org.apache.hc.client5.http.classic.methods.HttpPost("https://api.linkedin.com/v2/ugcPosts");
            req.setHeader("Authorization", "Bearer " + accessToken);
            req.setHeader("Content-Type", "application/json");
            req.setHeader("X-Restli-Protocol-Version", "2.0.0");
            req.setEntity(new org.apache.hc.core5.http.io.entity.StringEntity(body,
                org.apache.hc.core5.http.ContentType.APPLICATION_JSON));

            String response = http.execute(req, r -> EntityUtils.toString(r.getEntity()));
            JsonNode node = objectMapper.readTree(response);

            if (node.has("status") && node.path("status").asInt() >= 400) {
                throw new CustomExceptions.ExternalApiException(
                    "LinkedIn publish failed: " + node.path("message").asText(response));
            }

            String postId = node.path("id").asText();
            log.info("Published to LinkedIn — post id {}", postId);
            return postId.isBlank() ? "li_" + System.currentTimeMillis() : postId;
        } catch (CustomExceptions.ExternalApiException e) {
            throw e;
        } catch (Exception e) {
            throw new CustomExceptions.ExternalApiException("LinkedIn publish failed: " + e.getMessage());
        }
    }

    @Override
    public String getOAuthUrl(Long workspaceId, String state) {
        return "https://www.linkedin.com/oauth/v2/authorization"
            + "?response_type=code"
            + "&client_id=" + clientId
            + "&redirect_uri=" + redirectUri
            + "&scope=openid+profile+email+w_member_social"
            + "&state=" + state + ":" + workspaceId;
    }

    @Override
    public void handleOAuthCallback(Long workspaceId, String code, String state) {
        log.info("Handling LinkedIn OAuth callback for workspace {}", workspaceId);

        if (clientId.isBlank() || clientSecret.isBlank()) {
            throw new CustomExceptions.ExternalApiException("LinkedIn OAuth credentials not configured");
        }

        try (CloseableHttpClient http = HttpClients.createDefault()) {
            // 1. Exchange code for access token
            HttpPost tokenRequest = new HttpPost("https://www.linkedin.com/oauth/v2/accessToken");
            List<NameValuePair> params = List.of(
                new BasicNameValuePair("grant_type", "authorization_code"),
                new BasicNameValuePair("code", code),
                new BasicNameValuePair("redirect_uri", redirectUri),
                new BasicNameValuePair("client_id", clientId),
                new BasicNameValuePair("client_secret", clientSecret)
            );
            tokenRequest.setEntity(new UrlEncodedFormEntity(params));
            String tokenJson = http.execute(tokenRequest, r -> EntityUtils.toString(r.getEntity()));
            JsonNode tokenNode = objectMapper.readTree(tokenJson);

            if (tokenNode.has("error")) {
                throw new CustomExceptions.ExternalApiException(
                    "LinkedIn token exchange failed: " + tokenNode.path("error_description").asText());
            }

            String accessToken = tokenNode.path("access_token").asText();
            long expiresIn = tokenNode.path("expires_in").asLong(5184000);

            // 2. Fetch profile via OpenID userinfo endpoint
            HttpGet profileRequest = new HttpGet("https://api.linkedin.com/v2/userinfo");
            profileRequest.setHeader("Authorization", "Bearer " + accessToken);
            String profileJson = http.execute(profileRequest, r -> EntityUtils.toString(r.getEntity()));
            JsonNode profileNode = objectMapper.readTree(profileJson);

            String linkedInId = profileNode.path("sub").asText();
            String name = profileNode.path("name").asText(
                profileNode.path("given_name").asText("") + " " + profileNode.path("family_name").asText("")).trim();

            // 3. Upsert social account
            Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new CustomExceptions.ResourceNotFoundException("Workspace not found: " + workspaceId));

            Optional<SocialAccount> existing = socialAccountRepository
                .findByWorkspaceIdAndPlatformAndAccountId(workspaceId, Platform.LINKEDIN, linkedInId);

            SocialAccount account = existing.orElseGet(() -> SocialAccount.builder()
                .workspace(workspace)
                .platform(Platform.LINKEDIN)
                .accountId(linkedInId)
                .build());

            account.setDisplayName(name);
            account.setHandle(profileNode.path("email").asText(null));
            account.setAccessToken(accessToken);
            account.setTokenExpiresAt(OffsetDateTime.now().plusSeconds(expiresIn));
            account.setScopes("openid profile email w_member_social");
            account.setConnected(true);

            socialAccountRepository.save(account);
            log.info("LinkedIn account connected: {} for workspace {}", linkedInId, workspaceId);

        } catch (CustomExceptions.ExternalApiException e) {
            throw e;
        } catch (Exception e) {
            log.error("LinkedIn OAuth callback failed for workspace {}: {}", workspaceId, e.getMessage(), e);
            throw new CustomExceptions.ExternalApiException("LinkedIn connection failed: " + e.getMessage());
        }
    }

    @Override
    public void refreshTokenIfNeeded(Long socialAccountId) {}
}
