package com.say.backend.modules.auth.service;

import com.say.backend.common.exception.AppException;
import com.say.backend.common.exception.BadRequestException;
import com.say.backend.common.exception.ResourceNotFoundException;
import com.say.backend.modules.auth.dto.UserProfileResponse;
import com.say.backend.modules.auth.entity.User;
import com.say.backend.modules.auth.repository.IUserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.regex.Pattern;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService implements IUserService {

    private static final Pattern USERNAME_PATTERN = Pattern.compile("^[a-zA-Z0-9_.]{3,30}$");
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

            // Validate and update unique username
            if (request.getUsername() != null && !request.getUsername().isBlank()) {
                String cleanUsername = request.getUsername().trim().replaceFirst("^@", "").toLowerCase();
                if (!USERNAME_PATTERN.matcher(cleanUsername).matches()) {
                    throw new BadRequestException("Username must be 3-30 characters and contain only letters, numbers, dots, or underscores");
                }
                if (!cleanUsername.equalsIgnoreCase(user.getUsername())) {
                    if (userRepository.existsByUsernameAndIdNot(cleanUsername, userId)) {
                        throw new BadRequestException("Username '@" + cleanUsername + "' is already taken by another audiophile");
                    }
                    user.setUsername(cleanUsername);
                }
            }

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

    @Override
    @Async("taskExecutor")
    @Transactional(readOnly = true)
    public CompletableFuture<List<UserProfileResponse>> searchUsers(String query, UUID excludeUserId) {
        try {
            String rawTrimmed = query == null ? "" : query.trim();
            if (rawTrimmed.isEmpty()) {
                return CompletableFuture.completedFuture(List.of());
            }

            boolean usernameOnly = rawTrimmed.startsWith("@");
            String cleanQuery = usernameOnly ? rawTrimmed.substring(1).trim() : rawTrimmed;
            if (cleanQuery.isEmpty()) {
                return CompletableFuture.completedFuture(List.of());
            }

            String normalizedQuery = normalizeForSearch(cleanQuery);
            String[] tokens = Arrays.stream(normalizedQuery.split("\\s+"))
                    .filter(t -> !t.isEmpty())
                    .toArray(String[]::new);

            if (tokens.length == 0) {
                return CompletableFuture.completedFuture(List.of());
            }

            List<UserProfileResponse> results = userRepository.findAll().stream()
                    .filter(u -> excludeUserId == null || !u.getId().equals(excludeUserId))
                    .filter(u -> usernameOnly
                            ? matchesUsername(u, normalizedQuery)
                            : matchesAllTokens(u, tokens))
                    .sorted(Comparator
                            .comparingInt((User u) -> matchPriority(u, normalizedQuery))
                            .thenComparing(User::getDisplayName, Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER)))
                    .limit(20)
                    .map(this::mapToResponse)
                    .toList();
            return CompletableFuture.completedFuture(results);
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error searching users with query '{}': {}", query, e.getMessage());
            throw new AppException("Failed to search users: " + e.getMessage());
        }
    }

    private boolean matchesUsername(User user, String normalizedQuery) {
        if (user.getUsername() == null || user.getUsername().isBlank()) {
            return false;
        }
        return normalizeForSearch(user.getUsername()).contains(normalizedQuery);
    }

    private int matchPriority(User user, String normalizedQuery) {
        String uname = user.getUsername() != null ? normalizeForSearch(user.getUsername()) : "";
        if (!uname.isEmpty() && uname.equals(normalizedQuery)) {
            return 0; // Exact username match first
        }
        if (!uname.isEmpty() && uname.startsWith(normalizedQuery)) {
            return 1; // Username prefix match second
        }
        return 2; // General displayName/email match
    }

    private boolean matchesAllTokens(User user, String[] tokens) {
        String searchable = normalizeForSearch(
                (user.getDisplayName() != null ? user.getDisplayName() : "") + " " +
                (user.getUsername() != null ? user.getUsername() : "") + " " +
                (user.getEmail() != null ? user.getEmail() : "")
        );
        for (String token : tokens) {
            if (!searchable.contains(token)) {
                return false;
            }
        }
        return true;
    }

    private String normalizeForSearch(String input) {
        if (input == null) return "";
        String normalized = Normalizer.normalize(input, Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "")
                .replace('đ', 'd')
                .replace('Đ', 'D');
        return normalized.toLowerCase(Locale.ROOT).trim();
    }

    @Override
    @Async("taskExecutor")
    @Transactional
    public CompletableFuture<Void> deleteUserAccount(UUID userId) {
        try {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

            userRepository.delete(user);
            log.info("User account successfully deleted: {}", userId);
            return CompletableFuture.completedFuture(null);
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error deleting user account {}: {}", userId, e.getMessage());
            throw new AppException("Failed to delete user account: " + e.getMessage());
        }
    }

    private UserProfileResponse mapToResponse(User user) {
        return UserProfileResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .username(user.getUsername())
                .displayName(user.getDisplayName())
                .avatarUrl(user.getAvatarUrl())
                .bio(user.getBio())
                .audiophileRank(user.getAudiophileRank())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }
}
