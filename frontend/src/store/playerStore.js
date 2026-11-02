import { useState, useEffect } from 'react';

let listeners = [];
let state = {
  currentTrack: null,
  isPlaying: false,
  currentTime: 0,
};

function notify() {
  listeners.forEach(fn => fn(state));
}

export const playerStore = {
  getState: () => state,
  subscribe: (listener) => {
    listeners.push(listener);
    return () => {
      listeners = listeners.filter(l => l !== listener);
    };
  },
  loadTrack: (track, snippetStart = 0) => {
    state = {
      ...state,
      currentTrack: { ...track, snippetStart },
      isPlaying: false,
      currentTime: snippetStart,
    };
    notify();
  },
  playTrack: (track, snippetStart = 0) => {
    state = {
      ...state,
      currentTrack: { ...track, snippetStart },
      isPlaying: true,
      currentTime: snippetStart,
    };
    notify();
  },
  togglePlay: () => {
    if (!state.currentTrack) return;
    state = { ...state, isPlaying: !state.isPlaying };
    notify();
  },
  pauseTrack: () => {
    state = { ...state, isPlaying: false };
    notify();
  },
  stopTrack: () => {
    state = { ...state, currentTrack: null, isPlaying: false, currentTime: 0 };
    notify();
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
  };
}

