package com.say.backend.modules.music.client;

import com.fasterxml.jackson.databind.JsonNode;
import com.say.backend.modules.music.dto.TrackSearchResponseDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Component
public class YoutubeApiClient {

    @Value("${youtube.api.key:}")
    private String apiKey;

    private final RestClient restClient = RestClient.create();

    // In-memory cache to save API quota units for 1000 users
    private final Map<String, List<TrackSearchResponseDto>> searchCache = new ConcurrentHashMap<>();
    private final Map<String, TrackSearchResponseDto> videoDetailCache = new ConcurrentHashMap<>();

    /**
     * Search YouTube videos by keyword (Uses in-memory cache to minimize 100-unit search quota cost)
     */
    public CompletableFuture<List<TrackSearchResponseDto>> searchVideos(String query) {
        return CompletableFuture.supplyAsync(() -> {
            if (query == null || query.isBlank()) {
                return List.of();
            }

            String cacheKey = query.trim().toLowerCase();
            if (searchCache.containsKey(cacheKey)) {
                log.info("Serving YouTube search from cache for query: '{}' (Saved 100 API units)", query);
                return searchCache.get(cacheKey);
            }

            log.info("Querying YouTube Data API v3 search for: {}", query);
            List<TrackSearchResponseDto> results = new ArrayList<>();

            try {
                // Highly optimized query: specify fields to minimize payload size and latency
                JsonNode response = restClient.get()
                        .uri("https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=5&q={q}&key={key}&fields=items(id/videoId,snippet(title,channelTitle,thumbnails/medium/url))",
                                query.trim(), apiKey)
                        .retrieve()
                        .body(JsonNode.class);

                if (response != null && response.has("items")) {
                    for (JsonNode item : response.get("items")) {
                        String videoId = item.path("id").path("videoId").asText();
                        JsonNode snippet = item.path("snippet");
                        String title = snippet.path("title").asText();
                        String channelTitle = snippet.path("channelTitle").asText();
                        String thumbnailUrl = snippet.path("thumbnails").path("medium").path("url").asText(
                                "https://img.youtube.com/vi/" + videoId + "/hqdefault.jpg"
                        );

                        // Clean up title (artist - song)
                        String artist = channelTitle;
                        String song = title;
                        if (title.contains(" - ")) {
                            String[] parts = title.split(" - ", 2);
                            artist = parts[0].trim();
                            song = parts[1].replaceAll("(?i)\\((Official|Lyric|Video|Audio).*?\\)", "").trim();
                        }

                        TrackSearchResponseDto dto = TrackSearchResponseDto.builder()
                                .id("yt_" + videoId)
                                .songTitle(song)
                                .artistName(artist)
                                .songImageUrl(thumbnailUrl)
                                .externalSongUrl("https://www.youtube.com/watch?v=" + videoId)
                                .durationMs(210000L) // Default 3:30
                                .platform("YOUTUBE")
                                .build();

                        results.add(dto);
                    }
                }

                // Cache results for future users
                if (!results.isEmpty()) {
                    searchCache.put(cacheKey, results);
                }
            } catch (Exception e) {
                log.warn("YouTube API search call failed ({}), falling back to visualizer stub", e.getMessage());
                results.add(TrackSearchResponseDto.builder()
                        .id("yt_fallback")
                        .songTitle(query)
                        .artistName("YouTube Music")
                        .songImageUrl("https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&q=80")
                        .externalSongUrl("https://www.youtube.com/results?search_query=" + query.replace(" ", "+"))
                        .durationMs(210000L)
                        .platform("YOUTUBE")
                        .build());
            }

            return results;
        });
    }

    /**
     * Direct Video Details Lookup by Video ID (Costs ONLY 1 unit instead of 100 units!)
     */
    public CompletableFuture<TrackSearchResponseDto> getVideoDetails(String videoId) {
        return CompletableFuture.supplyAsync(() -> {
            if (videoId == null || videoId.isBlank()) {
                return null;
            }

            if (videoDetailCache.containsKey(videoId)) {
                return videoDetailCache.get(videoId);
            }

            try {
                JsonNode response = restClient.get()
                        .uri("https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id={id}&key={key}",
                                videoId, apiKey)
                        .retrieve()
                        .body(JsonNode.class);

                if (response != null && response.has("items") && !response.get("items").isEmpty()) {
                    JsonNode item = response.get("items").get(0);
                    JsonNode snippet = item.path("snippet");
                    JsonNode contentDetails = item.path("contentDetails");

                    String title = snippet.path("title").asText();
                    String channel = snippet.path("channelTitle").asText();
                    String thumb = snippet.path("thumbnails").path("high").path("url").asText(
                            "https://img.youtube.com/vi/" + videoId + "/hqdefault.jpg"
                    );

                    long durationMs = 210000L;
                    String isoDuration = contentDetails.path("duration").asText();
                    if (!isoDuration.isBlank()) {
                        try {
                            Duration d = Duration.parse(isoDuration);
                            durationMs = d.toMillis();
                        } catch (Exception ignored) {}
                    }

                    TrackSearchResponseDto dto = TrackSearchResponseDto.builder()
                            .id("yt_" + videoId)
                            .songTitle(title)
                            .artistName(channel)
                            .songImageUrl(thumb)
                            .externalSongUrl("https://www.youtube.com/watch?v=" + videoId)
                            .durationMs(durationMs)
                            .platform("YOUTUBE")
                            .build();

                    videoDetailCache.put(videoId, dto);
                    return dto;
                }
            } catch (Exception e) {
                log.warn("Failed to get YouTube video details: {}", e.getMessage());
            }

            return null;
        });
    }
}
