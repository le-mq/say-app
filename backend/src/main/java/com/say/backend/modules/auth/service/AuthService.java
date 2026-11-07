package com.say.backend.modules.auth.service;

import com.say.backend.common.exception.AppException;
import com.say.backend.common.exception.BadRequestException;
import com.say.backend.common.exception.ResourceNotFoundException;
import com.say.backend.modules.auth.dto.GoogleAuthRequest;
import com.say.backend.modules.auth.dto.StreakCalendarDto;
import com.say.backend.modules.auth.dto.StreakDayDto;
import com.say.backend.modules.auth.dto.UserProfileDto;
import com.say.backend.modules.auth.entity.User;
import com.say.backend.modules.auth.repository.IUserRepository;
import com.say.backend.modules.note.entity.Note;
import com.say.backend.modules.note.repository.INoteRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.*;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService implements IAuthService {

    private static final Pattern USERNAME_PATTERN = Pattern.compile("^[a-zA-Z0-9_.]{3,30}$");
    private final IUserRepository userRepository;
    private final INoteRepository noteRepository;

    @Override
    @Async("taskExecutor")
    @Transactional(readOnly = true)
    public CompletableFuture<UserProfileDto> getProfile(UUID userId) {
        try {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
            return CompletableFuture.completedFuture(mapToProfileDto(user));
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error retrieving profile for user {}: {}", userId, e.getMessage());
            throw new AppException("Failed to retrieve user profile: " + e.getMessage());
        }
    }

    @Override
    @Async("taskExecutor")
    @Transactional
    public CompletableFuture<UserProfileDto> updateProfile(UUID userId, UserProfileDto request) {
        try {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

            // Validate and enforce unique username
            if (request.getUsername() != null && !request.getUsername().isBlank()) {
                String cleanUsername = request.getUsername().trim().replaceFirst("^@", "").toLowerCase();
                if (!USERNAME_PATTERN.matcher(cleanUsername).matches()) {
                    throw new BadRequestException("Username must be 3-30 characters and contain only letters, numbers, dots, or underscores");
                }
                if (!cleanUsername.equalsIgnoreCase(user.getUsername())) {
                    if (userRepository.existsByUsernameAndIdNot(cleanUsername, userId)) {
                        throw new BadRequestException("Username '@" + cleanUsername + "' is already taken by another audiophile");
                    }
                    user.setUsername(cleanUsername);
                }
            }

            if (request.getDisplayName() != null && !request.getDisplayName().isBlank()) {
                user.setDisplayName(request.getDisplayName());
            }
            if (request.getBio() != null) {
                user.setBio(request.getBio());
            }
            if (request.getAvatarUrl() != null) {
                user.setAvatarUrl(request.getAvatarUrl());
            }
            if (request.getAudiophileRank() != null) {
                user.setAudiophileRank(request.getAudiophileRank());
            }

            User savedUser = userRepository.save(user);
            return CompletableFuture.completedFuture(mapToProfileDto(savedUser));
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error updating profile for user {}: {}", userId, e.getMessage());
            throw new AppException("Failed to update user profile: " + e.getMessage());
        }
    }

    @Override
    @Async("taskExecutor")
    @Transactional
    public CompletableFuture<UserProfileDto> authenticateGoogleUser(GoogleAuthRequest request) {
        try {
            if (request.getEmail() == null || request.getEmail().isBlank()) {
                throw new AppException("Email is required for authentication");
            }

            User user = userRepository.findByEmail(request.getEmail())
                    .map(existingUser -> {
                        if (request.getAvatarUrl() != null) {
                            existingUser.setAvatarUrl(request.getAvatarUrl());
                        }
                        if (request.getDisplayName() != null) {
                            existingUser.setDisplayName(request.getDisplayName());
                        }
                        return userRepository.save(existingUser);
                    })
                    .orElseGet(() -> {
                        User newUser = User.builder()
                                .email(request.getEmail())
                                .displayName(request.getDisplayName() != null ? request.getDisplayName() : "Audiophile")
                                .avatarUrl(request.getAvatarUrl())
                                .audiophileRank("Novice Listener")
                                .build();
                        return userRepository.save(newUser);
                    });

            return CompletableFuture.completedFuture(mapToProfileDto(user));
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error authenticating Google user {}: {}", request.getEmail(), e.getMessage());
            throw new AppException("Failed to authenticate user: " + e.getMessage());
        }
    }

    @Override
    @Async("taskExecutor")
    @Transactional(readOnly = true)
    public CompletableFuture<StreakCalendarDto> getSonicAuraStreakCalendar(UUID userId, int year, int month) {
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
            log.error("Error generating Sonic Aura Streak Calendar for user {}: {}", userId, e.getMessage());
            throw new AppException("Failed to generate streak calendar: " + e.getMessage());
        }
    }

    private UserProfileDto mapToProfileDto(User user) {
        return UserProfileDto.builder()
                .id(user.getId())
                .email(user.getEmail())
                .username(user.getUsername())
                .displayName(user.getDisplayName())
                .avatarUrl(user.getAvatarUrl())
                .bio(user.getBio())
                .audiophileRank(user.getAudiophileRank())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }
}
