package com.buildme.service;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import okhttp3.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;

@Service
@Slf4j
public class R2StorageService {

    private static final DateTimeFormatter DT_FMT = DateTimeFormatter.ofPattern("yyyyMMdd'T'HHmmss'Z'");
    private static final DateTimeFormatter D_FMT  = DateTimeFormatter.ofPattern("yyyyMMdd");

    @Value("${app.r2.account-id:}")  private String accountId;
    @Value("${app.r2.access-key:}")  private String accessKey;
    @Value("${app.r2.secret-key:}")  private String secretKey;
    @Value("${app.r2.bucket:buildme-media}") private String bucket;
    @Value("${app.r2.public-url:}")  private String publicUrl;

    private boolean enabled;
    private OkHttpClient httpClient;

    @PostConstruct
    public void init() {
        enabled = !accountId.isBlank() && !accessKey.isBlank() && !secretKey.isBlank();
        if (enabled) {
            httpClient = new OkHttpClient();
            log.info("Cloudflare R2 enabled — bucket: {}", bucket);
        } else {
            log.info("R2 not configured — using local storage");
        }
    }

    public boolean isEnabled() { return enabled; }

    public String upload(String key, byte[] bytes, String contentType) {
        try {
            ZonedDateTime now = ZonedDateTime.now(ZoneOffset.UTC);
            String datetime = now.format(DT_FMT);
            String date     = now.format(D_FMT);
            String host     = accountId + ".r2.cloudflarestorage.com";
            String uri      = "/" + bucket + "/" + key;
            String payloadHash = sha256hex(bytes);

            String canonicalHeaders =
                "content-type:" + contentType + "\n" +
                "host:" + host + "\n" +
                "x-amz-content-sha256:" + payloadHash + "\n" +
                "x-amz-date:" + datetime + "\n";
            String signedHeaders = "content-type;host;x-amz-content-sha256;x-amz-date";

            String canonicalRequest = "PUT\n" + uri + "\n\n" +
                canonicalHeaders + "\n" + signedHeaders + "\n" + payloadHash;

            String scope  = date + "/auto/s3/aws4_request";
            String toSign = "AWS4-HMAC-SHA256\n" + datetime + "\n" + scope + "\n"
                + sha256hex(canonicalRequest.getBytes(StandardCharsets.UTF_8));

            String sig  = hmacHex(signingKey(secretKey, date), toSign);
            String auth = "AWS4-HMAC-SHA256 Credential=" + accessKey + "/" + scope
                + ", SignedHeaders=" + signedHeaders + ", Signature=" + sig;

            Request request = new Request.Builder()
                .url("https://" + host + uri)
                .put(RequestBody.create(bytes, MediaType.parse(contentType)))
                .header("x-amz-content-sha256", payloadHash)
                .header("x-amz-date", datetime)
                .header("Authorization", auth)
                .build();

            try (Response response = httpClient.newCall(request).execute()) {
                if (!response.isSuccessful()) {
                    String body = response.body() != null ? response.body().string() : "";
                    throw new RuntimeException("R2 PUT failed HTTP " + response.code() + ": " + body);
                }
            }

            log.info("Uploaded to R2: {} ({} bytes)", key, bytes.length);
            return resolvePublicUrl(key);
        } catch (Exception e) {
            throw new RuntimeException("R2 upload error: " + e.getMessage(), e);
        }
    }

    public byte[] getObject(String key) {
        try {
            ZonedDateTime now = ZonedDateTime.now(ZoneOffset.UTC);
            String datetime = now.format(DT_FMT);
            String date     = now.format(D_FMT);
            String host     = accountId + ".r2.cloudflarestorage.com";
            String uri      = "/" + bucket + "/" + key;
            String payloadHash = sha256hex(new byte[0]);

            String canonicalHeaders =
                "host:" + host + "\n" +
                "x-amz-content-sha256:" + payloadHash + "\n" +
                "x-amz-date:" + datetime + "\n";
            String signedHeaders = "host;x-amz-content-sha256;x-amz-date";

            String canonicalRequest = "GET\n" + uri + "\n\n" +
                canonicalHeaders + "\n" + signedHeaders + "\n" + payloadHash;

            String scope  = date + "/auto/s3/aws4_request";
            String toSign = "AWS4-HMAC-SHA256\n" + datetime + "\n" + scope + "\n"
                + sha256hex(canonicalRequest.getBytes(StandardCharsets.UTF_8));

            String sig  = hmacHex(signingKey(secretKey, date), toSign);
            String auth = "AWS4-HMAC-SHA256 Credential=" + accessKey + "/" + scope
                + ", SignedHeaders=" + signedHeaders + ", Signature=" + sig;

            Request request = new Request.Builder()
                .url("https://" + host + uri)
                .get()
                .header("x-amz-content-sha256", payloadHash)
                .header("x-amz-date", datetime)
                .header("Authorization", auth)
                .build();

            try (Response response = httpClient.newCall(request).execute()) {
                if (!response.isSuccessful()) {
                    throw new RuntimeException("R2 GET failed HTTP " + response.code());
                }
                return response.body().bytes();
            }
        } catch (Exception e) {
            throw new RuntimeException("R2 get error: " + e.getMessage(), e);
        }
    }

    public void delete(String key) {
        try {
            ZonedDateTime now = ZonedDateTime.now(ZoneOffset.UTC);
            String datetime = now.format(DT_FMT);
            String date     = now.format(D_FMT);
            String host     = accountId + ".r2.cloudflarestorage.com";
            String uri      = "/" + bucket + "/" + key;
            String payloadHash = sha256hex(new byte[0]);

            String canonicalHeaders =
                "host:" + host + "\n" +
                "x-amz-content-sha256:" + payloadHash + "\n" +
                "x-amz-date:" + datetime + "\n";
            String signedHeaders = "host;x-amz-content-sha256;x-amz-date";

            String canonicalRequest = "DELETE\n" + uri + "\n\n" +
                canonicalHeaders + "\n" + signedHeaders + "\n" + payloadHash;

            String scope  = date + "/auto/s3/aws4_request";
            String toSign = "AWS4-HMAC-SHA256\n" + datetime + "\n" + scope + "\n"
                + sha256hex(canonicalRequest.getBytes(StandardCharsets.UTF_8));

            String sig  = hmacHex(signingKey(secretKey, date), toSign);
            String auth = "AWS4-HMAC-SHA256 Credential=" + accessKey + "/" + scope
                + ", SignedHeaders=" + signedHeaders + ", Signature=" + sig;

            Request request = new Request.Builder()
                .url("https://" + host + uri)
                .delete()
                .header("x-amz-content-sha256", payloadHash)
                .header("x-amz-date", datetime)
                .header("Authorization", auth)
                .build();

            try (Response response = httpClient.newCall(request).execute()) {
                log.info("Deleted R2 object: {} (HTTP {})", key, response.code());
            }
        } catch (Exception e) {
            log.warn("Failed to delete R2 object {}: {}", key, e.getMessage());
        }
    }

    private String resolvePublicUrl(String key) {
        if (!publicUrl.isBlank())
            return publicUrl.stripTrailing() + "/" + key;
        return "https://" + bucket + "." + accountId + ".r2.cloudflarestorage.com/" + key;
    }

    private static String sha256hex(byte[] data) throws Exception {
        return hex(MessageDigest.getInstance("SHA-256").digest(data));
    }

    private static byte[] hmac(byte[] key, String data) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(key, "HmacSHA256"));
        return mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
    }

    private static String hmacHex(byte[] key, String data) throws Exception {
        return hex(hmac(key, data));
    }

    private static byte[] signingKey(String secret, String date) throws Exception {
        byte[] k = hmac(("AWS4" + secret).getBytes(StandardCharsets.UTF_8), date);
        k = hmac(k, "auto");
        k = hmac(k, "s3");
        return hmac(k, "aws4_request");
    }

    private static String hex(byte[] b) {
        StringBuilder sb = new StringBuilder(b.length * 2);
        for (byte x : b) sb.append(String.format("%02x", x));
        return sb.toString();
    }
}
