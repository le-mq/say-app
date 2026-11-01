package com.say.backend.modules.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StreakCalendarDto {
    private UUID userId;
    private int year;
    private int month;
    private int totalNotesThisMonth;
    private int currentStreakDays;
    private List<StreakDayDto> days;
}
