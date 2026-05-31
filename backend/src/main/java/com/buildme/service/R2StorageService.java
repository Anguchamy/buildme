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
            applyBucketCors();
        } else {
            log.info("R2 not configured — using local storage");
        }
    }

    /**
     * Sets a permissive CORS policy on the R2 bucket so browsers can PUT directly
     * via presigned URLs.  Safe to call on every startup — it is idempotent.
     */
    private void applyBucketCors() {
        try {
            String corsXml =
                "<?xml version=\"1.0\" encoding=\"UTF-8\"?>" +
                "<CORSConfiguration>" +
                  "<CORSRule>" +
                    "<AllowedOrigin>*</AllowedOrigin>" +
                    "<AllowedMethod>GET</AllowedMethod>" +
                    "<AllowedMethod>PUT</AllowedMethod>" +
                    "<AllowedMethod>POST</AllowedMethod>" +
                    "<AllowedMethod>DELETE</AllowedMethod>" +
                    "<AllowedMethod>HEAD</AllowedMethod>" +
                    "<AllowedHeader>*</AllowedHeader>" +
                    "<MaxAgeSeconds>3600</MaxAgeSeconds>" +
                  "</CORSRule>" +
                "</CORSConfiguration>";

            byte[] body = corsXml.getBytes(StandardCharsets.UTF_8);

            ZonedDateTime now = ZonedDateTime.now(ZoneOffset.UTC);
            String datetime = now.format(DT_FMT);
            String date     = now.format(D_FMT);
            String host     = accountId + ".r2.cloudflarestorage.com";
            String uri      = "/" + bucket;
            String query    = "cors=";
            String payloadHash = sha256hex(body);

            String canonicalHeaders =
                "content-type:application/xml\n" +
                "host:" + host + "\n" +
                "x-amz-content-sha256:" + payloadHash + "\n" +
                "x-amz-date:" + datetime + "\n";
            String signedHeaders = "content-type;host;x-amz-content-sha256;x-amz-date";

            String canonicalRequest = "PUT\n" + uri + "\n" + query + "\n" +
                canonicalHeaders + "\n" + signedHeaders + "\n" + payloadHash;

            String scope  = date + "/auto/s3/aws4_request";
            String toSign = "AWS4-HMAC-SHA256\n" + datetime + "\n" + scope + "\n"
                + sha256hex(canonicalRequest.getBytes(StandardCharsets.UTF_8));

            String sig  = hmacHex(signingKey(secretKey, date), toSign);
            String auth = "AWS4-HMAC-SHA256 Credential=" + accessKey + "/" + scope
                + ", SignedHeaders=" + signedHeaders + ", Signature=" + sig;

            Request request = new Request.Builder()
                .url("https://" + host + uri + "?" + query)
                .put(RequestBody.create(body, MediaType.parse("application/xml")))
                .header("content-type", "application/xml")
                .header("x-amz-content-sha256", payloadHash)
                .header("x-amz-date", datetime)
                .header("Authorization", auth)
                .build();

            try (Response response = httpClient.newCall(request).execute()) {
                if (response.isSuccessful()) {
                    log.info("R2 CORS policy applied to bucket '{}'", bucket);
                } else {
                    String respBody = response.body() != null ? response.body().string() : "";
                    log.warn("R2 CORS PUT returned HTTP {}: {}", response.code(), respBody);
                }
            }
        } catch (Exception e) {
            log.warn("Could not apply R2 CORS policy: {}", e.getMessage());
        }
    }

    public boolean isEnabled() { return enabled; }

    /**
     * True if a *real* public base URL is configured — i.e. one that serves
     * objects without AWS4 signing. We explicitly reject the private R2 host
     * (*.r2.cloudflarestorage.com) here because users sometimes misconfigure
     * R2_PUBLIC_URL by pointing it at the private host; that returns 400
     * "InvalidArgument: Authorization" because no signature is attached, and
     * downstream consumers (notably Instagram's server-side fetcher) reject
     * the object even though the bytes would be fine over a signed URL.
     */
    public boolean hasPublicUrl() {
        if (publicUrl.isBlank()) return false;
        String lower = publicUrl.toLowerCase();
        if (lower.contains(".r2.cloudflarestorage.com")) return false;
        return true;
    }

    /**
     * Generate a presigned GET URL so browsers can fetch private R2 objects.
     * Valid for the given number of seconds.
     */
    public String generatePresignedGetUrl(String key, int expiresSeconds) {
        return generatePresignedGetUrl(key, expiresSeconds, null);
    }

    /**
     * Same as {@link #generatePresignedGetUrl(String, int)} but lets callers
     * pin the response Content-Type via the S3 `response-content-type` query
     * parameter. Important for Instagram ingestion — IG's server-side fetch
     * rejects with "Only photo or video can be accepted as media type" when
     * the response Content-Type is application/octet-stream or anything
     * other than a recognised image/video MIME. R2 stores whatever
     * Content-Type was sent on upload; this override forces the right one
     * even if the upload stored it wrong.
     */
    public String generatePresignedGetUrl(String key, int expiresSeconds, String responseContentType) {
        try {
            ZonedDateTime now = ZonedDateTime.now(ZoneOffset.UTC);
            String datetime = now.format(DT_FMT);
            String date     = now.format(D_FMT);
            String host     = accountId + ".r2.cloudflarestorage.com";
            String uri      = "/" + bucket + "/" + key;

            String scope      = date + "/auto/s3/aws4_request";
            String credential = accessKey + "/" + scope;

            // Build canonical query string with params in alphabetical order.
            // response-content-type comes before the X-Amz-* group.
            StringBuilder qs = new StringBuilder();
            if (responseContentType != null && !responseContentType.isBlank()) {
                qs.append("response-content-type=").append(urlEncode(responseContentType)).append('&');
            }
            qs.append("X-Amz-Algorithm=AWS4-HMAC-SHA256")
              .append("&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD")
              .append("&X-Amz-Credential=").append(urlEncode(credential))
              .append("&X-Amz-Date=").append(datetime)
              .append("&X-Amz-Expires=").append(expiresSeconds)
              .append("&X-Amz-SignedHeaders=host");
            String queryString = qs.toString();

            String canonicalHeaders = "host:" + host + "\n";
            String signedHeaders = "host";

            String canonicalRequest =
                "GET\n" + uri + "\n" + queryString + "\n" +
                canonicalHeaders + "\n" + signedHeaders + "\n" +
                "UNSIGNED-PAYLOAD";

            String toSign = "AWS4-HMAC-SHA256\n" + datetime + "\n" + scope + "\n"
                + sha256hex(canonicalRequest.getBytes(StandardCharsets.UTF_8));

            String sig = hmacHex(signingKey(secretKey, date), toSign);

            return "https://" + host + uri + "?" + queryString + "&X-Amz-Signature=" + sig;
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate presigned GET URL: " + e.getMessage(), e);
        }
    }

    /**
     * Generate a presigned PUT URL for direct browser-to-R2 upload.
     * Valid for the given number of seconds (max 604800 = 7 days for AWS4).
     */
    public String generatePresignedPutUrl(String key, String contentType, int expiresSeconds) {
        try {
            ZonedDateTime now = ZonedDateTime.now(ZoneOffset.UTC);
            String datetime = now.format(DT_FMT);
            String date     = now.format(D_FMT);
            String host     = accountId + ".r2.cloudflarestorage.com";
            String uri      = "/" + bucket + "/" + key;

            String scope    = date + "/auto/s3/aws4_request";
            String credential = accessKey + "/" + scope;

            // Query string parameters for presigned URL (must be sorted)
            String queryString =
                "X-Amz-Algorithm=AWS4-HMAC-SHA256" +
                "&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD" +
                "&X-Amz-Credential=" + urlEncode(credential) +
                "&X-Amz-Date=" + datetime +
                "&X-Amz-Expires=" + expiresSeconds +
                "&X-Amz-SignedHeaders=content-type%3Bhost";

            String canonicalHeaders = "content-type:" + contentType + "\nhost:" + host + "\n";
            String signedHeaders = "content-type;host";

            String canonicalRequest =
                "PUT\n" + uri + "\n" + queryString + "\n" +
                canonicalHeaders + "\n" + signedHeaders + "\n" +
                "UNSIGNED-PAYLOAD";

            String toSign = "AWS4-HMAC-SHA256\n" + datetime + "\n" + scope + "\n"
                + sha256hex(canonicalRequest.getBytes(StandardCharsets.UTF_8));

            String sig = hmacHex(signingKey(secretKey, date), toSign);

            return "https://" + host + uri + "?" + queryString + "&X-Amz-Signature=" + sig;
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate presigned URL: " + e.getMessage(), e);
        }
    }

    private static String urlEncode(String s) {
        try {
            return java.net.URLEncoder.encode(s, StandardCharsets.UTF_8).replace("+", "%20");
        } catch (Exception e) {
            return s;
        }
    }

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

    public String resolvePublicUrl(String key) {
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
