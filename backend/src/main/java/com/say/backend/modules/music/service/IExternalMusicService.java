package com.say.backend.modules.music.service;

import com.say.backend.modules.music.dto.TrackSearchResponseDto;

import java.util.List;
import java.util.concurrent.CompletableFuture;

public interface IExternalMusicService {

    CompletableFuture<List<TrackSearchResponseDto>> searchMusic(String query, String platform);
}
