import React from 'react';
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import PrivateRoute from './PrivateRoute';
import Landing from '../pages/Landing';
import Feed from '../pages/Feed';
import Profile from '../pages/Profile';
import Friends from '../pages/Friends';
import NotFound from '../pages/NotFound';

const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      // Protected Community Routes
      { index: true, element: <PrivateRoute Component={Feed} /> },
      { path: 'feed', element: <PrivateRoute Component={Feed} /> },
      { path: 'profile', element: <PrivateRoute Component={Profile} /> },
      { path: 'friends', element: <PrivateRoute Component={Friends} /> },

      // Public Discovery Routes
      { path: 'landing', element: <Landing /> },

      // Error / Fallback Routes
      { path: '404', element: <NotFound /> },
      { path: '*', element: <Navigate to="/404" replace /> },
    ],
  },
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}
