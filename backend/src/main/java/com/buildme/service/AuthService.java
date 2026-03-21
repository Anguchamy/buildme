package com.buildme.service;

import com.buildme.dto.request.LoginRequest;
import com.buildme.dto.request.RegisterRequest;
import com.buildme.dto.response.AuthResponse;
import com.buildme.exception.CustomExceptions;
import com.buildme.model.User;
import com.buildme.repository.UserRepository;
import com.buildme.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
            .build();

        User saved = userRepository.save(user);
        return buildAuthResponse(saved);
    }

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(request.email(), request.password())
        );

        User user = userService.getUserByEmail(request.email());
        return buildAuthResponse(user);
    }

    public AuthResponse refresh(String refreshToken) {
        if (!jwtUtil.validateToken(refreshToken)) {
            throw new CustomExceptions.InvalidTokenException("Invalid or expired refresh token");
        }

        // Check if blacklisted
        if (isBlacklisted(refreshToken)) {
            throw new CustomExceptions.InvalidTokenException("Refresh token has been revoked");
        }

        String email = jwtUtil.extractEmail(refreshToken);
        User user = userService.getUserByEmail(email);

        // Invalidate old refresh token (expires in 7 days)
        blacklist(refreshToken, 7L * 24 * 60 * 60 * 1000);

        return buildAuthResponse(user);
    }

    public void logout(String refreshToken) {
        if (refreshToken != null && jwtUtil.validateToken(refreshToken)) {
            blacklist(refreshToken, 7L * 24 * 60 * 60 * 1000);
        }
    }

    private void blacklist(String token, long ttlMs) {
        long expiryAt = System.currentTimeMillis() + ttlMs;
        tokenBlacklist.put(token, expiryAt);
        // Opportunistically evict expired entries to prevent unbounded growth
        tokenBlacklist.entrySet().removeIf(e -> e.getValue() < System.currentTimeMillis());
    }

    private boolean isBlacklisted(String token) {
        Long expiryAt = tokenBlacklist.get(token);
        if (expiryAt == null) {
            return false;
        }
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
