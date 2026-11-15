package com.say.backend.modules.social.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FriendProfileDto {
    private UUID friendshipId;
    private UUID friendId;
    private String username;
    private String displayName;
    private String avatarUrl;
    private String audiophileRank;
    private String bio;
}
