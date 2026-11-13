package com.say.backend.modules.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileDto {
    private UUID id;
    private String email;
    private String username;
    private String displayName;
    private String avatarUrl;
    private String bio;
    private String audiophileRank;
    private String role;
    private Integer streakDays;
    private Instant createdAt;
    private Instant updatedAt;
}
