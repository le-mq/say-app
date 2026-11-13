package com.say.backend.modules.admin.service;

import com.say.backend.common.exception.AppException;
import com.say.backend.common.exception.BadRequestException;
import com.say.backend.common.exception.ResourceNotFoundException;
import com.say.backend.common.interceptor.RequestMetricsFilter;
import com.say.backend.modules.admin.dto.AdminUserDto;
import com.say.backend.modules.admin.dto.SystemStatsDto;
import com.say.backend.modules.admin.entity.AppConfig;
import com.say.backend.modules.admin.repository.IAppConfigRepository;
import com.say.backend.modules.auth.entity.User;
import com.say.backend.modules.auth.repository.IUserRepository;
import com.say.backend.modules.note.repository.INoteRepository;
import com.say.backend.modules.social.repository.IFriendshipRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminService implements IAdminService {

    private final IAppConfigRepository appConfigRepository;
    private final IUserRepository userRepository;
    private final INoteRepository noteRepository;
    private final IFriendshipRepository friendshipRepository;
    private final RequestMetricsFilter requestMetricsFilter;

    private void verifyAdminPrivileges(UUID requesterId) {
        if (requesterId == null) {
            throw new BadRequestException("Admin credentials required");
        }
        User requester = userRepository.findById(requesterId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + requesterId));

        if (!"ADMIN".equalsIgnoreCase(requester.getRole())) {
            throw new AppException("Access denied: You do not possess administrator authority.");
        }
    }

    @Override
    @Async("taskExecutor")
    @Transactional(readOnly = true)
    public CompletableFuture<Map<String, String>> getAllConfigs(UUID requesterId) {
        try {
            verifyAdminPrivileges(requesterId);
            List<AppConfig> configs = appConfigRepository.findAll();
            Map<String, String> map = new HashMap<>();
            configs.forEach(c -> map.put(c.getConfigKey(), c.getConfigValue()));
            return CompletableFuture.completedFuture(map);
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error retrieving system configs: {}", e.getMessage());
            throw new AppException("Failed to load configs: " + e.getMessage());
        }
    }

    @Override
    @Async("taskExecutor")
    @Transactional
    public CompletableFuture<AppConfig> updateConfig(UUID requesterId, String configKey, String configValue) {
        try {
            verifyAdminPrivileges(requesterId);
            AppConfig config = appConfigRepository.findById(configKey)
                    .orElse(AppConfig.builder()
                            .configKey(configKey)
                            .description("Dynamic setting " + configKey)
                            .build());

            config.setConfigValue(configValue);
            config.setUpdatedAt(Instant.now());
            AppConfig saved = appConfigRepository.save(config);
            log.info("Admin {} updated config {}: {}", requesterId, configKey, configValue);
            return CompletableFuture.completedFuture(saved);
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error updating config {}: {}", configKey, e.getMessage());
            throw new AppException("Failed to update config: " + e.getMessage());
        }
    }

    @Override
    @Async("taskExecutor")
    @Transactional(readOnly = true)
    public CompletableFuture<List<AdminUserDto>> getAllUsers(UUID requesterId) {
        try {
            verifyAdminPrivileges(requesterId);
            List<User> users = userRepository.findAll();
            List<AdminUserDto> dtos = users.stream().map(u -> {
                long notesCount = noteRepository.findByUserIdOrderByCreatedAtDesc(u.getId()).size();
                long friendsCount = friendshipRepository.findAllAcceptedFriendships(u.getId()).size();
                return AdminUserDto.builder()
                        .id(u.getId())
                        .email(u.getEmail())
                        .username(u.getUsername())
                        .displayName(u.getDisplayName())
                        .avatarUrl(u.getAvatarUrl())
                        .audiophileRank(u.getAudiophileRank())
                        .role(u.getRole() != null ? u.getRole() : "USER")
                        .notesCount(notesCount)
                        .friendsCount(friendsCount)
                        .createdAt(u.getCreatedAt())
                        .build();
            }).toList();
            return CompletableFuture.completedFuture(dtos);
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error retrieving user directory: {}", e.getMessage());
            throw new AppException("Failed to load user directory: " + e.getMessage());
        }
    }

    @Override
    @Async("taskExecutor")
    @Transactional
    public CompletableFuture<AdminUserDto> updateUserRole(UUID requesterId, UUID targetUserId, String newRole) {
        try {
            verifyAdminPrivileges(requesterId);
            String cleanRole = newRole != null ? newRole.trim().toUpperCase() : "USER";
            if (!"USER".equals(cleanRole) && !"ADMIN".equals(cleanRole)) {
                throw new BadRequestException("Role must be USER or ADMIN");
            }

            User target = userRepository.findById(targetUserId)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found: " + targetUserId));

            target.setRole(cleanRole);
            User saved = userRepository.save(target);
            log.info("Admin {} changed role of {} to {}", requesterId, targetUserId, cleanRole);

            long notesCount = noteRepository.findByUserIdOrderByCreatedAtDesc(saved.getId()).size();
            long friendsCount = friendshipRepository.findAllAcceptedFriendships(saved.getId()).size();

            AdminUserDto dto = AdminUserDto.builder()
                    .id(saved.getId())
                    .email(saved.getEmail())
                    .username(saved.getUsername())
                    .displayName(saved.getDisplayName())
                    .avatarUrl(saved.getAvatarUrl())
                    .audiophileRank(saved.getAudiophileRank())
                    .role(saved.getRole())
                    .notesCount(notesCount)
                    .friendsCount(friendsCount)
                    .createdAt(saved.getCreatedAt())
                    .build();

            return CompletableFuture.completedFuture(dto);
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error updating user role: {}", e.getMessage());
            throw new AppException("Failed to update role: " + e.getMessage());
        }
    }

    @Override
    @Async("taskExecutor")
    @Transactional(readOnly = true)
    public CompletableFuture<SystemStatsDto> getSystemStats(UUID requesterId) {
        try {
            verifyAdminPrivileges(requesterId);
            long totalUsers = userRepository.count();
            long totalNotes = noteRepository.count();
            long totalFriendships = friendshipRepository.count();

            SystemStatsDto stats = SystemStatsDto.builder()
                    .totalUsers(totalUsers)
                    .totalNotes(totalNotes)
                    .totalFriendships(totalFriendships)
                    .totalApiRequests(requestMetricsFilter.getTotalRequests())
                    .errorApiRequests(requestMetricsFilter.getErrorRequests())
                    .requestsByEndpoint(requestMetricsFilter.getEndpointStats())
                    .build();

            return CompletableFuture.completedFuture(stats);
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error computing system stats: {}", e.getMessage());
            throw new AppException("Failed to load system stats: " + e.getMessage());
        }
    }
}
