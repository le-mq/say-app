package com.say.backend.modules.music.controller;

import com.say.backend.common.dto.ApiResponse;
import com.say.backend.modules.music.dto.TrackSearchResponseDto;
import com.say.backend.modules.music.service.IExternalMusicService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.concurrent.CompletableFuture;

@RestController
@RequestMapping("/music/search")
@RequiredArgsConstructor
public class MusicSearchController {

    private final IExternalMusicService externalMusicService;

    @GetMapping
    public CompletableFuture<ResponseEntity<ApiResponse<List<TrackSearchResponseDto>>>> searchMusic(
            @RequestParam String query,
            @RequestParam(required = false, defaultValue = "YOUTUBE") String platform
    ) {
        return externalMusicService.searchMusic(query, platform)
                .thenApply(results -> ResponseEntity.ok(ApiResponse.success("Music search results retrieved successfully", results)));
    }

    @GetMapping("/pool")
    public ResponseEntity<ApiResponse<List<TrackSearchResponseDto>>> getSharedMusicPool() {
        return ResponseEntity.ok(ApiResponse.success("Shared music pool retrieved successfully", externalMusicService.getSharedPool()));
    }
}
