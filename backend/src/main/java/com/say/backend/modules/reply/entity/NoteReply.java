package com.say.backend.modules.reply.entity;

import com.say.backend.modules.auth.entity.User;
import com.say.backend.modules.note.entity.Note;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(
        name = "note_replies",
        indexes = {
                @Index(name = "idx_note_replies_parent_note_id", columnList = "parent_note_id")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NoteReply {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_note_id", nullable = false)
    private Note parentNote;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "song_title", nullable = false, length = 255)
    private String songTitle;

    @Column(name = "artist_name", nullable = false, length = 255)
    private String artistName;

    @Column(name = "song_image_url", nullable = false, columnDefinition = "TEXT")
    private String songImageUrl;

    @Column(name = "external_song_url", nullable = false, columnDefinition = "TEXT")
    private String externalSongUrl;

    @Column(name = "reply_caption", columnDefinition = "TEXT")
    private String replyCaption;

    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }
}
