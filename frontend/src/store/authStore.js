import { useState, useEffect } from 'react';

let listeners = [];
let state = {
  user: {
    id: "a0000000-0000-0000-0000-000000000001",
    email: "audiophile@say.fm",
    displayName: "Sonic Wanderer",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80",
    bio: "Living between analog vinyl crackles and ethereal ambient waves.",
    audiophileRank: "Vinyl Connoisseur",
  },
  activeTab: 'feed', // 'feed', 'profile', 'friends', 'landing'
  isStudioOpen: false,
};

function notify() {
  listeners.forEach(fn => fn(state));
}

export const authStore = {
  getState: () => state,
  subscribe: (listener) => {
    listeners.push(listener);
    return () => {
      listeners = listeners.filter(l => l !== listener);
    };
  },
  setUser: (user) => {
    state = { ...state, user };
    notify();
  },
  setActiveTab: (tab) => {
    state = { ...state, activeTab: tab };
    notify();
  },
  setStudioOpen: (open) => {
    state = { ...state, isStudioOpen: open };
    notify();
  },
};

export function useAuthStore() {
  const [snapshot, setSnapshot] = useState(authStore.getState());

  useEffect(() => {
    const unsubscribe = authStore.subscribe(setSnapshot);
    return unsubscribe;
  }, []);

  return {
    ...snapshot,
    setUser: authStore.setUser,
    setActiveTab: authStore.setActiveTab,
    setStudioOpen: authStore.setStudioOpen,
  };
}
