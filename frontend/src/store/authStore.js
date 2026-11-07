import { useState, useEffect } from 'react';

const STORAGE_KEY = 'say_vault_public_profile';

// Neutral default: No user is pre-authenticated by default to protect privacy
export const DEFAULT_USER = null;

// Security Sanitizer: Strip out any sensitive fields (email, tokens, passwords)
// Only public presentation attributes are permitted to be cached
function sanitizePublicProfile(user) {
  if (!user) return null;
  const { email, token, idToken, password, ...publicProfile } = user;
  if (publicProfile.username) {
    publicProfile.username = String(publicProfile.username).replace(/^@/, '').toLowerCase().trim();
    publicProfile.handle = `@${publicProfile.username}`;
  } else if (publicProfile.handle) {
    const raw = String(publicProfile.handle).replace(/^@/, '').replace(/[^a-zA-Z0-9_.]/g, '');
    publicProfile.handle = raw ? `@${raw}` : '@listener';
    publicProfile.username = raw || 'listener';
  }
  return publicProfile;
}

function getStoredUser() {
  try {
    // Clean up any legacy sensitive keys from older versions
    localStorage.removeItem('say_vault_user');
    localStorage.removeItem('say_token');

    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.id || String(parsed.id).startsWith('a0000000-')) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch (e) {
    return null;
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
  deleteAccount: () => {
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
    logout: authStore.logout,
    deleteAccount: authStore.deleteAccount,
  };
}
