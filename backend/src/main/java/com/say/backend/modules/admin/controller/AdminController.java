package com.say.backend.modules.admin.controller;

import com.say.backend.common.dto.ApiResponse;
import com.say.backend.modules.admin.dto.AdminUserDto;
import com.say.backend.modules.admin.dto.SystemStatsDto;
import com.say.backend.modules.admin.entity.AppConfig;
import com.say.backend.modules.admin.service.IAdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
public class AdminController {

    private final IAdminService adminService;

    @GetMapping("/configs")
    public CompletableFuture<ResponseEntity<ApiResponse<Map<String, String>>>> getAllConfigs(
            @RequestParam UUID adminId
    ) {
        return adminService.getAllConfigs(adminId)
                .thenApply(configs -> ResponseEntity.ok(ApiResponse.success("Configs loaded", configs)));
    }

    @PutMapping("/configs/{configKey}")
    public CompletableFuture<ResponseEntity<ApiResponse<AppConfig>>> updateConfig(
            @PathVariable String configKey,
            @RequestParam UUID adminId,
            @RequestBody Map<String, String> body
    ) {
        String val = body.getOrDefault("value", "");
        return adminService.updateConfig(adminId, configKey, val)
                .thenApply(saved -> ResponseEntity.ok(ApiResponse.success("Config updated", saved)));
    }

    @GetMapping("/users")
    public CompletableFuture<ResponseEntity<ApiResponse<List<AdminUserDto>>>> getAllUsers(
            @RequestParam UUID adminId
    ) {
        return adminService.getAllUsers(adminId)
                .thenApply(users -> ResponseEntity.ok(ApiResponse.success("User directory loaded", users)));
    }

    @PutMapping("/users/{targetUserId}/role")
    public CompletableFuture<ResponseEntity<ApiResponse<AdminUserDto>>> updateUserRole(
            @PathVariable UUID targetUserId,
            @RequestParam UUID adminId,
            @RequestBody Map<String, String> body
    ) {
        String role = body.getOrDefault("role", "USER");
        return adminService.updateUserRole(adminId, targetUserId, role)
                .thenApply(updated -> ResponseEntity.ok(ApiResponse.success("Role updated", updated)));
    }

    @GetMapping("/stats")
    public CompletableFuture<ResponseEntity<ApiResponse<SystemStatsDto>>> getSystemStats(
            @RequestParam UUID adminId
    ) {
        return adminService.getSystemStats(adminId)
                .thenApply(stats -> ResponseEntity.ok(ApiResponse.success("Stats loaded", stats)));
    }
}
