package com.say.backend.modules.note.service;

import com.say.backend.common.exception.AppException;
import com.say.backend.common.exception.BadRequestException;
import com.say.backend.common.exception.ResourceNotFoundException;
import com.say.backend.modules.admin.repository.IAppConfigRepository;
import com.say.backend.modules.auth.entity.User;
import com.say.backend.modules.auth.repository.IUserRepository;
import com.say.backend.modules.note.dto.CreateNoteRequest;
import com.say.backend.modules.note.dto.NoteResponseDto;
import com.say.backend.modules.note.entity.Note;
import com.say.backend.modules.note.repository.INoteRepository;
import com.say.backend.modules.notification.service.INotificationService;
import com.say.backend.modules.social.repository.IFriendshipRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.concurrent.CompletableFuture;

@Slf4j
@Service
@RequiredArgsConstructor
public class NoteService implements INoteService {

    private static final Set<String> VALID_TEMPLATES = Set.of("RECEIPTIFY", "CASSETTE", "STAMP", "VINYL", "GALAXY");
    private static final Set<String> VALID_VISIBILITY = Set.of("PUBLIC", "FRIENDS_ONLY");

    private final INoteRepository noteRepository;
    private final IUserRepository userRepository;
    private final IFriendshipRepository friendshipRepository;
    private final INotificationService notificationService;
    private final IAppConfigRepository appConfigRepository;

    @Override
    @Async("taskExecutor")
    @Transactional
    public CompletableFuture<NoteResponseDto> createNote(CreateNoteRequest request) {
        try {
            if (request.getUserId() == null || request.getUserId().isBlank()) {
                throw new BadRequestException("User ID is required to create a note");
            }
            if (request.getSongTitle() == null || request.getSongTitle().isBlank()) {
                throw new BadRequestException("Song title is required");
            }
            if (request.getArtistName() == null || request.getArtistName().isBlank()) {
                throw new BadRequestException("Artist name is required");
            }
            if (request.getSongImageUrl() == null || request.getSongImageUrl().isBlank()) {
                throw new BadRequestException("Song image URL is required");
            }
            if (request.getExternalSongUrl() == null || request.getExternalSongUrl().isBlank()) {
                throw new BadRequestException("External song URL is required");
            }

            // Enforce dynamic system max caption length
            int maxCaptionLength = appConfigRepository.findById("MAX_CAPTION_LENGTH")
                    .map(c -> {
                        try { return Integer.parseInt(c.getConfigValue().trim()); } catch (Exception ignored) { return 150; }
                    })
                    .orElse(150);

            if (request.getCaption() != null && request.getCaption().length() > maxCaptionLength) {
                throw new BadRequestException("Nội dung cảm nghĩ vượt quá độ dài tối đa (" + maxCaptionLength + " ký tự)");
            }

            String rawTemplate = request.getTemplateType();
            String cleanTemplate = "RECEIPTIFY";
            if (rawTemplate != null && !rawTemplate.isBlank()) {
                String upper = rawTemplate.toUpperCase();
                String base = upper.contains(":") ? upper.split(":")[0] : upper;
                if (!VALID_TEMPLATES.contains(base)) {
                    throw new BadRequestException("Invalid template type: " + request.getTemplateType());
                }
                cleanTemplate = base;
            }

            String cleanVisibility = "PUBLIC";
            if (request.getVisibility() != null && !request.getVisibility().isBlank()) {
                String upperVis = request.getVisibility().toUpperCase().trim();
                if ("FRIENDS".equals(upperVis) || "FRIENDS_ONLY".equals(upperVis)) {
                    cleanVisibility = "FRIENDS_ONLY";
                } else if ("PUBLIC".equals(upperVis)) {
                    cleanVisibility = "PUBLIC";
                } else {
                    throw new BadRequestException("Invalid visibility type: " + request.getVisibility());
                }
            }

            UUID userUuid;
            try {
                userUuid = UUID.fromString(request.getUserId());
            } catch (Exception ex) {
                userUuid = UUID.nameUUIDFromBytes(request.getUserId().getBytes(java.nio.charset.StandardCharsets.UTF_8));
            }

            final UUID finalUuid = userUuid;
            User user = userRepository.findById(finalUuid)
                    .orElseGet(() -> userRepository.findAll().stream().findFirst().orElseGet(() -> {
                        User newUser = User.builder()
                                .id(finalUuid)
                                .email("listener." + UUID.randomUUID().toString().substring(0, 8) + "@say.fm")
                                .displayName("Audiophile")
                                .audiophileRank("Vinyl Connoisseur")
                                .build();
                        return userRepository.save(newUser);
                    }));

            Note note = Note.builder()
                    .user(user)
                    .songTitle(request.getSongTitle())
                    .artistName(request.getArtistName())
                    .songImageUrl(request.getSongImageUrl())
                    .externalSongUrl(request.getExternalSongUrl())
                    .audioSnippetStart(request.getAudioSnippetStart() != null ? request.getAudioSnippetStart() : 0)
                    .caption(request.getCaption())
                    .lyricSnippet(request.getLyricSnippet())
                    .templateType(cleanTemplate)
                    .emotionTag(request.getEmotionTag())
                    .stickerBadge(request.getStickerBadge())
                    .visibility(cleanVisibility)
                    .build();

            Note savedNote = noteRepository.save(note);
            return CompletableFuture.completedFuture(mapToResponseDto(savedNote));
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error creating note: {}", e.getMessage());
            throw new AppException("Failed to create note: " + e.getMessage());
        }
    }

    @Override
    @Async("taskExecutor")
    @Transactional(readOnly = true)
    public CompletableFuture<NoteResponseDto> getNoteById(UUID noteId) {
        try {
            Note note = noteRepository.findById(noteId)
                    .orElseThrow(() -> new ResourceNotFoundException("Note not found with id: " + noteId));
            return CompletableFuture.completedFuture(mapToResponseDto(note));
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error retrieving note {}: {}", noteId, e.getMessage());
            throw new AppException("Failed to retrieve note: " + e.getMessage());
        }
    }

    @Override
    @Async("taskExecutor")
    @Transactional(readOnly = true)
    public CompletableFuture<List<NoteResponseDto>> getPublicFeed() {
        return getPublicFeed(null);
    }

    @Override
    @Async("taskExecutor")
    @Transactional(readOnly = true)
    public CompletableFuture<List<NoteResponseDto>> getPublicFeed(UUID viewerId) {
        try {
            List<Note> notes = noteRepository.findByVisibilityOrderByCreatedAtDesc("PUBLIC");
            List<NoteResponseDto> dtos = notes.stream().map(n -> mapToResponseDto(n, viewerId)).toList();
            return CompletableFuture.completedFuture(dtos);
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error fetching public feed: {}", e.getMessage());
            throw new AppException("Failed to fetch public feed: " + e.getMessage());
        }
    }

    @Override
    @Async("taskExecutor")
    @Transactional(readOnly = true)
    public CompletableFuture<List<NoteResponseDto>> getFriendsFeed(UUID currentUserId) {
        try {
            if (!userRepository.existsById(currentUserId)) {
                throw new ResourceNotFoundException("User not found with id: " + currentUserId);
            }

            List<UUID> friendIds = friendshipRepository.findAcceptedFriendUserIds(currentUserId);
            List<Note> feedNotes;
            if (friendIds.isEmpty()) {
                feedNotes = noteRepository.findFeedNotesWithoutFriends(currentUserId);
            } else {
                feedNotes = noteRepository.findFeedNotes(currentUserId, friendIds);
            }

            List<NoteResponseDto> dtos = feedNotes.stream().map(n -> mapToResponseDto(n, currentUserId)).toList();
            return CompletableFuture.completedFuture(dtos);
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error fetching friends feed for user {}: {}", currentUserId, e.getMessage());
            throw new AppException("Failed to fetch feed: " + e.getMessage());
        }
    }

    @Override
    @Async("taskExecutor")
    @Transactional(readOnly = true)
    public CompletableFuture<List<NoteResponseDto>> getUserNotes(UUID userId) {
        return getUserNotes(userId, null);
    }

    @Override
    @Async("taskExecutor")
    @Transactional(readOnly = true)
    public CompletableFuture<List<NoteResponseDto>> getUserNotes(UUID userId, UUID viewerId) {
        try {
            if (!userRepository.existsById(userId)) {
                throw new ResourceNotFoundException("User not found with id: " + userId);
            }
            List<Note> notes = noteRepository.findByUserIdOrderByCreatedAtDesc(userId);

            boolean isSelf = viewerId != null && viewerId.equals(userId);
            boolean isAcceptedFriend = false;
            if (!isSelf && viewerId != null) {
                isAcceptedFriend = friendshipRepository.findFriendshipBetween(userId, viewerId)
                        .filter(f -> "ACCEPTED".equalsIgnoreCase(f.getStatus()))
                        .isPresent();
            }

            final boolean canViewFriendsOnly = isSelf || isAcceptedFriend;
            List<NoteResponseDto> dtos = notes.stream()
                    .filter(n -> canViewFriendsOnly || "PUBLIC".equalsIgnoreCase(n.getVisibility()))
                    .map(n -> mapToResponseDto(n, viewerId))
                    .toList();

            return CompletableFuture.completedFuture(dtos);
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error fetching user notes for user {}: {}", userId, e.getMessage());
            throw new AppException("Failed to fetch user notes: " + e.getMessage());
        }
    }

    @Override
    @Async("taskExecutor")
    @Transactional
    public CompletableFuture<NoteResponseDto> toggleLikeNote(UUID noteId, UUID userId) {
        try {
            Note note = noteRepository.findById(noteId)
                    .orElseThrow(() -> new ResourceNotFoundException("Note not found with id: " + noteId));
            User liker = userRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

            String uidTag = "," + userId + ",";
            String likedIds = note.getLikedUserIds() != null ? note.getLikedUserIds() : "";
            boolean isCurrentlyLiked = likedIds.contains(uidTag);
            int currentLikes = note.getLikesCount() != null ? note.getLikesCount() : 0;
            boolean nowLiked;

            if (isCurrentlyLiked) {
                likedIds = likedIds.replace(uidTag, ",");
                if (",".equals(likedIds)) likedIds = "";
                note.setLikedUserIds(likedIds);
                note.setLikesCount(Math.max(0, currentLikes - 1));
                nowLiked = false;
            } else {
                if (likedIds.isEmpty() || !likedIds.startsWith(",")) {
                    likedIds = "," + (likedIds.isEmpty() ? "" : likedIds.replaceAll("^,+", ""));
                }
                if (!likedIds.endsWith(",")) {
                    likedIds += ",";
                }
                likedIds += userId + ",";
                note.setLikedUserIds(likedIds);
                note.setLikesCount(currentLikes + 1);
                nowLiked = true;
            }
            Note saved = noteRepository.save(note);

            // Notify note owner if liked and liker is someone else
            if (nowLiked && !note.getUser().getId().equals(userId)) {
                try {
                    notificationService.sendNotification(
                            note.getUser().getId(),
                            userId,
                            "NOTE_LIKE",
                            liker.getDisplayName() + " liked your music note \"" + note.getSongTitle() + "\"",
                            note.getId()
                    );
                } catch (Exception ex) {
                    log.warn("Could not dispatch note like notification: {}", ex.getMessage());
                }
            }

            // Real-time broadcast sync across all active clients
            try {
                Map<String, Object> syncPayload = Map.of(
                        "noteId", note.getId().toString(),
                        "likesCount", saved.getLikesCount(),
                        "savesCount", saved.getSavesCount()
                );
                notificationService.broadcastSilentEvent("NOTE_SYNC", syncPayload);
            } catch (Exception ex) {
                log.warn("Could not broadcast note sync event: {}", ex.getMessage());
            }

            return CompletableFuture.completedFuture(mapToResponseDto(saved, userId));
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error toggling like for note {}: {}", noteId, e.getMessage());
            throw new AppException("Failed to like note: " + e.getMessage());
        }
    }

    @Override
    @Async("taskExecutor")
    @Transactional
    public CompletableFuture<NoteResponseDto> toggleSaveNote(UUID noteId, UUID userId) {
        try {
            Note note = noteRepository.findById(noteId)
                    .orElseThrow(() -> new ResourceNotFoundException("Note not found with id: " + noteId));
            if (!userRepository.existsById(userId)) {
                throw new ResourceNotFoundException("User not found with id: " + userId);
            }

            String uidTag = "," + userId + ",";
            String savedIds = note.getSavedUserIds() != null ? note.getSavedUserIds() : "";
            boolean isCurrentlySaved = savedIds.contains(uidTag);
            int currentSaves = note.getSavesCount() != null ? note.getSavesCount() : 0;
            boolean nowSaved;

            if (isCurrentlySaved) {
                savedIds = savedIds.replace(uidTag, ",");
                if (",".equals(savedIds)) savedIds = "";
                note.setSavedUserIds(savedIds);
                note.setSavesCount(Math.max(0, currentSaves - 1));
                nowSaved = false;
            } else {
                if (savedIds.isEmpty() || !savedIds.startsWith(",")) {
                    savedIds = "," + (savedIds.isEmpty() ? "" : savedIds.replaceAll("^,+", ""));
                }
                if (!savedIds.endsWith(",")) {
                    savedIds += ",";
                }
                savedIds += userId + ",";
                note.setSavedUserIds(savedIds);
                note.setSavesCount(currentSaves + 1);
                nowSaved = true;
            }
            Note saved = noteRepository.save(note);

            // Real-time broadcast sync across all active clients
            try {
                Map<String, Object> syncPayload = Map.of(
                        "noteId", note.getId().toString(),
                        "likesCount", saved.getLikesCount(),
                        "savesCount", saved.getSavesCount()
                );
                notificationService.broadcastSilentEvent("NOTE_SYNC", syncPayload);
            } catch (Exception ex) {
                log.warn("Could not broadcast note sync event: {}", ex.getMessage());
            }

            return CompletableFuture.completedFuture(mapToResponseDto(saved, userId));
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error toggling save for note {}: {}", noteId, e.getMessage());
            throw new AppException("Failed to save note: " + e.getMessage());
        }
    }

    @Override
    @Async("taskExecutor")
    @Transactional
    public CompletableFuture<NoteResponseDto> updateNote(UUID noteId, UUID userId, CreateNoteRequest request) {
        try {
            Note note = noteRepository.findById(noteId)
                    .orElseThrow(() -> new ResourceNotFoundException("Note not found with id: " + noteId));

            if (!note.getUser().getId().equals(userId)) {
                throw new BadRequestException("Unauthorized to update this note");
            }

            if (request.getSongTitle() != null && !request.getSongTitle().isBlank()) {
                note.setSongTitle(request.getSongTitle());
            }
            if (request.getArtistName() != null && !request.getArtistName().isBlank()) {
                note.setArtistName(request.getArtistName());
            }
            if (request.getSongImageUrl() != null && !request.getSongImageUrl().isBlank()) {
                note.setSongImageUrl(request.getSongImageUrl());
            }
            if (request.getExternalSongUrl() != null && !request.getExternalSongUrl().isBlank()) {
                note.setExternalSongUrl(request.getExternalSongUrl());
            }
            if (request.getAudioSnippetStart() != null) {
                note.setAudioSnippetStart(request.getAudioSnippetStart());
            }
            if (request.getCaption() != null) {
                note.setCaption(request.getCaption());
            }
            if (request.getLyricSnippet() != null) {
                note.setLyricSnippet(request.getLyricSnippet());
            }
            if (request.getTemplateType() != null) {
                String upper = request.getTemplateType().toUpperCase();
                String base = upper.contains(":") ? upper.split(":")[0] : upper;
                if (VALID_TEMPLATES.contains(base)) {
                    note.setTemplateType(base);
                }
            }
            if (request.getEmotionTag() != null) {
                note.setEmotionTag(request.getEmotionTag());
            }
            if (request.getStickerBadge() != null) {
                note.setStickerBadge(request.getStickerBadge());
            }
            if (request.getVisibility() != null && VALID_VISIBILITY.contains(request.getVisibility().toUpperCase())) {
                note.setVisibility(request.getVisibility().toUpperCase());
            }

            Note savedNote = noteRepository.save(note);
            return CompletableFuture.completedFuture(mapToResponseDto(savedNote));
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error updating note {}: {}", noteId, e.getMessage());
            throw new AppException("Failed to update note: " + e.getMessage());
        }
    }

    @Override
    @Async("taskExecutor")
    @Transactional
    public CompletableFuture<Void> deleteNote(UUID noteId, UUID userId) {
        try {
            Note note = noteRepository.findById(noteId)
                    .orElseThrow(() -> new ResourceNotFoundException("Note not found with id: " + noteId));

            if (!note.getUser().getId().equals(userId)) {
                throw new BadRequestException("Unauthorized to delete this note");
            }

            noteRepository.delete(note);
            return CompletableFuture.completedFuture(null);
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error deleting note {}: {}", noteId, e.getMessage());
            throw new AppException("Failed to delete note: " + e.getMessage());
        }
    }

    private NoteResponseDto mapToResponseDto(Note note) {
        return mapToResponseDto(note, null);
    }

    private NoteResponseDto mapToResponseDto(Note note, UUID viewerId) {
        boolean isLiked = false;
        boolean isSaved = false;
        if (viewerId != null) {
            String uidTag = "," + viewerId + ",";
            isLiked = note.getLikedUserIds() != null && note.getLikedUserIds().contains(uidTag);
            isSaved = note.getSavedUserIds() != null && note.getSavedUserIds().contains(uidTag);
        }
        return NoteResponseDto.builder()
                .id(note.getId())
                .userId(note.getUser().getId())
                .userDisplayName(note.getUser().getDisplayName())
                .userAvatarUrl(note.getUser().getAvatarUrl())
                .userAudiophileRank(note.getUser().getAudiophileRank())
                .songTitle(note.getSongTitle())
                .artistName(note.getArtistName())
                .songImageUrl(note.getSongImageUrl())
                .externalSongUrl(note.getExternalSongUrl())
                .audioSnippetStart(note.getAudioSnippetStart())
                .caption(note.getCaption())
                .lyricSnippet(note.getLyricSnippet())
                .templateType(note.getTemplateType())
                .emotionTag(note.getEmotionTag())
                .stickerBadge(note.getStickerBadge())
                .visibility(note.getVisibility())
                .likesCount(note.getLikesCount() != null ? note.getLikesCount() : 0)
                .savesCount(note.getSavesCount() != null ? note.getSavesCount() : 0)
                .isLiked(isLiked)
                .isSaved(isSaved)
                .createdAt(note.getCreatedAt())
                .build();
    }
}
