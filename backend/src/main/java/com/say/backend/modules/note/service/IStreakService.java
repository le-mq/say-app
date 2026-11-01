package com.say.backend.modules.note.service;

import com.say.backend.modules.auth.dto.StreakCalendarDto;

import java.util.UUID;
import java.util.concurrent.CompletableFuture;

public interface IStreakService {

    CompletableFuture<StreakCalendarDto> calculateMonthlyStreak(UUID userId, int year, int month);
}
