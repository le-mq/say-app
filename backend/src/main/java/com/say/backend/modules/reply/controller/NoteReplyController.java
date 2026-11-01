package com.say.backend.modules.reply.controller;

import com.say.backend.common.dto.ApiResponse;
import com.say.backend.modules.reply.dto.CreateReplyRequest;
import com.say.backend.modules.reply.dto.ReplyResponse;
import com.say.backend.modules.reply.service.INoteReplyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

@RestController
@RequestMapping("/replies")
@RequiredArgsConstructor
public class NoteReplyController {

    private final INoteReplyService replyService;

    @PostMapping
    public CompletableFuture<ResponseEntity<ApiResponse<ReplyResponse>>> createReply(
            @RequestBody CreateReplyRequest request
    ) {
        return replyService.createReply(request)
                .thenApply(reply -> ResponseEntity.status(HttpStatus.CREATED)
                        .body(ApiResponse.success("Reply added successfully", reply)));
    }

    @GetMapping("/note/{noteId}")
    public CompletableFuture<ResponseEntity<ApiResponse<List<ReplyResponse>>>> getRepliesByNoteId(
            @PathVariable UUID noteId
    ) {
        return replyService.getRepliesByNoteId(noteId)
                .thenApply(replies -> ResponseEntity.ok(ApiResponse.success("Replies retrieved successfully", replies)));
    }

    @DeleteMapping("/{replyId}")
    public CompletableFuture<ResponseEntity<ApiResponse<Void>>> deleteReply(
            @PathVariable UUID replyId,
            @RequestParam UUID userId
    ) {
        return replyService.deleteReply(replyId, userId)
                .thenApply(unused -> ResponseEntity.ok(ApiResponse.success("Reply deleted successfully", null)));
    }
}
