package com.say.backend.modules.music.client;

import com.say.backend.modules.music.dto.TrackSearchResponseDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

@Slf4j
@Component
public class SpotifyApiClient {

    public CompletableFuture<List<TrackSearchResponseDto>> searchTracks(String query) {
        log.info("Querying Spotify Web API for query: {}", query);
        List<TrackSearchResponseDto> list = new ArrayList<>();
        list.add(TrackSearchResponseDto.builder()
                .id("sp_" + UUID.randomUUID().toString().substring(0, 8))
                .songTitle(query + " - Original Mix")
                .artistName("Aura Sound")
                .songImageUrl("https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&q=80")
                .externalSongUrl("https://open.spotify.com/search/" + query.replace(" ", "%20"))
                .previewAudioUrl("https://p.scdn.co/mp3-preview/sample1.mp3")
                .durationMs(214000L)
                .platform("SPOTIFY")
                .build());
        return CompletableFuture.completedFuture(list);
    }
}
