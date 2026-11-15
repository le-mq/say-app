package com.say.backend.modules.admin.service;

import com.say.backend.modules.admin.dto.AdminUserDto;
import com.say.backend.modules.admin.dto.SystemStatsDto;
import com.say.backend.modules.admin.entity.AppConfig;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

public interface IAdminService {

    CompletableFuture<Map<String, String>> getAllConfigs(UUID requesterId);

    CompletableFuture<AppConfig> updateConfig(UUID requesterId, String configKey, String configValue);

    CompletableFuture<List<AdminUserDto>> getAllUsers(UUID requesterId);

    CompletableFuture<AdminUserDto> updateUserRole(UUID requesterId, UUID targetUserId, String newRole);

    CompletableFuture<SystemStatsDto> getSystemStats(UUID requesterId);
}
