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
    private String requesterDisplayName;
    private String requesterAvatarUrl;
    private UUID addresseeId;
    private String addresseeDisplayName;
    private String addresseeAvatarUrl;
    private String status;
    private Instant createdAt;
    private Instant updatedAt;
}
