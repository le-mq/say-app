package com.say.backend.modules.admin.dto;

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
public class AdminUserDto {
    private UUID id;
    private String email;
    private String username;
    private String displayName;
    private String avatarUrl;
    private String audiophileRank;
    private String role;
    private long notesCount;
    private long friendsCount;
    private Instant createdAt;
}
