package com.say.backend.modules.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StreakDayDto {
    private int dayOfMonth;
    private LocalDate date;
    private boolean hasNote;
    private UUID noteId;
    private String songTitle;
    private String artistName;
    private String songImageUrl;
    private String templateType;
    private String emotionTag;
}
