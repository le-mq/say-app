package com.say.backend.modules.auth.service;

import com.say.backend.modules.auth.dto.UserProfileResponse;

import java.util.List;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

public interface IUserService {

    CompletableFuture<UserProfileResponse> getUserById(UUID userId);

    CompletableFuture<UserProfileResponse> updateUserProfile(UUID userId, UserProfileResponse request);

    CompletableFuture<UserProfileResponse> getUserByEmail(String email);

    CompletableFuture<List<UserProfileResponse>> searchUsers(String query, UUID excludeUserId);

    CompletableFuture<Void> deleteUserAccount(UUID userId);
}
