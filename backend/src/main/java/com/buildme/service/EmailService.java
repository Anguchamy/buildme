package com.buildme.service;

import com.resend.Resend;
import com.resend.core.exception.ResendException;
import com.resend.services.emails.model.CreateEmailOptions;
import com.resend.services.emails.model.CreateEmailResponse;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class EmailService {

    @Value("${app.resend.api-key:}")
    private String apiKey;

    @Value("${app.resend.from:onboarding@resend.dev}")
    private String fromAddress;

    @Value("${app.frontend.url:http://localhost:3000}")
    private String frontendUrl;

    private Resend resend;
    private boolean enabled;

    @PostConstruct
    public void init() {
        enabled = apiKey != null && !apiKey.isBlank() && apiKey.startsWith("re_");
        if (enabled) {
            resend = new Resend(apiKey);
            log.info("Resend email service initialized");
        } else {
            log.warn("Resend API key not configured — emails will be logged only");
        }
    }

    public void sendVerificationEmail(String toEmail, String fullName, String token) {
        String link = frontendUrl + "/verify-email?token=" + token;

        String html = """
            <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#fff;">
              <h1 style="font-size:24px;color:#111827;margin-bottom:8px;">Verify your email</h1>
              <p style="color:#6b7280;margin-bottom:24px;">Hi %s, thanks for signing up for <strong>build.me</strong>!<br>
              Click the button below to verify your email address.</p>
              <a href="%s" style="display:inline-block;background:#8b5cf6;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;font-size:15px;">Verify Email</a>
              <p style="color:#9ca3af;font-size:13px;margin-top:24px;">This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.</p>
              <p style="color:#d1d5db;font-size:12px;margin-top:32px;">Or copy this link: %s</p>
            </div>
            """.formatted(fullName, link, link);

        if (!enabled) {
            log.info("[EMAIL - NOT SENT] To: {} | Verify link: {}", toEmail, link);
            return;
        }

        try {
            CreateEmailOptions options = CreateEmailOptions.builder()
                .from(fromAddress)
                .to(toEmail)
                .subject("Verify your build.me account")
                .html(html)
                .build();

            CreateEmailResponse response = resend.emails().send(options);
            log.info("Verification email sent to {} (id={})", toEmail, response.getId());
        } catch (ResendException | RuntimeException e) {
            log.error("Failed to send verification email to {}: {}", toEmail, e.getMessage());
            log.info("[EMAIL - FALLBACK] To: {} | Verify link: {}", toEmail, link);
        }
    }
}
