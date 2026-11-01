import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function PrivateRoute({ Component }) {
  const token = localStorage.getItem('say_token');
  const { user } = useAuthStore();
  const location = useLocation();

  // User is authenticated if token exists in localStorage or active user exists in authStore
  const isAuthenticated = Boolean(token || user?.id);

  if (!isAuthenticated) {
    // Redirect unauthenticated visitors to the landing discovery page
    return <Navigate to="/landing" state={{ from: location }} replace />;
  }

  return <Component />;
}
