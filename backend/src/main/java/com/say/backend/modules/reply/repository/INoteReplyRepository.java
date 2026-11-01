package com.say.backend.modules.reply.repository;

import com.say.backend.modules.reply.entity.NoteReply;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface INoteReplyRepository extends JpaRepository<NoteReply, UUID> {

    List<NoteReply> findByParentNoteIdOrderByCreatedAtAsc(UUID parentNoteId);

    long countByParentNoteId(UUID parentNoteId);
}
