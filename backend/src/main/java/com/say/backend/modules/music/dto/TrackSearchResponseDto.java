package com.say.backend.modules.music.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TrackSearchResponseDto {
    private String id;
    private String songTitle;
    private String artistName;
    private String songImageUrl;
    private String externalSongUrl;
    private String previewAudioUrl;
    private Long durationMs;
    private String platform; // "SPOTIFY" or "YOUTUBE"
}
