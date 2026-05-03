package com.buildme.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.frontend.url:http://localhost:3000}")
    private String frontendUrl;

    @Value("${spring.mail.username:noreply@build.me}")
    private String fromAddress;

    public void sendVerificationEmail(String toEmail, String fullName, String token) {
        String link = frontendUrl + "/verify-email?token=" + token;

        String html = """
            <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#fff;">
              <h1 style="font-size:24px;color:#111827;margin-bottom:8px;">Verify your email</h1>
              <p style="color:#6b7280;margin-bottom:24px;">Hi %s, thanks for signing up for <strong>build.me</strong>!<br>
              Click the button below to verify your email address.</p>
              <a href="%s" style="display:inline-block;background:#8b5cf6;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;font-size:15px;">Verify Email</a>
              <p style="color:#9ca3af;font-size:13px;margin-top:24px;">This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.</p>
              <p style="color:#d1d5db;font-size:12px;margin-top:32px;">Or copy this URL: %s</p>
            </div>
            """.formatted(fullName, link, link);

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromAddress);
            helper.setTo(toEmail);
            helper.setSubject("Verify your build.me account");
            helper.setText(html, true);
            mailSender.send(message);
            log.info("Verification email sent to {}", toEmail);
        } catch (MessagingException e) {
            log.error("Failed to send verification email to {}: {}", toEmail, e.getMessage());
        }
    }
}
