package com.buildme.controller;

import com.buildme.dto.response.SocialAccountResponse;
import com.buildme.model.Platform;
import com.buildme.model.SocialAccount;
import com.buildme.model.User;
import com.buildme.repository.SocialAccountRepository;
import com.buildme.service.platform.SocialMediaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/integrations")
@RequiredArgsConstructor
@Tag(name = "Integrations")
@SecurityRequirement(name = "bearerAuth")
public class IntegrationController {

    private final List<SocialMediaService> platformServices;
    private final SocialAccountRepository socialAccountRepository;

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

        String url = service.getOAuthUrl(workspaceId, state);
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
            HttpHeaders headers = new HttpHeaders();
            headers.add(HttpHeaders.LOCATION, redirectBase + "?error=" + (error != null ? error : "no_code"));
            return new ResponseEntity<>(headers, HttpStatus.FOUND);
        }

        // state format: "uuid:workspaceId"
        String[] parts = state != null ? state.split(":") : new String[]{"0"};
        Long workspaceId;
        try {
            workspaceId = Long.parseLong(parts[parts.length - 1]);
        } catch (NumberFormatException e) {
            HttpHeaders headers = new HttpHeaders();
            headers.add(HttpHeaders.LOCATION, redirectBase + "?error=invalid_state");
            return new ResponseEntity<>(headers, HttpStatus.FOUND);
        }

        Platform p = Platform.valueOf(platform.toUpperCase());
        Map<Platform, SocialMediaService> serviceMap = platformServices.stream()
            .collect(Collectors.toMap(SocialMediaService::getPlatform, Function.identity()));

        SocialMediaService service = serviceMap.get(p);
        if (service != null) {
            service.handleOAuthCallback(workspaceId, code, state);
        }

        HttpHeaders headers = new HttpHeaders();
        headers.add(HttpHeaders.LOCATION, redirectBase + "?connected=" + platform.toLowerCase());
        return new ResponseEntity<>(headers, HttpStatus.FOUND);
    }

    @DeleteMapping("/{workspaceId}/{platform}/disconnect")
    @Operation(summary = "Disconnect a platform account")
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

    private SocialAccountResponse toResponse(SocialAccount a) {
        return new SocialAccountResponse(
            a.getId(), a.getWorkspace().getId(), a.getPlatform(),
            a.getAccountId(), a.getHandle(), a.getDisplayName(),
            a.isConnected(), a.getTokenExpiresAt(), a.getCreatedAt()
        );
    }
}
