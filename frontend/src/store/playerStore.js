import { useState, useEffect, useRef } from 'react';
import { playbackService } from '../services/MusicPlaybackService';

let currentPlaylist = [];

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
  setPlaylist: (notes) => {
    currentPlaylist = Array.isArray(notes) ? notes : [];
  },
  getPlaylist: () => currentPlaylist,
  playNextTrack: () => {
    if (!currentPlaylist || currentPlaylist.length === 0) {
      const snap = playbackService.getSnapshot();
      playbackService.seekTo(snap.duration || 30);
      return;
    }
    const currentTrack = playbackService.getSnapshot().currentTrack;
    const curId = String(currentTrack?.id || '');
    let curIdx = currentPlaylist.findIndex(n => String(n.id) === curId);
    let nextIdx = (curIdx >= 0 ? curIdx + 1 : 0) % currentPlaylist.length;
    const nextNote = currentPlaylist[nextIdx];
    if (nextNote) {
      const start = Number(nextNote.audioSnippetStart ?? 0);
      const dur = Number(nextNote.snippetDuration ?? 30);
      playbackService.playTrack({
        ...nextNote,
        id: String(nextNote.id),
      }, {
        snippetStart: start,
        snippetDuration: dur,
        loop: false,
      });
      window.dispatchEvent(new CustomEvent('say_note_changed', { detail: { noteId: String(nextNote.id) } }));
    }
  },
  playPrevTrack: () => {
    if (!currentPlaylist || currentPlaylist.length === 0) {
      playbackService.seekTo(0);
      return;
    }
    const currentTrack = playbackService.getSnapshot().currentTrack;
    const curId = String(currentTrack?.id || '');
    let curIdx = currentPlaylist.findIndex(n => String(n.id) === curId);
    let prevIdx = curIdx > 0 ? curIdx - 1 : currentPlaylist.length - 1;
    const prevNote = currentPlaylist[prevIdx];
    if (prevNote) {
      const start = Number(prevNote.audioSnippetStart ?? 0);
      const dur = Number(prevNote.snippetDuration ?? 30);
      playbackService.playTrack({
        ...prevNote,
        id: String(prevNote.id),
      }, {
        snippetStart: start,
        snippetDuration: dur,
        loop: false,
      });
      window.dispatchEvent(new CustomEvent('say_note_changed', { detail: { noteId: String(prevNote.id) } }));
    }
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
  setSnippetDuration: (duration) => {
    playbackService.setSnippetDuration(duration);
  },
};

export function usePlayerStore(selector = (s) => s) {
  const [selectedState, setSelectedState] = useState(() => selector(playerStore.getState()));
  const selectorRef = useRef(selector);
  selectorRef.current = selector;
  const prevStateRef = useRef(selectedState);

  useEffect(() => {
    const unsubscribe = playerStore.subscribe((newFullState) => {
      const nextSelected = selectorRef.current(newFullState);
      const prev = prevStateRef.current;
      let hasChanged = false;
      if (typeof nextSelected !== 'object' || nextSelected === null) {
        hasChanged = nextSelected !== prev;
      } else {
        const prevKeys = Object.keys(prev || {});
        const nextKeys = Object.keys(nextSelected);
        if (prevKeys.length !== nextKeys.length) {
          hasChanged = true;
        } else {
          for (const key of nextKeys) {
            if (prev[key] !== nextSelected[key]) {
              hasChanged = true;
              break;
            }
          }
        }
      }

      if (hasChanged) {
        prevStateRef.current = nextSelected;
        setSelectedState(nextSelected);
      }
    });
    return unsubscribe;
  }, []);

  return {
    ...selectedState,
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
    playNextTrack: playerStore.playNextTrack,
    playPrevTrack: playerStore.playPrevTrack,
    setPlaylist: playerStore.setPlaylist,
    setSnippetDuration: playerStore.setSnippetDuration,
  };
}
