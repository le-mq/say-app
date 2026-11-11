package com.say.backend.modules.note.repository;

import com.say.backend.modules.note.entity.Note;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface INoteRepository extends JpaRepository<Note, UUID> {

    List<Note> findByUserIdOrderByCreatedAtDesc(UUID userId);

    List<Note> findByVisibilityOrderByCreatedAtDesc(String visibility);

    List<Note> findByUserIdAndCreatedAtBetweenOrderByCreatedAtAsc(UUID userId, Instant start, Instant end);

    @Query("""
        SELECT n FROM Note n
        WHERE n.visibility = 'PUBLIC'
           OR (n.visibility = 'FRIENDS_ONLY' AND n.user.id IN :friendUserIds)
           OR (n.user.id = :currentUserId)
        ORDER BY n.createdAt DESC
    """)
    List<Note> findFeedNotes(@Param("currentUserId") UUID currentUserId, @Param("friendUserIds") List<UUID> friendUserIds);

    @Query("""
        SELECT n FROM Note n
        WHERE n.visibility = 'PUBLIC'
           OR (n.user.id = :currentUserId)
        ORDER BY n.createdAt DESC
    """)
    List<Note> findFeedNotesWithoutFriends(@Param("currentUserId") UUID currentUserId);
}
