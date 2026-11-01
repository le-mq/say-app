package com.say.backend.modules.auth.service;

import com.say.backend.common.exception.AppException;
import com.say.backend.common.exception.ResourceNotFoundException;
import com.say.backend.modules.auth.dto.UserProfileResponse;
import com.say.backend.modules.auth.entity.User;
import com.say.backend.modules.auth.repository.IUserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;
import java.util.concurrent.CompletableFuture;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService implements IUserService {

    private final IUserRepository userRepository;

    @Override
    @Async("taskExecutor")
    @Transactional(readOnly = true)
    public CompletableFuture<UserProfileResponse> getUserById(UUID userId) {
        try {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
            return CompletableFuture.completedFuture(mapToResponse(user));
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error retrieving user {}: {}", userId, e.getMessage());
            throw new AppException("Failed to retrieve user: " + e.getMessage());
        }
    }

    @Override
    @Async("taskExecutor")
    @Transactional
    public CompletableFuture<UserProfileResponse> updateUserProfile(UUID userId, UserProfileResponse request) {
        try {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

            if (request.getDisplayName() != null && !request.getDisplayName().isBlank()) {
                user.setDisplayName(request.getDisplayName());
            }
            if (request.getBio() != null) {
                user.setBio(request.getBio());
            }
            if (request.getAvatarUrl() != null) {
                user.setAvatarUrl(request.getAvatarUrl());
            }
            if (request.getAudiophileRank() != null) {
                user.setAudiophileRank(request.getAudiophileRank());
            }

            User savedUser = userRepository.save(user);
            return CompletableFuture.completedFuture(mapToResponse(savedUser));
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error updating user profile {}: {}", userId, e.getMessage());
            throw new AppException("Failed to update user profile: " + e.getMessage());
        }
    }

    @Override
    @Async("taskExecutor")
    @Transactional(readOnly = true)
    public CompletableFuture<UserProfileResponse> getUserByEmail(String email) {
        try {
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
            return CompletableFuture.completedFuture(mapToResponse(user));
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error retrieving user with email {}: {}", email, e.getMessage());
            throw new AppException("Failed to retrieve user by email: " + e.getMessage());
        }
    }

    private UserProfileResponse mapToResponse(User user) {
        return UserProfileResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .displayName(user.getDisplayName())
                .avatarUrl(user.getAvatarUrl())
                .bio(user.getBio())
                .audiophileRank(user.getAudiophileRank())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }
}
