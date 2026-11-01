package com.say.backend.modules.note.entity;

import com.say.backend.modules.auth.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(
        name = "notes",
        indexes = {
                @Index(name = "idx_notes_user_created_at", columnList = "user_id, created_at")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Note {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

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

    @Builder.Default
    @Column(name = "audio_snippet_start")
    private Integer audioSnippetStart = 0;

    @Column(columnDefinition = "TEXT")
    private String caption;

    @Column(name = "lyric_snippet", columnDefinition = "TEXT")
    private String lyricSnippet;

    @Column(name = "template_type", length = 50)
    private String templateType;

    @Column(name = "emotion_tag", length = 50)
    private String emotionTag;

    @Column(name = "sticker_badge", columnDefinition = "TEXT")
    private String stickerBadge;

    @Builder.Default
    @Column(name = "visibility", nullable = false, length = 20)
    private String visibility = "PUBLIC";

    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
        if (audioSnippetStart == null) {
            audioSnippetStart = 0;
        }
        if (visibility == null) {
            visibility = "PUBLIC";
        }
    }
}
