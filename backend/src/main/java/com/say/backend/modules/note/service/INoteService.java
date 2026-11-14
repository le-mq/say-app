package com.say.backend.modules.note.service;

import com.say.backend.modules.note.dto.CreateNoteRequest;
import com.say.backend.modules.note.dto.NoteResponseDto;

import java.util.List;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

public interface INoteService {

    CompletableFuture<NoteResponseDto> createNote(CreateNoteRequest request);

    CompletableFuture<NoteResponseDto> getNoteById(UUID noteId);

    CompletableFuture<List<NoteResponseDto>> getPublicFeed();

    CompletableFuture<List<NoteResponseDto>> getPublicFeed(UUID viewerId);

    CompletableFuture<List<NoteResponseDto>> getFriendsFeed(UUID currentUserId);

    CompletableFuture<List<NoteResponseDto>> getUserNotes(UUID userId);

    CompletableFuture<List<NoteResponseDto>> getUserNotes(UUID userId, UUID viewerId);

    CompletableFuture<NoteResponseDto> toggleLikeNote(UUID noteId, UUID userId);

    CompletableFuture<NoteResponseDto> toggleSaveNote(UUID noteId, UUID userId);

    CompletableFuture<NoteResponseDto> updateNote(UUID noteId, UUID userId, CreateNoteRequest request);

    CompletableFuture<Void> deleteNote(UUID noteId, UUID userId);
}
