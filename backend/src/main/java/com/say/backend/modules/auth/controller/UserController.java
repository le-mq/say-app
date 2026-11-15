package com.say.backend.modules.auth.controller;

import com.say.backend.common.dto.ApiResponse;
import com.say.backend.modules.auth.dto.UserProfileResponse;
import com.say.backend.modules.auth.service.IUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final IUserService userService;

    @GetMapping("/{userId}")
    public CompletableFuture<ResponseEntity<ApiResponse<UserProfileResponse>>> getUserById(
            @PathVariable UUID userId
    ) {
        return userService.getUserById(userId)
                .thenApply(response -> ResponseEntity.ok(ApiResponse.success("User fetched successfully", response)));
    }

    @GetMapping("/username/{username}")
    public CompletableFuture<ResponseEntity<ApiResponse<UserProfileResponse>>> getUserByUsername(
            @PathVariable String username
    ) {
        return userService.getUserByUsername(username)
                .thenApply(response -> ResponseEntity.ok(ApiResponse.success("User fetched successfully", response)));
    }

    @PutMapping("/{userId}")
    public CompletableFuture<ResponseEntity<ApiResponse<UserProfileResponse>>> updateUserProfile(
            @PathVariable UUID userId,
            @RequestBody UserProfileResponse request
    ) {
        return userService.updateUserProfile(userId, request)
                .thenApply(response -> ResponseEntity.ok(ApiResponse.success("User profile updated successfully", response)));
    }

    @GetMapping("/email")
    public CompletableFuture<ResponseEntity<ApiResponse<UserProfileResponse>>> getUserByEmail(
            @RequestParam String email
    ) {
        return userService.getUserByEmail(email)
                .thenApply(response -> ResponseEntity.ok(ApiResponse.success(response)));
    }

    @GetMapping("/search")
    public CompletableFuture<ResponseEntity<ApiResponse<List<UserProfileResponse>>>> searchUsers(
            @RequestParam String query,
            @RequestParam(required = false) UUID excludeUserId
    ) {
        return userService.searchUsers(query, excludeUserId)
                .thenApply(response -> ResponseEntity.ok(ApiResponse.success("Users searched successfully", response)));
    }

    @DeleteMapping("/{userId}")
    public CompletableFuture<ResponseEntity<ApiResponse<Void>>> deleteUserAccount(
            @PathVariable UUID userId
    ) {
        return userService.deleteUserAccount(userId)
                .thenApply(res -> ResponseEntity.ok(ApiResponse.success("User account and all data deleted successfully", null)));
    }
}
