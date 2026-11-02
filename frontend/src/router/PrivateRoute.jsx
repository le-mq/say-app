import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore, authStore } from '../store/authStore';

export default function PrivateRoute({ Component }) {
  const token = sessionStorage.getItem('say_session_token');
  const { user } = useAuthStore();
  const location = useLocation();

  // User is authenticated if active session token exists or active user id exists in authStore
  const isAuthenticated = Boolean(token || user?.id);

  if (!isAuthenticated) {
    // Open login modal and redirect to main feed
    setTimeout(() => authStore.setLoginModalOpen(true), 120);
    return <Navigate to="/feed" state={{ from: location }} replace />;
  }

  return <Component />;
}

