package com.say.backend.modules.note.service;

import com.say.backend.common.exception.AppException;
import com.say.backend.common.exception.ResourceNotFoundException;
import com.say.backend.modules.auth.dto.StreakCalendarDto;
import com.say.backend.modules.auth.dto.StreakDayDto;
import com.say.backend.modules.auth.repository.IUserRepository;
import com.say.backend.modules.note.entity.Note;
import com.say.backend.modules.note.repository.INoteRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.ZoneOffset;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class StreakService implements IStreakService {

    private final INoteRepository noteRepository;
    private final IUserRepository userRepository;

    @Override
    @Async("taskExecutor")
    @Transactional(readOnly = true)
    public CompletableFuture<StreakCalendarDto> calculateMonthlyStreak(UUID userId, int year, int month) {
        try {
            if (!userRepository.existsById(userId)) {
                throw new ResourceNotFoundException("User not found with id: " + userId);
            }

            YearMonth yearMonth = YearMonth.of(year, month);
            Instant startOfMonth = yearMonth.atDay(1).atStartOfDay(ZoneOffset.UTC).toInstant();
            Instant endOfMonth = yearMonth.atEndOfMonth().atTime(23, 59, 59).atZone(ZoneOffset.UTC).toInstant();

            List<Note> notes = noteRepository.findByUserIdAndCreatedAtBetweenOrderByCreatedAtAsc(userId, startOfMonth, endOfMonth);

            Map<Integer, Note> notesByDay = notes.stream()
                    .collect(Collectors.toMap(
                            n -> n.getCreatedAt().atZone(ZoneOffset.UTC).getDayOfMonth(),
                            n -> n,
                            (existing, replacement) -> existing
                    ));

            Map<Integer, Long> countsByDay = notes.stream()
                    .collect(Collectors.groupingBy(
                            n -> n.getCreatedAt().atZone(ZoneOffset.UTC).getDayOfMonth(),
                            Collectors.counting()
                    ));

            int daysInMonth = yearMonth.lengthOfMonth();
            List<StreakDayDto> streakDays = new ArrayList<>();
            int currentStreak = 0;
            int maxStreak = 0;

            for (int day = 1; day <= daysInMonth; day++) {
                LocalDate date = yearMonth.atDay(day);
                Note note = notesByDay.get(day);
                boolean hasNote = (note != null);
                int noteCount = countsByDay.getOrDefault(day, 0L).intValue();

                if (hasNote) {
                    currentStreak++;
                    if (currentStreak > maxStreak) {
                        maxStreak = currentStreak;
                    }
                } else {
                    currentStreak = 0;
                }

                streakDays.add(StreakDayDto.builder()
                        .dayOfMonth(day)
                        .date(date)
                        .hasNote(hasNote)
                        .noteCount(noteCount)
                        .noteId(hasNote ? note.getId() : null)
                        .songTitle(hasNote ? note.getSongTitle() : null)
                        .artistName(hasNote ? note.getArtistName() : null)
                        .songImageUrl(hasNote ? note.getSongImageUrl() : null)
                        .templateType(hasNote ? note.getTemplateType() : null)
                        .emotionTag(hasNote ? note.getEmotionTag() : null)
                        .build());
            }

            StreakCalendarDto response = StreakCalendarDto.builder()
                    .userId(userId)
                    .year(year)
                    .month(month)
                    .totalNotesThisMonth(notes.size())
                    .currentStreakDays(maxStreak)
                    .days(streakDays)
                    .build();

            return CompletableFuture.completedFuture(response);
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error calculating streak for user {}: {}", userId, e.getMessage());
            throw new AppException("Failed to calculate monthly streak: " + e.getMessage());
        }
    }
}
