import { useState, useEffect } from 'react';
import { playbackService } from '../services/MusicPlaybackService';

export const playerStore = {
  getState: () => {
    const snap = playbackService.getSnapshot();
    return {
      currentTrack: snap.currentTrack,
      isPlaying: snap.isPlaying,
      isBuffering: snap.isBuffering,
      currentTime: snap.currentTime,
      duration: snap.duration,
      playbackState: snap.playbackState,
      sourceType: snap.sourceType,
      errorMessage: snap.errorMessage,
      volume: snap.volume ?? 0.85,
      isMuted: snap.isMuted ?? false,
    };
  },
  subscribe: (listener) => {
    return playbackService.subscribe((snap) => {
      listener({
        currentTrack: snap.currentTrack,
        isPlaying: snap.isPlaying,
        isBuffering: snap.isBuffering,
        currentTime: snap.currentTime,
        duration: snap.duration,
        playbackState: snap.playbackState,
        sourceType: snap.sourceType,
        errorMessage: snap.errorMessage,
        isLooping: snap.isLooping,
        volume: snap.volume ?? 0.85,
        isMuted: snap.isMuted ?? false,
      });
    });
  },
  loadTrack: (track, options = null) => {
    const opts = typeof options === 'number' 
      ? { snippetStart: options } 
      : (options || { snippetStart: Number(track?.audioSnippetStart) || 0, snippetDuration: Number(track?.snippetDuration) || 30 });
    playbackService.loadTrack(track, opts);
  },
  playTrack: (track, options = null) => {
    const opts = typeof options === 'number' 
      ? { snippetStart: options } 
      : (options || { snippetStart: Number(track?.audioSnippetStart) || 0, snippetDuration: Number(track?.snippetDuration) || 30, loop: true });
    playbackService.playTrack(track, opts);
  },
  setLooping: (loop) => {
    playbackService.setLooping(loop);
  },
  setVolume: (vol) => {
    playbackService.setVolume(vol);
  },
  toggleMute: () => {
    playbackService.toggleMute();
  },
  togglePlay: () => {
    playbackService.togglePlay();
  },
  pauseTrack: () => {
    playbackService.pause();
  },
  stopTrack: () => {
    playbackService.stop();
  },
  seekTo: (seconds) => {
    playbackService.seekTo(seconds);
  },
  seekSnippet: (startSec, duration, autoPlay = null) => {
    playbackService.seekSnippet(startSec, duration, autoPlay);
  },
};

export function usePlayerStore() {
  const [snapshot, setSnapshot] = useState(playerStore.getState());

  useEffect(() => {
    const unsubscribe = playerStore.subscribe(setSnapshot);
    return unsubscribe;
  }, []);

  return {
    ...snapshot,
    loadTrack: playerStore.loadTrack,
    playTrack: playerStore.playTrack,
    togglePlay: playerStore.togglePlay,
    pauseTrack: playerStore.pauseTrack,
    stopTrack: playerStore.stopTrack,
    seekTo: playerStore.seekTo,
    seekSnippet: playerStore.seekSnippet,
    setLooping: playerStore.setLooping,
    setVolume: playerStore.setVolume,
    toggleMute: playerStore.toggleMute,
  };
}
