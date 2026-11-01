package com.say.backend.modules.auth.controller;

import com.say.backend.common.dto.ApiResponse;
import com.say.backend.modules.auth.dto.GoogleAuthRequest;
import com.say.backend.modules.auth.dto.StreakCalendarDto;
import com.say.backend.modules.auth.dto.UserProfileDto;
import com.say.backend.modules.auth.service.IAuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;
import java.util.concurrent.CompletableFuture;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final IAuthService authService;

    @PostMapping("/google")
    public CompletableFuture<ResponseEntity<ApiResponse<UserProfileDto>>> authenticateWithGoogle(
            @RequestBody GoogleAuthRequest request
    ) {
        return authService.authenticateGoogleUser(request)
                .thenApply(profile -> ResponseEntity.ok(ApiResponse.success("Authentication successful", profile)));
    }

    @GetMapping("/profile/{userId}")
    public CompletableFuture<ResponseEntity<ApiResponse<UserProfileDto>>> getProfile(
            @PathVariable UUID userId
    ) {
        return authService.getProfile(userId)
                .thenApply(profile -> ResponseEntity.ok(ApiResponse.success(profile)));
    }

    @PutMapping("/profile/{userId}")
    public CompletableFuture<ResponseEntity<ApiResponse<UserProfileDto>>> updateProfile(
            @PathVariable UUID userId,
            @RequestBody UserProfileDto request
    ) {
        return authService.updateProfile(userId, request)
                .thenApply(profile -> ResponseEntity.ok(ApiResponse.success("Profile updated successfully", profile)));
    }

    @GetMapping("/streak/{userId}")
    public CompletableFuture<ResponseEntity<ApiResponse<StreakCalendarDto>>> getSonicAuraStreakCalendar(
            @PathVariable UUID userId,
            @RequestParam(defaultValue = "2026") int year,
            @RequestParam(defaultValue = "11") int month
    ) {
        return authService.getSonicAuraStreakCalendar(userId, year, month)
                .thenApply(streak -> ResponseEntity.ok(ApiResponse.success("Streak calendar fetched successfully", streak)));
    }
}
