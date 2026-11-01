package com.say.backend.modules.music.service;

import com.say.backend.common.exception.AppException;
import com.say.backend.common.exception.BadRequestException;
import com.say.backend.modules.music.client.SpotifyApiClient;
import com.say.backend.modules.music.client.YoutubeApiClient;
import com.say.backend.modules.music.dto.TrackSearchResponseDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CompletableFuture;

@Slf4j
@Service
@RequiredArgsConstructor
public class ExternalMusicService implements IExternalMusicService {

    private final SpotifyApiClient spotifyApiClient;
    private final YoutubeApiClient youtubeApiClient;

    @Override
    @Async("taskExecutor")
    public CompletableFuture<List<TrackSearchResponseDto>> searchMusic(String query, String platform) {
        try {
            if (query == null || query.isBlank()) {
                throw new BadRequestException("Query parameter cannot be empty");
            }

            String targetPlatform = (platform != null) ? platform.toUpperCase() : "ALL";

            if ("YOUTUBE".equals(targetPlatform)) {
                return youtubeApiClient.searchVideos(query);
            } else if ("SPOTIFY".equals(targetPlatform)) {
                return spotifyApiClient.searchTracks(query);
            } else {
                // Combine both
                CompletableFuture<List<TrackSearchResponseDto>> spotifyFuture = spotifyApiClient.searchTracks(query);
                CompletableFuture<List<TrackSearchResponseDto>> youtubeFuture = youtubeApiClient.searchVideos(query);

                return spotifyFuture.thenCombine(youtubeFuture, (spList, ytList) -> {
                    List<TrackSearchResponseDto> combined = new ArrayList<>();
                    combined.addAll(spList);
                    combined.addAll(ytList);
                    return combined;
                });
            }
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error searching external music for query {}: {}", query, e.getMessage());
            throw new AppException("Failed to search external music: " + e.getMessage());
        }
    }
}
