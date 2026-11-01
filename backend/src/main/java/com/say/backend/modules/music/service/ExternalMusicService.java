package com.say.backend.modules.music.service;

import com.say.backend.common.exception.AppException;
import com.say.backend.common.exception.BadRequestException;
import com.say.backend.modules.music.client.ItunesApiClient;
import com.say.backend.modules.music.client.SpotifyApiClient;
import com.say.backend.modules.music.client.YoutubeApiClient;
import com.say.backend.modules.music.dto.TrackSearchResponseDto;
import com.say.backend.modules.note.entity.Note;
import com.say.backend.modules.note.repository.INoteRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CopyOnWriteArrayList;

@Slf4j
@Service
@RequiredArgsConstructor
public class ExternalMusicService implements IExternalMusicService {

    private final SpotifyApiClient spotifyApiClient;
    private final YoutubeApiClient youtubeApiClient;
    private final ItunesApiClient itunesApiClient;
    private final INoteRepository noteRepository;

    // Shared Hot Tracks Pool (Dynamically built from community notes & searches)
    private final List<TrackSearchResponseDto> sharedHotPool = new CopyOnWriteArrayList<>();

    @Override
    public List<TrackSearchResponseDto> getSharedPool() {
        // If pool is empty, dynamically populate from recent public notes created by real users
        if (sharedHotPool.isEmpty()) {
            try {
                List<Note> publicNotes = noteRepository.findByVisibilityOrderByCreatedAtDesc("PUBLIC");
                for (Note n : publicNotes) {
                    if (n.getExternalSongUrl() != null && !n.getExternalSongUrl().isBlank()) {
                        addToSharedPool(TrackSearchResponseDto.builder()
                                .id("note_" + n.getId())
                                .songTitle(n.getSongTitle())
                                .artistName(n.getArtistName())
                                .songImageUrl(n.getSongImageUrl())
                                .externalSongUrl(n.getExternalSongUrl())
                                .durationMs(210000L)
                                .platform("COMMUNITY")
                                .build());
                    }
                    if (sharedHotPool.size() >= 12) break;
                }
            } catch (Exception e) {
                log.warn("Could not load community notes into shared pool: {}", e.getMessage());
            }
        }
        return new ArrayList<>(sharedHotPool);
    }

    @Override
    public void addToSharedPool(TrackSearchResponseDto track) {
        if (track == null || track.getExternalSongUrl() == null || track.getExternalSongUrl().isBlank()) return;
        boolean exists = sharedHotPool.stream()
                .anyMatch(t -> t.getExternalSongUrl().equalsIgnoreCase(track.getExternalSongUrl()));
        if (!exists) {
            if (sharedHotPool.size() >= 25) {
                sharedHotPool.remove(sharedHotPool.size() - 1);
            }
            sharedHotPool.add(0, track);
        }
    }

    @Override
    @Async("taskExecutor")
    public CompletableFuture<List<TrackSearchResponseDto>> searchMusic(String query, String platform) {
        try {
            if (query == null || query.isBlank()) {
                throw new BadRequestException("Query parameter cannot be empty");
            }

            String targetPlatform = (platform != null) ? platform.toUpperCase() : "YOUTUBE";

            if ("SPOTIFY".equals(targetPlatform)) {
                return spotifyApiClient.searchTracks(query);
            }

            if ("ITUNES".equals(targetPlatform)) {
                return itunesApiClient.searchTracks(query);
            }

            // Primary: High-speed YouTube Search
            return youtubeApiClient.searchVideos(query)
                    .thenCompose(ytResults -> {
                        if (ytResults != null && !ytResults.isEmpty() && !ytResults.get(0).getId().equals("yt_fallback")) {
                            addToSharedPool(ytResults.get(0));
                            return CompletableFuture.completedFuture(ytResults);
                        }
                        // Secondary Backup: 100% Free iTunes Search API (Requires 0 keys, unlimited quota)
                        log.info("YouTube search returned empty or fallback, activating free iTunes fallback for '{}'", query);
                        return itunesApiClient.searchTracks(query).thenApply(itunesResults -> {
                            if (!itunesResults.isEmpty()) {
                                addToSharedPool(itunesResults.get(0));
                            }
                            return itunesResults;
                        });
                    })
                    .exceptionallyCompose(ex -> {
                        log.warn("YouTube API call failed ({}), falling back to free iTunes Search API", ex.getMessage());
                        return itunesApiClient.searchTracks(query);
                    });
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error searching external music for query {}: {}", query, e.getMessage());
            throw new AppException("Failed to search external music: " + e.getMessage());
        }
    }
}
