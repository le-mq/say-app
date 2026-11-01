package com.say.backend.modules.reply.service;

import com.say.backend.common.exception.AppException;
import com.say.backend.common.exception.BadRequestException;
import com.say.backend.common.exception.ResourceNotFoundException;
import com.say.backend.modules.auth.entity.User;
import com.say.backend.modules.auth.repository.IUserRepository;
import com.say.backend.modules.note.entity.Note;
import com.say.backend.modules.note.repository.INoteRepository;
import com.say.backend.modules.reply.dto.CreateReplyRequest;
import com.say.backend.modules.reply.dto.ReplyResponse;
import com.say.backend.modules.reply.entity.NoteReply;
import com.say.backend.modules.reply.repository.INoteReplyRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

@Slf4j
@Service
@RequiredArgsConstructor
public class NoteReplyService implements INoteReplyService {

    private final INoteReplyRepository replyRepository;
    private final INoteRepository noteRepository;
    private final IUserRepository userRepository;

    @Override
    @Async("taskExecutor")
    @Transactional
    public CompletableFuture<ReplyResponse> createReply(CreateReplyRequest request) {
        try {
            if (request.getParentNoteId() == null) {
                throw new BadRequestException("Parent note ID is required");
            }
            if (request.getUserId() == null) {
                throw new BadRequestException("User ID is required");
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

            Note parentNote = noteRepository.findById(request.getParentNoteId())
                    .orElseThrow(() -> new ResourceNotFoundException("Parent note not found with id: " + request.getParentNoteId()));

            User user = userRepository.findById(request.getUserId())
                    .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + request.getUserId()));

            NoteReply reply = NoteReply.builder()
                    .parentNote(parentNote)
                    .user(user)
                    .songTitle(request.getSongTitle())
                    .artistName(request.getArtistName())
                    .songImageUrl(request.getSongImageUrl())
                    .externalSongUrl(request.getExternalSongUrl())
                    .replyCaption(request.getReplyCaption())
                    .build();

            NoteReply savedReply = replyRepository.save(reply);
            return CompletableFuture.completedFuture(mapToResponse(savedReply));
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error creating song reply: {}", e.getMessage());
            throw new AppException("Failed to create song reply: " + e.getMessage());
        }
    }

    @Override
    @Async("taskExecutor")
    @Transactional(readOnly = true)
    public CompletableFuture<List<ReplyResponse>> getRepliesByNoteId(UUID parentNoteId) {
        try {
            if (!noteRepository.existsById(parentNoteId)) {
                throw new ResourceNotFoundException("Note not found with id: " + parentNoteId);
            }

            List<NoteReply> replies = replyRepository.findByParentNoteIdOrderByCreatedAtAsc(parentNoteId);
            List<ReplyResponse> dtos = replies.stream().map(this::mapToResponse).toList();
            return CompletableFuture.completedFuture(dtos);
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error fetching replies for note {}: {}", parentNoteId, e.getMessage());
            throw new AppException("Failed to fetch replies: " + e.getMessage());
        }
    }

    @Override
    @Async("taskExecutor")
    @Transactional
    public CompletableFuture<Void> deleteReply(UUID replyId, UUID userId) {
        try {
            NoteReply reply = replyRepository.findById(replyId)
                    .orElseThrow(() -> new ResourceNotFoundException("Reply not found with id: " + replyId));

            if (!reply.getUser().getId().equals(userId)) {
                throw new BadRequestException("Unauthorized to delete this reply");
            }

            replyRepository.delete(reply);
            return CompletableFuture.completedFuture(null);
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error deleting reply {}: {}", replyId, e.getMessage());
            throw new AppException("Failed to delete reply: " + e.getMessage());
        }
    }

    private ReplyResponse mapToResponse(NoteReply reply) {
        return ReplyResponse.builder()
                .id(reply.getId())
                .parentNoteId(reply.getParentNote().getId())
                .userId(reply.getUser().getId())
                .userDisplayName(reply.getUser().getDisplayName())
                .userAvatarUrl(reply.getUser().getAvatarUrl())
                .userAudiophileRank(reply.getUser().getAudiophileRank())
                .songTitle(reply.getSongTitle())
                .artistName(reply.getArtistName())
                .songImageUrl(reply.getSongImageUrl())
                .externalSongUrl(reply.getExternalSongUrl())
                .replyCaption(reply.getReplyCaption())
                .createdAt(reply.getCreatedAt())
                .build();
    }
}
