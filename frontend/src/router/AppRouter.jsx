import React from 'react';
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import PrivateRoute from './PrivateRoute';
import Landing from '../pages/Landing';
import Feed from '../pages/Feed';
import Profile from '../pages/Profile';
import Friends from '../pages/Friends';
import MyUniverse from '../pages/MyUniverse';
import NotFound from '../pages/NotFound';

const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      // Public Feed Routes (Accessible directly to all visitors)
      { index: true, element: <Feed /> },
      { path: 'feed', element: <Feed /> },
      { path: 'universe', element: <PrivateRoute Component={MyUniverse} /> },
      { path: 'my-universe', element: <Navigate to="/universe" replace /> },
      { path: 'profile', element: <PrivateRoute Component={Profile} /> },
      { path: 'friends', element: <PrivateRoute Component={Friends} /> },

      // Legacy Landing Route (Redirected to Feed)
      { path: 'landing', element: <Navigate to="/feed" replace /> },

      // Error / Fallback Routes
      { path: '404', element: <NotFound /> },
      { path: '*', element: <Navigate to="/404" replace /> },
    ],
  },
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}
