package com.say.backend.modules.music.client;

import com.fasterxml.jackson.databind.JsonNode;
import com.say.backend.modules.music.dto.TrackSearchResponseDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 100% Free, Unlimited Fallback Music Provider (iTunes Search API)
 * Requires ZERO API keys, never runs out of quota, and provides official 30s preview MP3s.
 */
@Slf4j
@Component
public class ItunesApiClient {

    private final RestClient restClient = RestClient.create();
    private final Map<String, List<TrackSearchResponseDto>> itunesCache = new ConcurrentHashMap<>();

    public CompletableFuture<List<TrackSearchResponseDto>> searchTracks(String query) {
        return CompletableFuture.supplyAsync(() -> {
            if (query == null || query.isBlank()) {
                return List.of();
            }

            String cacheKey = query.trim().toLowerCase();
            if (itunesCache.containsKey(cacheKey)) {
                log.info("Serving iTunes search from cache for query: '{}'", query);
                return itunesCache.get(cacheKey);
            }

            List<TrackSearchResponseDto> results = new ArrayList<>();
            try {
                log.info("Querying iTunes Free Search API for: '{}'", query);
                JsonNode response = restClient.get()
                        .uri("https://itunes.apple.com/search?term={term}&entity=song&limit=6", query.trim())
                        .retrieve()
                        .body(JsonNode.class);

                if (response != null && response.has("results")) {
                    for (JsonNode item : response.get("results")) {
                        long trackId = item.path("trackId").asLong();
                        String songTitle = item.path("trackName").asText("Unknown Track");
                        String artistName = item.path("artistName").asText("Unknown Artist");
                        String rawArtwork = item.path("artworkUrl100").asText("");
                        // Upgrade to high-resolution 600x600 album artwork
                        String highResArtwork = rawArtwork.replace("100x100bb", "600x600bb");
                        String previewAudioUrl = item.path("previewUrl").asText("");
                        String externalUrl = item.path("trackViewUrl").asText("");
                        long durationMs = item.path("trackTimeMillis").asLong(210000L);

                        results.add(TrackSearchResponseDto.builder()
                                .id("itunes_" + trackId)
                                .songTitle(songTitle)
                                .artistName(artistName)
                                .songImageUrl(highResArtwork)
                                .externalSongUrl(externalUrl)
                                .previewAudioUrl(previewAudioUrl)
                                .durationMs(durationMs)
                                .platform("ITUNES")
                                .build());
                    }
                }

                if (!results.isEmpty()) {
                    itunesCache.put(cacheKey, results);
                }
            } catch (Exception e) {
                log.warn("iTunes search failed for '{}': {}", query, e.getMessage());
            }

            return results;
        });
    }
}
