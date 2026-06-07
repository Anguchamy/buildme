package com.buildme.util;

import com.buildme.dto.PendingInstagramAccount;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.time.Instant;
import java.util.Date;
import java.util.List;

/**
 * Signs and verifies the short-lived session token that carries the list of
 * discovered Instagram Business accounts (and their per-page access tokens)
 * between the FB OAuth callback and the user's "pick which to connect" step.
 *
 * Why a JWT and not Redis / a DB table: Redis isn't actually wired into this
 * project despite project memory suggesting otherwise. A new DB table would
 * mean a Flyway migration, an entity, a repo, and a TTL job for a single
 * ephemeral lookup. The page tokens never leave the backend in plaintext —
 * the browser only round-trips the opaque signed string.
 *
 * Token payload (custom claim "accounts"): a JSON array of
 * {@link PendingInstagramAccount} including pageAccessToken. Profile pictures
 * and alreadyConnected are omitted to keep the token under ~2KB.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class InstagramSessionTokenUtil {

    /** Signing key reused from the existing JWT secret. */
    @Value("${app.jwt.secret}")
    private String secret;

    private final ObjectMapper objectMapper;

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(secret.getBytes());
    }

    public String issue(Long workspaceId, List<PendingInstagramAccount> accounts, long ttlSeconds) {
        try {
            // Strip the runtime-only fields (profilePictureUrl, alreadyConnected)
            // so the token stays small. pageAccessToken is preserved — that's
            // what we need on the back-side when the user picks.
            List<PendingInstagramAccount> compact = accounts.stream()
                .map(a -> new PendingInstagramAccount(
                    a.igUserId(), a.igUsername(), a.displayName(),
                    a.pageId(), a.pageAccessToken(), a.pageName(),
                    null, null
                ))
                .toList();
            String json = objectMapper.writeValueAsString(compact);
            return Jwts.builder()
                .subject("ig-pending:" + workspaceId)
                .claim("wsid", workspaceId)
                .claim("accounts", json)
                .issuedAt(new Date())
                .expiration(Date.from(Instant.now().plusSeconds(ttlSeconds)))
                .signWith(getSigningKey())
                .compact();
        } catch (Exception e) {
            throw new IllegalStateException("Failed to issue IG session token", e);
        }
    }

    public PendingSession verify(String token) {
        try {
            Claims claims = Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
            Long workspaceId = claims.get("wsid", Long.class);
            String accountsJson = claims.get("accounts", String.class);
            if (workspaceId == null || accountsJson == null) {
                return null;
            }
            List<PendingInstagramAccount> accounts = objectMapper.readValue(
                accountsJson,
                new TypeReference<List<PendingInstagramAccount>>() {}
            );
            return new PendingSession(workspaceId, accounts, claims.getExpiration().toInstant());
        } catch (JwtException | IllegalArgumentException e) {
            log.debug("IG session token invalid: {}", e.getMessage());
            return null;
        } catch (Exception e) {
            log.warn("Unexpected error verifying IG session token", e);
            return null;
        }
    }

    public record PendingSession(
        Long workspaceId,
        List<PendingInstagramAccount> accounts,
        Instant expiresAt
    ) {}
}
