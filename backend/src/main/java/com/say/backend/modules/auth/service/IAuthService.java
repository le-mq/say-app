package com.say.backend.modules.auth.service;

import com.say.backend.modules.auth.dto.GoogleAuthRequest;
import com.say.backend.modules.auth.dto.StreakCalendarDto;
import com.say.backend.modules.auth.dto.UserProfileDto;

import java.util.UUID;
import java.util.concurrent.CompletableFuture;

public interface IAuthService {

    CompletableFuture<UserProfileDto> getProfile(UUID userId);

    CompletableFuture<UserProfileDto> updateProfile(UUID userId, UserProfileDto request);

    CompletableFuture<UserProfileDto> authenticateGoogleUser(GoogleAuthRequest request);

    CompletableFuture<StreakCalendarDto> getSonicAuraStreakCalendar(UUID userId, int year, int month);
}
