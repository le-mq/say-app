package com.say.backend.modules.note.controller;

import com.say.backend.common.dto.ApiResponse;
import com.say.backend.modules.note.dto.CreateNoteRequest;
import com.say.backend.modules.note.dto.NoteResponseDto;
import com.say.backend.modules.note.service.INoteService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

@RestController
@RequestMapping("/notes")
@RequiredArgsConstructor
public class NoteController {

    private final INoteService noteService;

    @PostMapping
    public CompletableFuture<ResponseEntity<ApiResponse<NoteResponseDto>>> createNote(
            @RequestBody CreateNoteRequest request
    ) {
        return noteService.createNote(request)
                .thenApply(note -> ResponseEntity.status(HttpStatus.CREATED)
                        .body(ApiResponse.success("Note created successfully", note)));
    }

    @GetMapping("/{noteId}")
    public CompletableFuture<ResponseEntity<ApiResponse<NoteResponseDto>>> getNoteById(
            @PathVariable UUID noteId
    ) {
        return noteService.getNoteById(noteId)
                .thenApply(note -> ResponseEntity.ok(ApiResponse.success(note)));
    }

    @GetMapping("/feed/public")
    public CompletableFuture<ResponseEntity<ApiResponse<List<NoteResponseDto>>>> getPublicFeed() {
        return noteService.getPublicFeed()
                .thenApply(notes -> ResponseEntity.ok(ApiResponse.success("Public feed retrieved successfully", notes)));
    }

    @GetMapping("/feed/friends")
    public CompletableFuture<ResponseEntity<ApiResponse<List<NoteResponseDto>>>> getFriendsFeed(
            @RequestParam UUID userId
    ) {
        return noteService.getFriendsFeed(userId)
                .thenApply(notes -> ResponseEntity.ok(ApiResponse.success("Friends feed retrieved successfully", notes)));
    }

    @GetMapping("/user/{userId}")
    public CompletableFuture<ResponseEntity<ApiResponse<List<NoteResponseDto>>>> getUserNotes(
            @PathVariable UUID userId
    ) {
        return noteService.getUserNotes(userId)
                .thenApply(notes -> ResponseEntity.ok(ApiResponse.success("User notes retrieved successfully", notes)));
    }

    @PutMapping("/{noteId}")
    public CompletableFuture<ResponseEntity<ApiResponse<NoteResponseDto>>> updateNote(
            @PathVariable UUID noteId,
            @RequestParam UUID userId,
            @RequestBody CreateNoteRequest request
    ) {
        return noteService.updateNote(noteId, userId, request)
                .thenApply(note -> ResponseEntity.ok(ApiResponse.success("Note updated successfully", note)));
    }

    @DeleteMapping("/{noteId}")
    public CompletableFuture<ResponseEntity<ApiResponse<Void>>> deleteNote(
            @PathVariable UUID noteId,
            @RequestParam UUID userId
    ) {
        return noteService.deleteNote(noteId, userId)
                .thenApply(unused -> ResponseEntity.ok(ApiResponse.success("Note deleted successfully", null)));
    }
}
