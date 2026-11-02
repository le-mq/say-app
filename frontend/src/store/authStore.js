import { useState, useEffect } from 'react';

const STORAGE_KEY = 'say_vault_public_profile';

// Privacy & Security: Default user contains only non-sensitive public metadata (NO raw emails, NO passwords)
const DEFAULT_USER = {
  id: "a0000000-0000-0000-0000-000000000001",
  displayName: "Linh Tran 🎧",
  handle: "@linhtran",
  avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80",
  bio: "Acoustic archiver & tape bias curator based in Berlin.",
  audiophileRank: "Hi-Fi Master",
  memberId: "#0492",
  streakDays: 14,
  bestStreakDays: 28,
  notesCount: 3,
};

// Security Sanitizer: Strip out any sensitive fields (email, tokens, passwords)
// Only public presentation attributes are permitted to be cached
function sanitizePublicProfile(user) {
  if (!user) return null;
  const { email, token, idToken, password, ...publicProfile } = user;
  if (publicProfile.handle) {
    const raw = String(publicProfile.handle).replace(/^@/, '').replace(/[^a-zA-Z0-9_.]/g, '');
    publicProfile.handle = raw ? `@${raw}` : '@listener';
  }
  return publicProfile;
}

function getStoredUser() {
  try {
    // Clean up any legacy sensitive keys from older versions
    localStorage.removeItem('say_vault_user');
    localStorage.removeItem('say_token');

    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : DEFAULT_USER;
  } catch (e) {
    return DEFAULT_USER;
  }
}

let listeners = [];
let state = {
  user: getStoredUser(),
  activeTab: 'feed',
  isStudioOpen: false,
  isLoginModalOpen: false,
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
    try {
      if (user) {
        const publicOnly = sanitizePublicProfile(user);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(publicOnly));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (e) {}
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
  setLoginModalOpen: (open) => {
    state = { ...state, isLoginModalOpen: open };
    notify();
  },
  loginAsGuest: () => {
    const guestUser = {
      id: "a0000000-0000-0000-0000-000000000002",
      displayName: "Guest Listener 🪐",
      handle: "@guest_listener",
      avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&q=80",
      bio: "Exploring the audiophile atmosphere in guest mode.",
      audiophileRank: "Guest Explorer",
      streakDays: 1,
      bestStreakDays: 1,
      notesCount: 0,
    };
    state = {
      ...state,
      user: guestUser,
      isLoginModalOpen: false,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(guestUser));
    } catch (e) {}
    notify();
  },
  logout: () => {
    state = { ...state, user: null };
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem('say_vault_user');
      localStorage.removeItem('say_token');
      sessionStorage.removeItem('say_session_token');
    } catch (e) {}
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
    setLoginModalOpen: authStore.setLoginModalOpen,
    loginAsGuest: authStore.loginAsGuest,
    logout: authStore.logout,
  };
}
