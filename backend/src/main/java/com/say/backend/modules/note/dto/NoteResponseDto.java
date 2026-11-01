package com.say.backend.modules.note.dto;

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
public class NoteResponseDto {
    private UUID id;
    private UUID userId;
    private String userDisplayName;
    private String userAvatarUrl;
    private String userAudiophileRank;
    private String songTitle;
    private String artistName;
    private String songImageUrl;
    private String externalSongUrl;
    private Integer audioSnippetStart;
    private String caption;
    private String lyricSnippet;
    private String templateType;
    private String emotionTag;
    private String stickerBadge;
    private String visibility;
    private Instant createdAt;
}
