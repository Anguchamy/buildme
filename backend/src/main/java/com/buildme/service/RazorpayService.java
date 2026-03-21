package com.buildme.service;

import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import com.razorpay.Subscription;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;

@Service
@Slf4j
public class RazorpayService {

    @Value("${app.razorpay.key-id}")
    private String keyId;

    @Value("${app.razorpay.key-secret}")
    private String keySecret;

    @Value("${app.razorpay.webhook-secret}")
    private String webhookSecret;

    @Value("${app.razorpay.plan-id-pro}")
    private String planIdPro;

    @Value("${app.razorpay.plan-id-agency}")
    private String planIdAgency;

    private RazorpayClient client;
    private boolean enabled;

    @PostConstruct
    public void init() {
        enabled = !keyId.startsWith("rzp_test_placeholder") && !keySecret.startsWith("placeholder");
        if (enabled) {
            try {
                client = new RazorpayClient(keyId, keySecret);
                log.info("Razorpay client initialized");
            } catch (RazorpayException e) {
                log.error("Failed to initialize Razorpay client: {}", e.getMessage());
                enabled = false;
            }
        } else {
            log.info("Razorpay not configured — using placeholder keys");
        }
    }

    public boolean isEnabled() {
        return enabled;
    }

    public String getKeyId() {
        return keyId;
    }

    /**
     * Creates a Razorpay subscription for the given plan and returns the subscription ID.
     */
    public String createSubscription(String planType) {
        if (!enabled) {
            return "sub_placeholder_" + planType.toLowerCase();
        }
        try {
            String planId = "PRO".equalsIgnoreCase(planType) ? planIdPro : planIdAgency;
            JSONObject params = new JSONObject();
            params.put("plan_id", planId);
            params.put("total_count", 12); // 12 billing cycles (1 year)
            params.put("quantity", 1);

            Subscription sub = client.subscriptions.create(params);
            String subId = sub.get("id");
            log.info("Created Razorpay subscription: {} for plan: {}", subId, planType);
            return subId;
        } catch (RazorpayException e) {
            throw new RuntimeException("Failed to create Razorpay subscription: " + e.getMessage(), e);
        }
    }

    /**
     * Verifies the Razorpay payment signature after checkout success.
     * Signature = HMAC-SHA256(razorpay_payment_id + "|" + razorpay_subscription_id, key_secret)
     */
    public boolean verifyPaymentSignature(String paymentId, String subscriptionId, String signature) {
        try {
            String data = paymentId + "|" + subscriptionId;
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(keySecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] hash = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            String computed = bytesToHex(hash);
            return computed.equals(signature);
        } catch (Exception e) {
            log.error("Signature verification error: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Verifies a Razorpay webhook signature.
     * Signature = HMAC-SHA256(raw_body, webhook_secret)
     */
    public boolean verifyWebhookSignature(String rawBody, String signature) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(webhookSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] hash = mac.doFinal(rawBody.getBytes(StandardCharsets.UTF_8));
            return bytesToHex(hash).equals(signature);
        } catch (Exception e) {
            log.error("Webhook signature verification error: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Cancels a Razorpay subscription at period end.
     */
    public void cancelSubscription(String razorpaySubId) {
        if (!enabled || razorpaySubId == null || razorpaySubId.startsWith("sub_placeholder")) return;
        try {
            JSONObject cancelParams = new JSONObject();
            cancelParams.put("cancel_at_cycle_end", 1);
            client.subscriptions.cancel(razorpaySubId, cancelParams);
            log.info("Cancelled Razorpay subscription: {}", razorpaySubId);
        } catch (RazorpayException e) {
            log.warn("Failed to cancel Razorpay subscription {}: {}", razorpaySubId, e.getMessage());
        }
    }

    private static String bytesToHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder(bytes.length * 2);
        for (byte b : bytes) sb.append(String.format("%02x", b));
        return sb.toString();
    }
}
