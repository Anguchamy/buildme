package com.buildme.service;

import com.stripe.Stripe;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.exception.StripeException;
import com.stripe.model.Event;
import com.stripe.model.checkout.Session;
import com.stripe.net.Webhook;
import com.stripe.param.checkout.SessionCreateParams;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@Slf4j
public class StripeService {

    // Prices in cents (USD × 100)
    private static final long PRICE_PRO_CENTS    = 1900L;  // $19.00
    private static final long PRICE_AGENCY_CENTS = 4900L;  // $49.00

    @Value("${app.stripe.secret-key:}")
    private String secretKey;

    @Value("${app.stripe.publishable-key:}")
    private String publishableKey;

    @Value("${app.stripe.webhook-secret:}")
    private String webhookSecret;

    @Value("${app.frontend.url:http://localhost:3000}")
    private String frontendUrl;

    private boolean enabled;

    @PostConstruct
    public void init() {
        enabled = secretKey != null && !secretKey.isBlank() && secretKey.startsWith("sk_");
        if (enabled) {
            Stripe.apiKey = secretKey;
            log.info("Stripe SDK initialized (publishableKey={})", publishableKey);
        } else {
            log.info("Stripe not configured — payments disabled");
        }
    }

    public boolean isEnabled() { return enabled; }
    public String getPublishableKey() { return publishableKey; }

    /**
     * Creates a Stripe Checkout Session for the given plan.
     * Returns: sessionId, publishableKey, url (redirect to Stripe hosted page).
     */
    public Map<String, Object> createCheckoutSession(String planType, Long workspaceId) {
        long amountCents = "PRO".equalsIgnoreCase(planType) ? PRICE_PRO_CENTS : PRICE_AGENCY_CENTS;
        String planName = "PRO".equalsIgnoreCase(planType) ? "Pro Plan" : "Agency Plan";

        if (!enabled) {
            return Map.of(
                "sessionId",       "cs_placeholder_" + planType.toLowerCase(),
                "publishableKey",  publishableKey != null ? publishableKey : "pk_test_placeholder",
                "url",             frontendUrl + "/app/settings?tab=subscription&mock=true"
            );
        }

        try {
            SessionCreateParams params = SessionCreateParams.builder()
                .setMode(SessionCreateParams.Mode.PAYMENT)
                .setSuccessUrl(frontendUrl + "/app/settings?tab=subscription&session_id={CHECKOUT_SESSION_ID}")
                .setCancelUrl(frontendUrl + "/app/settings?tab=subscription&cancelled=true")
                .addLineItem(
                    SessionCreateParams.LineItem.builder()
                        .setQuantity(1L)
                        .setPriceData(
                            SessionCreateParams.LineItem.PriceData.builder()
                                .setCurrency("usd")
                                .setUnitAmount(amountCents)
                                .setProductData(
                                    SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                        .setName(planName)
                                        .setDescription("build.me " + planName + " - Monthly")
                                        .build()
                                )
                                .build()
                        )
                        .build()
                )
                .putMetadata("workspaceId", workspaceId.toString())
                .putMetadata("planType", planType.toUpperCase())
                .build();

            Session session = Session.create(params);
            log.info("Created Stripe session: {} for plan: {} workspace: {}", session.getId(), planType, workspaceId);

            return Map.of(
                "sessionId",      session.getId(),
                "publishableKey", publishableKey,
                "url",            session.getUrl()
            );
        } catch (StripeException e) {
            throw new RuntimeException("Failed to create Stripe checkout session: " + e.getMessage(), e);
        }
    }

    /**
     * Retrieves a completed Checkout Session by ID and returns planType + workspaceId from metadata.
     */
    public Session retrieveSession(String sessionId) {
        try {
            Session session = Session.retrieve(sessionId);
            if (!"complete".equals(session.getStatus())) {
                throw new RuntimeException("Stripe session not completed: " + session.getStatus());
            }
            return session;
        } catch (StripeException e) {
            throw new RuntimeException("Failed to retrieve Stripe session: " + e.getMessage(), e);
        }
    }

    /**
     * Verifies a Stripe webhook signature and returns the parsed Event.
     */
    public Event constructWebhookEvent(String payload, String sigHeader) {
        try {
            return Webhook.constructEvent(payload, sigHeader, webhookSecret);
        } catch (SignatureVerificationException e) {
            throw new RuntimeException("Invalid Stripe webhook signature", e);
        }
    }
}
