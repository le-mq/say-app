package com.say.backend.modules.reply.service;

import com.say.backend.modules.reply.dto.CreateReplyRequest;
import com.say.backend.modules.reply.dto.ReplyResponse;

import java.util.List;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

public interface INoteReplyService {

    CompletableFuture<ReplyResponse> createReply(CreateReplyRequest request);

    CompletableFuture<List<ReplyResponse>> getRepliesByNoteId(UUID parentNoteId);

    CompletableFuture<Void> deleteReply(UUID replyId, UUID userId);
}
