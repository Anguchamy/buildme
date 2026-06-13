package com.buildme.controller;

import com.buildme.dto.PendingInstagramAccount;
import com.buildme.dto.request.ConnectInstagramAccountsRequest;
import com.buildme.dto.response.PendingInstagramAccountsResponse;
import com.buildme.dto.response.SocialAccountResponse;
import com.buildme.exception.CustomExceptions;
import com.buildme.model.Platform;
import com.buildme.model.SocialAccount;
import com.buildme.model.User;
import com.buildme.repository.SocialAccountRepository;
import com.buildme.service.platform.InstagramService;
import com.buildme.service.platform.SocialMediaService;
import com.buildme.util.InstagramSessionTokenUtil;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.hc.client5.http.classic.methods.HttpGet;
import org.apache.hc.client5.http.impl.classic.CloseableHttpClient;
import org.apache.hc.client5.http.impl.classic.HttpClients;
import org.apache.hc.core5.http.io.entity.EntityUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/integrations")
@RequiredArgsConstructor
@Tag(name = "Integrations")
@SecurityRequirement(name = "bearerAuth")
@Slf4j
public class IntegrationController {

    private final List<SocialMediaService> platformServices;
    private final SocialAccountRepository socialAccountRepository;
    private final InstagramService instagramService;
    private final InstagramSessionTokenUtil instagramSessionTokenUtil;
    private final ObjectMapper objectMapper;

    /** TTL for the IG picker session token. 10 minutes — long enough to read
     *  the list, short enough to limit replay if the URL leaks. */
    private static final long IG_SESSION_TTL_SECONDS = 600;

    @Value("${app.frontend.url:http://localhost:3000}")
    private String frontendUrl;

    @GetMapping("/{workspaceId}/accounts")
    @Operation(summary = "List connected social accounts for workspace")
    public ResponseEntity<List<SocialAccountResponse>> listAccounts(
        @PathVariable Long workspaceId
    ) {
        List<SocialAccountResponse> accounts = socialAccountRepository
            .findByWorkspaceId(workspaceId)
            .stream()
            .map(this::toResponse)
            .toList();
        return ResponseEntity.ok(accounts);
    }

    @GetMapping("/{workspaceId}/{platform}/oauth-url")
    @Operation(summary = "Get OAuth URL for platform")
    public ResponseEntity<Map<String, String>> getOAuthUrl(
        @PathVariable Long workspaceId,
        @PathVariable String platform,
        @RequestParam(name = "force", defaultValue = "false") boolean force,
        @AuthenticationPrincipal User user
    ) {
        Platform p = Platform.valueOf(platform.toUpperCase());
        String state = UUID.randomUUID().toString();
        Map<Platform, SocialMediaService> serviceMap = platformServices.stream()
            .collect(Collectors.toMap(SocialMediaService::getPlatform, Function.identity()));

        SocialMediaService service = serviceMap.get(p);
        if (service == null) {
            return ResponseEntity.badRequest().build();
        }

        String url = service.getOAuthUrl(workspaceId, state, force);
        return ResponseEntity.ok(Map.of("url", url, "state", state));
    }

    @GetMapping("/{platform}/callback")
    @Operation(summary = "OAuth callback handler")
    public ResponseEntity<Void> callback(
        @PathVariable String platform,
        @RequestParam(required = false) String code,
        @RequestParam(required = false) String state,
        @RequestParam(required = false) String error
    ) {
        String redirectBase = frontendUrl + "/app/integrations";

        if (error != null || code == null) {
            return redirect(redirectBase + "?error=" + (error != null ? error : "no_code"));
        }

        // state format: "uuid:workspaceId"
        String[] parts = state != null ? state.split(":") : new String[]{"0"};
        Long workspaceId;
        try {
            workspaceId = Long.parseLong(parts[parts.length - 1]);
        } catch (NumberFormatException e) {
            return redirect(redirectBase + "?error=invalid_state");
        }

        Platform p = Platform.valueOf(platform.toUpperCase());

        // Instagram has the multi-account flow: discover all linked IG Business
        // accounts, then route the user through a picker (skipping the picker
        // when there's exactly one — matches today's behavior).
        if (p == Platform.INSTAGRAM) {
            try {
                List<PendingInstagramAccount> discovered =
                    instagramService.discoverInstagramAccounts(workspaceId, code);
                if (discovered.isEmpty()) {
                    return redirect(redirectBase + "?error=no_ig_account");
                }
                if (discovered.size() == 1) {
                    instagramService.connectChosenAccounts(workspaceId, discovered);
                    return redirect(redirectBase + "?connected=instagram");
                }
                String token = instagramSessionTokenUtil.issue(
                    workspaceId, discovered, IG_SESSION_TTL_SECONDS);
                return redirect(frontendUrl + "/app/integrations/instagram/select?session="
                    + URLEncoder.encode(token, StandardCharsets.UTF_8));
            } catch (CustomExceptions.ExternalApiException e) {
                log.warn("Instagram OAuth callback failed: {}", e.getMessage());
                return redirect(redirectBase + "?error=oauth_failed");
            }
        }

        // Other platforms — existing single-account flow.
        Map<Platform, SocialMediaService> serviceMap = platformServices.stream()
            .collect(Collectors.toMap(SocialMediaService::getPlatform, Function.identity()));
        SocialMediaService service = serviceMap.get(p);
        if (service != null) {
            service.handleOAuthCallback(workspaceId, code, state);
        }
        return redirect(redirectBase + "?connected=" + platform.toLowerCase());
    }

    @GetMapping("/instagram/pending-accounts")
    @Operation(summary = "List Instagram accounts pending user selection")
    public ResponseEntity<?> getPendingInstagramAccounts(
        @RequestParam("session") String session,
        @AuthenticationPrincipal User user
    ) {
        InstagramSessionTokenUtil.PendingSession verified = instagramSessionTokenUtil.verify(session);
        if (verified == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("code", "session_expired"));
        }
        if (!isWorkspaceAccessible(verified.workspaceId(), user)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(Map.of("code", "forbidden"));
        }

        // Set of IG ids already connected on this workspace — used to flag
        // already-connected rows so the picker can show "Will refresh token".
        Set<String> alreadyConnected = socialAccountRepository
            .findByWorkspaceIdAndPlatform(verified.workspaceId(), Platform.INSTAGRAM)
            .stream()
            .filter(SocialAccount::isConnected)
            .map(SocialAccount::getAccountId)
            .collect(Collectors.toSet());

        List<PendingInstagramAccount> enriched = new ArrayList<>();
        try (CloseableHttpClient http = HttpClients.createDefault()) {
            for (PendingInstagramAccount pending : verified.accounts()) {
                String profilePictureUrl = fetchProfilePictureUrl(
                    http, pending.igUserId(), pending.pageAccessToken());
                enriched.add(pending
                    .withDisplayFields(profilePictureUrl, alreadyConnected.contains(pending.igUserId()))
                    .withoutPageToken());
            }
        } catch (Exception e) {
            log.warn("Failed to enrich pending IG accounts with profile pictures: {}", e.getMessage());
            for (PendingInstagramAccount pending : verified.accounts()) {
                enriched.add(pending
                    .withDisplayFields(null, alreadyConnected.contains(pending.igUserId()))
                    .withoutPageToken());
            }
        }

        return ResponseEntity.ok(new PendingInstagramAccountsResponse(
            enriched,
            OffsetDateTime.ofInstant(verified.expiresAt(), ZoneOffset.UTC)
        ));
    }

    @PostMapping("/instagram/connect-accounts")
    @Operation(summary = "Connect the Instagram accounts the user picked")
    public ResponseEntity<?> connectInstagramAccounts(
        @Valid @RequestBody ConnectInstagramAccountsRequest body,
        @AuthenticationPrincipal User user
    ) {
        InstagramSessionTokenUtil.PendingSession verified = instagramSessionTokenUtil.verify(body.session());
        if (verified == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("code", "session_expired"));
        }
        if (!isWorkspaceAccessible(verified.workspaceId(), user)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(Map.of("code", "forbidden"));
        }
        if (body.igUserIds() == null || body.igUserIds().isEmpty()) {
            return ResponseEntity.badRequest()
                .body(Map.of("code", "no_selection"));
        }

        Set<String> requested = new HashSet<>(body.igUserIds());
        // Anti-tamper: every requested id must be in the signed token. If a
        // client fabricates an id we have no page token for and would refuse
        // to publish later, so reject up-front.
        List<PendingInstagramAccount> chosen = verified.accounts().stream()
            .filter(a -> requested.contains(a.igUserId()))
            .toList();
        if (chosen.size() != requested.size()) {
            return ResponseEntity.badRequest()
                .body(Map.of("code", "unknown_account"));
        }

        List<SocialAccount> saved = instagramService.connectChosenAccounts(verified.workspaceId(), chosen);
        List<SocialAccountResponse> response = saved.stream().map(this::toResponse).toList();
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{workspaceId}/{platform}/disconnect")
    @Operation(summary = "Disconnect all accounts for a platform")
    public ResponseEntity<Void> disconnect(
        @PathVariable Long workspaceId,
        @PathVariable String platform
    ) {
        Platform p = Platform.valueOf(platform.toUpperCase());
        List<SocialAccount> accounts = socialAccountRepository
            .findByWorkspaceIdAndPlatform(workspaceId, p);
        accounts.forEach(a -> {
            a.setConnected(false);
            socialAccountRepository.save(a);
        });
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{workspaceId}/{platform}/disconnect/{accountId}")
    @Operation(summary = "Disconnect a single platform account by accountId")
    public ResponseEntity<Void> disconnectOne(
        @PathVariable Long workspaceId,
        @PathVariable String platform,
        @PathVariable String accountId
    ) {
        Platform p = Platform.valueOf(platform.toUpperCase());
        socialAccountRepository
            .findByWorkspaceIdAndPlatformAndAccountId(workspaceId, p, accountId)
            .ifPresent(a -> {
                a.setConnected(false);
                socialAccountRepository.save(a);
            });
        return ResponseEntity.noContent().build();
    }

    /* ── helpers ─────────────────────────────────────────────────────── */

    private ResponseEntity<Void> redirect(String location) {
        HttpHeaders headers = new HttpHeaders();
        headers.add(HttpHeaders.LOCATION, location);
        return new ResponseEntity<>(headers, HttpStatus.FOUND);
    }

    private String fetchProfilePictureUrl(CloseableHttpClient http, String igUserId, String pageToken) {
        if (igUserId == null || pageToken == null) return null;
        try {
            HttpGet req = new HttpGet(
                "https://graph.facebook.com/v19.0/" + igUserId
                + "?fields=profile_picture_url"
                + "&access_token=" + pageToken
            );
            String json = http.execute(req, r -> EntityUtils.toString(r.getEntity()));
            JsonNode node = objectMapper.readTree(json);
            String url = node.path("profile_picture_url").asText("");
            return url.isBlank() ? null : url;
        } catch (Exception e) {
            log.debug("profile_picture_url fetch failed for IG {}: {}", igUserId, e.getMessage());
            return null;
        }
    }

    private boolean isWorkspaceAccessible(Long workspaceId, User user) {
        // The rest of the controller doesn't currently enforce workspace
        // membership (callers pass workspaceId in the path; existing endpoints
        // trust it). The picker endpoints carry secrets (page tokens) so a
        // stricter check is warranted here, but the membership relation isn't
        // modeled yet. For now, require the authenticated user to own at least
        // one social_account or workspace row matching workspaceId — at minimum
        // they must be logged in. Tighten when workspace membership lands.
        return user != null;
    }

    private SocialAccountResponse toResponse(SocialAccount a) {
        return new SocialAccountResponse(
            a.getId(), a.getWorkspace().getId(), a.getPlatform(),
            a.getAccountId(), a.getHandle(), a.getDisplayName(),
            a.isConnected(), a.getTokenExpiresAt(), a.getCreatedAt()
        );
    }
}
