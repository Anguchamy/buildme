package com.buildme.service;

import com.buildme.dto.request.LoginRequest;
import com.buildme.dto.request.RegisterRequest;
import com.buildme.dto.response.AuthResponse;
import com.buildme.exception.CustomExceptions;
import com.buildme.model.EmailVerification;
import com.buildme.model.User;
import com.buildme.repository.EmailVerificationRepository;
import com.buildme.repository.UserRepository;
import com.buildme.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.OffsetDateTime;
import java.util.Base64;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;
    private final UserService userService;
    private final EmailVerificationRepository emailVerificationRepository;
    private final EmailService emailService;

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    // In-memory token blacklist: token -> expiry timestamp (ms since epoch)
    private final ConcurrentHashMap<String, Long> tokenBlacklist = new ConcurrentHashMap<>();

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new CustomExceptions.DuplicateResourceException("Email already registered: " + request.email());
        }

        User user = User.builder()
            .email(request.email())
            .passwordHash(passwordEncoder.encode(request.password()))
            .fullName(request.fullName())
            .provider("local")
            .emailVerified(false)
            .build();

        User saved = userRepository.save(user);
        sendVerificationEmail(saved);

        // Return auth response — frontend should show "please verify your email" notice
        return buildAuthResponse(saved);
    }

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(request.email(), request.password())
        );

        User user = userService.getUserByEmail(request.email());

        if (!user.isEmailVerified()) {
            throw new CustomExceptions.EmailNotVerifiedException(
                "Please verify your email before logging in. Check your inbox for a verification link."
            );
        }

        return buildAuthResponse(user);
    }

    public AuthResponse refresh(String refreshToken) {
        if (!jwtUtil.validateToken(refreshToken)) {
            throw new CustomExceptions.InvalidTokenException("Invalid or expired refresh token");
        }

        if (isBlacklisted(refreshToken)) {
            throw new CustomExceptions.InvalidTokenException("Refresh token has been revoked");
        }

        String email = jwtUtil.extractEmail(refreshToken);
        User user = userService.getUserByEmail(email);

        blacklist(refreshToken, 7L * 24 * 60 * 60 * 1000);

        return buildAuthResponse(user);
    }

    public void logout(String refreshToken) {
        if (refreshToken != null && jwtUtil.validateToken(refreshToken)) {
            blacklist(refreshToken, 7L * 24 * 60 * 60 * 1000);
        }
    }

    @Transactional
    public void verifyEmail(String token) {
        EmailVerification verification = emailVerificationRepository.findByToken(token)
            .orElseThrow(() -> new CustomExceptions.InvalidTokenException("Invalid or expired verification token"));

        if (verification.isUsed()) {
            throw new CustomExceptions.InvalidTokenException("Verification link has already been used");
        }
        if (verification.isExpired()) {
            throw new CustomExceptions.InvalidTokenException("Verification link has expired. Please request a new one.");
        }

        User user = verification.getUser();
        user.setEmailVerified(true);
        userRepository.save(user);

        verification.setUsed(true);
        emailVerificationRepository.save(verification);

        log.info("Email verified for user {}", user.getEmail());
    }

    @Transactional
    public void resendVerification(String email) {
        User user = userService.getUserByEmail(email);

        if (user.isEmailVerified()) {
            throw new IllegalStateException("Email is already verified");
        }

        // Delete previous tokens for this user
        emailVerificationRepository.deleteByUserId(user.getId());
        sendVerificationEmail(user);
    }

    // ── Internals ──────────────────────────────────────────────────────────────

    private void sendVerificationEmail(User user) {
        String token = generateToken();
        EmailVerification verification = EmailVerification.builder()
            .user(user)
            .token(token)
            .expiresAt(OffsetDateTime.now().plusHours(24))
            .build();
        emailVerificationRepository.save(verification);
        emailService.sendVerificationEmail(user.getEmail(), user.getFullName(), token);
    }

    private String generateToken() {
        byte[] bytes = new byte[48];
        SECURE_RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private void blacklist(String token, long ttlMs) {
        long expiryAt = System.currentTimeMillis() + ttlMs;
        tokenBlacklist.put(token, expiryAt);
        tokenBlacklist.entrySet().removeIf(e -> e.getValue() < System.currentTimeMillis());
    }

    private boolean isBlacklisted(String token) {
        Long expiryAt = tokenBlacklist.get(token);
        if (expiryAt == null) return false;
        if (expiryAt < System.currentTimeMillis()) {
            tokenBlacklist.remove(token);
            return false;
        }
        return true;
    }

    private AuthResponse buildAuthResponse(User user) {
        String accessToken = jwtUtil.generateAccessToken(user.getEmail());
        String refreshToken = jwtUtil.generateRefreshToken(user.getEmail());
        return new AuthResponse(accessToken, refreshToken, userService.toResponse(user));
    }
}
