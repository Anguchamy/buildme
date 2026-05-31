package com.buildme.util;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

/**
 * Issues and verifies short-lived signed tokens for the public media endpoint.
 *
 * Used so we can hand Instagram (and other external ingestion services) a
 * stable, JWT-authless URL on our own backend that streams the bytes from
 * R2 with the correct Content-Type. Presigned R2 URLs were unreliable for IG
 * — either CORS/Content-Type quirks or response-content-type override not
 * being honored. Routing through our own backend gives us full control.
 *
 * Token format: base64url(assetId|expiresAtEpochSeconds|hmacSha256_first16bytes)
 * Compact, single query parameter, no JWT library overhead.
 */
@Component
@Slf4j
public class MediaTokenUtil {

    @Value("${app.jwt.secret}")
    private String secret;

    private byte[] keyBytes;

    @PostConstruct
    public void init() {
        this.keyBytes = secret.getBytes(StandardCharsets.UTF_8);
    }

    public String issue(long assetId, long ttlSeconds) {
        long exp = System.currentTimeMillis() / 1000 + ttlSeconds;
        String payload = assetId + "|" + exp;
        String sig = sign(payload);
        String raw = payload + "|" + sig;
        return Base64.getUrlEncoder().withoutPadding()
            .encodeToString(raw.getBytes(StandardCharsets.UTF_8));
    }

    public Long verify(String token) {
        try {
            String raw = new String(
                Base64.getUrlDecoder().decode(token), StandardCharsets.UTF_8);
            String[] parts = raw.split("\\|");
            if (parts.length != 3) return null;
            long assetId = Long.parseLong(parts[0]);
            long exp = Long.parseLong(parts[1]);
            String sig = parts[2];

            if (exp < System.currentTimeMillis() / 1000) return null;
            String expected = sign(assetId + "|" + exp);
            // Constant-time compare to avoid timing leaks
            if (!constantTimeEquals(sig, expected)) return null;
            return assetId;
        } catch (Exception e) {
            return null;
        }
    }

    private String sign(String payload) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(keyBytes, "HmacSHA256"));
            byte[] full = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
            // Truncate to 16 bytes — still 128 bits, plenty for a 24h URL.
            byte[] truncated = new byte[16];
            System.arraycopy(full, 0, truncated, 0, 16);
            return Base64.getUrlEncoder().withoutPadding().encodeToString(truncated);
        } catch (Exception e) {
            throw new RuntimeException("HMAC error", e);
        }
    }

    private static boolean constantTimeEquals(String a, String b) {
        if (a == null || b == null || a.length() != b.length()) return false;
        int diff = 0;
        for (int i = 0; i < a.length(); i++) diff |= a.charAt(i) ^ b.charAt(i);
        return diff == 0;
    }
}
