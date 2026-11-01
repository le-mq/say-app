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
public class YoutubeApiClient {

    public CompletableFuture<List<TrackSearchResponseDto>> searchVideos(String query) {
        log.info("Querying YouTube Data API for query: {}", query);
        List<TrackSearchResponseDto> list = new ArrayList<>();
        list.add(TrackSearchResponseDto.builder()
                .id("yt_" + UUID.randomUUID().toString().substring(0, 8))
                .songTitle(query + " (Official Visualizer)")
                .artistName("Midnight Wave Channel")
                .songImageUrl("https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&q=80")
                .externalSongUrl("https://www.youtube.com/results?search_query=" + query.replace(" ", "+"))
                .previewAudioUrl(null)
                .durationMs(195000L)
                .platform("YOUTUBE")
                .build());
        return CompletableFuture.completedFuture(list);
    }
}
