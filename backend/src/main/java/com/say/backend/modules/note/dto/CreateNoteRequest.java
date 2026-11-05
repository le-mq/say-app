package com.say.backend.modules.note.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateNoteRequest {
    private String userId;
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
}
