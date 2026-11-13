package com.say.backend.modules.social.dto;

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
public class FriendResponse {
    private UUID id;
    private UUID requesterId;
    private String requesterUsername;
    private String requesterDisplayName;
    private String requesterAvatarUrl;
    private String requesterAudiophileRank;
    private UUID addresseeId;
    private String addresseeUsername;
    private String addresseeDisplayName;
    private String addresseeAvatarUrl;
    private String addresseeAudiophileRank;
    private String status;
    private Instant createdAt;
    private Instant updatedAt;
}
