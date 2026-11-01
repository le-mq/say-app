package com.say.backend.modules.note.service;

import com.say.backend.common.exception.AppException;
import com.say.backend.common.exception.BadRequestException;
import com.say.backend.common.exception.ResourceNotFoundException;
import com.say.backend.modules.auth.entity.User;
import com.say.backend.modules.auth.repository.IUserRepository;
import com.say.backend.modules.note.dto.CreateNoteRequest;
import com.say.backend.modules.note.dto.NoteResponseDto;
import com.say.backend.modules.note.entity.Note;
import com.say.backend.modules.note.repository.INoteRepository;
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

    private static final Set<String> VALID_TEMPLATES = Set.of("RECEIPTIFY", "CASSETTE", "STAMP", "VINYL");
    private static final Set<String> VALID_VISIBILITY = Set.of("PUBLIC", "FRIENDS_ONLY");

    private final INoteRepository noteRepository;
    private final IUserRepository userRepository;
    private final IFriendshipRepository friendshipRepository;

    @Override
    @Async("taskExecutor")
    @Transactional
    public CompletableFuture<NoteResponseDto> createNote(CreateNoteRequest request) {
        try {
            if (request.getUserId() == null) {
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

            if (request.getTemplateType() != null && !VALID_TEMPLATES.contains(request.getTemplateType().toUpperCase())) {
                throw new BadRequestException("Invalid template type: " + request.getTemplateType());
            }

            if (request.getVisibility() != null && !VALID_VISIBILITY.contains(request.getVisibility().toUpperCase())) {
                throw new BadRequestException("Invalid visibility type: " + request.getVisibility());
            }

            User user = userRepository.findById(request.getUserId())
                    .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + request.getUserId()));

            Note note = Note.builder()
                    .user(user)
                    .songTitle(request.getSongTitle())
                    .artistName(request.getArtistName())
                    .songImageUrl(request.getSongImageUrl())
                    .externalSongUrl(request.getExternalSongUrl())
                    .audioSnippetStart(request.getAudioSnippetStart() != null ? request.getAudioSnippetStart() : 0)
                    .caption(request.getCaption())
                    .lyricSnippet(request.getLyricSnippet())
                    .templateType(request.getTemplateType() != null ? request.getTemplateType().toUpperCase() : "RECEIPTIFY")
                    .emotionTag(request.getEmotionTag())
                    .stickerBadge(request.getStickerBadge())
                    .visibility(request.getVisibility() != null ? request.getVisibility().toUpperCase() : "PUBLIC")
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
        try {
            List<Note> notes = noteRepository.findByVisibilityOrderByCreatedAtDesc("PUBLIC");
            List<NoteResponseDto> dtos = notes.stream().map(this::mapToResponseDto).toList();
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
                feedNotes = noteRepository.findByVisibilityOrderByCreatedAtDesc("PUBLIC");
            } else {
                feedNotes = noteRepository.findFeedNotes(currentUserId, friendIds);
            }

            List<NoteResponseDto> dtos = feedNotes.stream().map(this::mapToResponseDto).toList();
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
        try {
            if (!userRepository.existsById(userId)) {
                throw new ResourceNotFoundException("User not found with id: " + userId);
            }
            List<Note> notes = noteRepository.findByUserIdOrderByCreatedAtDesc(userId);
            List<NoteResponseDto> dtos = notes.stream().map(this::mapToResponseDto).toList();
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
            if (request.getTemplateType() != null && VALID_TEMPLATES.contains(request.getTemplateType().toUpperCase())) {
                note.setTemplateType(request.getTemplateType().toUpperCase());
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
                .createdAt(note.getCreatedAt())
                .build();
    }
}
