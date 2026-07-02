package com.buildme.service;

import com.razorpay.Order;
import com.razorpay.Payment;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.HexFormat;
import java.util.Map;

@Service
@Slf4j
public class RazorpayService {

    // Prices in paise (INR × 100)
    private static final long PRICE_PRO_PAISE    = 159900L; // ₹1599/month
    private static final long PRICE_AGENCY_PAISE = 399900L; // ₹3999/month

    @Value("${app.razorpay.key-id:}")
    private String keyId;

    @Value("${app.razorpay.key-secret:}")
    private String keySecret;

    @Value("${app.frontend.url:http://localhost:3000}")
    private String frontendUrl;

    private RazorpayClient client;
    private boolean enabled;

    @PostConstruct
    public void init() {
        enabled = keyId != null && !keyId.isBlank() && keyId.startsWith("rzp_");
        if (enabled) {
            try {
                client = new RazorpayClient(keyId, keySecret);
                log.info("Razorpay SDK initialized (keyId={})", keyId);
            } catch (RazorpayException e) {
                log.error("Failed to initialize Razorpay client: {}", e.getMessage());
                enabled = false;
            }
        } else {
            log.info("Razorpay not configured — payments disabled");
        }
    }

    public boolean isEnabled() { return enabled; }
    public String getKeyId() { return keyId; }

    /**
     * Creates a Razorpay Order for the given plan.
     * Returns: orderId, keyId, amount, currency, planType, workspaceId.
     * Frontend uses this to open Razorpay checkout popup.
     */
    public Map<String, Object> createOrder(String planType, Long workspaceId) {
        long amountPaise = "PRO".equalsIgnoreCase(planType) ? PRICE_PRO_PAISE : PRICE_AGENCY_PAISE;

        if (!enabled) {
            return Map.of(
                "orderId",     "order_placeholder_" + planType.toLowerCase(),
                "keyId",       keyId != null ? keyId : "rzp_test_placeholder",
                "amount",      amountPaise,
                "currency",    "INR",
                "planType",    planType.toUpperCase(),
                "workspaceId", workspaceId
            );
        }

        try {
            JSONObject orderRequest = new JSONObject();
            orderRequest.put("amount", amountPaise);
            orderRequest.put("currency", "INR");
            orderRequest.put("receipt", "buildme_" + workspaceId + "_" + planType.toLowerCase());
            orderRequest.put("notes", new JSONObject()
                .put("workspaceId", workspaceId.toString())
                .put("planType", planType.toUpperCase()));

            Order order = client.orders.create(orderRequest);
            log.info("Created Razorpay order: {} for plan: {} workspace: {}", order.get("id"), planType, workspaceId);

            return Map.of(
                "orderId",     order.get("id").toString(),
                "keyId",       keyId,
                "amount",      amountPaise,
                "currency",    "INR",
                "planType",    planType.toUpperCase(),
                "workspaceId", workspaceId
            );
        } catch (RazorpayException e) {
            throw new RuntimeException("Failed to create Razorpay order: " + e.getMessage(), e);
        }
    }

    /**
     * Verifies Razorpay payment signature.
     * signature = HMAC-SHA256(orderId + "|" + paymentId, keySecret)
     */
    public boolean verifySignature(String orderId, String paymentId, String signature) {
        try {
            String data = orderId + "|" + paymentId;
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(keySecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] hash = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            String expected = HexFormat.of().formatHex(hash);
            return expected.equals(signature);
        } catch (Exception e) {
            log.error("Signature verification failed: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Fetches payment details from Razorpay to get notes (planType, workspaceId).
     */
    public Payment fetchPayment(String paymentId) {
        try {
            return client.payments.fetch(paymentId);
        } catch (RazorpayException e) {
            throw new RuntimeException("Failed to fetch Razorpay payment: " + e.getMessage(), e);
        }
    }

    /**
     * Fetches the Order so verifyAndActivate can cross-check the workspaceId/
     * planType/amount the client sent against what we told Razorpay when we
     * created the order. Without this, a client could pay for one plan and
     * ask us to activate another.
     */
    public Order fetchOrder(String orderId) {
        try {
            return client.orders.fetch(orderId);
        } catch (RazorpayException e) {
            throw new RuntimeException("Failed to fetch Razorpay order: " + e.getMessage(), e);
        }
    }

    /** Server-side price authority. Never trust a client-supplied amount. */
    public long expectedPricePaise(String planType) {
        if ("PRO".equalsIgnoreCase(planType))    return PRICE_PRO_PAISE;
        if ("AGENCY".equalsIgnoreCase(planType)) return PRICE_AGENCY_PAISE;
        throw new IllegalArgumentException("Unknown plan: " + planType);
    }
}
