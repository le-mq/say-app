package com.say.backend.modules.reply.dto;

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
public class ReplyResponse {
    private UUID id;
    private UUID parentNoteId;
    private UUID userId;
    private String userDisplayName;
    private String userAvatarUrl;
    private String userAudiophileRank;
    private String songTitle;
    private String artistName;
    private String songImageUrl;
    private String externalSongUrl;
    private String replyCaption;
    private Instant createdAt;
}
