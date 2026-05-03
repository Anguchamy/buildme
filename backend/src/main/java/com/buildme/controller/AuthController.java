package com.buildme.controller;

import com.buildme.dto.request.LoginRequest;
import com.buildme.dto.request.RegisterRequest;
import com.buildme.dto.response.AuthResponse;
import com.buildme.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Auth endpoints")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    @Operation(summary = "Register a new user — sends a verification email")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request));
    }

    @PostMapping("/login")
    @Operation(summary = "Login with email and password (email must be verified)")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/refresh")
    @Operation(summary = "Refresh access token")
    public ResponseEntity<AuthResponse> refresh(@RequestHeader("X-Refresh-Token") String refreshToken) {
        return ResponseEntity.ok(authService.refresh(refreshToken));
    }

    @PostMapping("/logout")
    @Operation(summary = "Logout and invalidate refresh token")
    public ResponseEntity<Void> logout(@RequestHeader(value = "X-Refresh-Token", required = false) String refreshToken) {
        authService.logout(refreshToken);
        return ResponseEntity.noContent().build();
    }

    /**
     * GET /api/auth/verify-email?token=xxx
     * Called when the user clicks the link in their email.
     */
    @GetMapping("/verify-email")
    @Operation(summary = "Verify email address via token from the email link")
    public ResponseEntity<Map<String, String>> verifyEmail(@RequestParam @NotBlank String token) {
        authService.verifyEmail(token);
        return ResponseEntity.ok(Map.of("message", "Email verified successfully. You can now log in."));
    }

    /**
     * POST /api/auth/resend-verification
     * Resends the verification email for an unverified account.
     */
    @PostMapping("/resend-verification")
    @Operation(summary = "Resend email verification link")
    public ResponseEntity<Map<String, String>> resendVerification(
        @RequestParam @Email @NotBlank String email
    ) {
        authService.resendVerification(email);
        return ResponseEntity.ok(Map.of("message", "Verification email sent. Please check your inbox."));
    }
}
