import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Navbar from '../components/Navbar';
import PlayerDock from '../components/PlayerDock';
import StudioModal from '../components/StudioModal';
import LoginModal from '../components/LoginModal';
import SplashScreen from '../components/SplashScreen';

export default function MainLayout() {
  const location = useLocation();
  const isFeed = location.pathname === '/' || location.pathname === '/feed';

  return (
    <div className={`min-h-screen bg-[#081724] text-[#E8EEF0] flex flex-col font-sans selection:bg-[#91B9C5] selection:text-[#081724] ${
      isFeed ? 'h-screen overflow-hidden' : ''
    }`}>
      {/* Native App Opening Splash Screen */}
      <SplashScreen />

      {/* Persistent Navigation Bar */}
      <Navbar />

      {/* Main Routed Content via Outlet */}
      <main className={`flex-1 ${isFeed ? 'overflow-hidden' : 'pb-24'}`}>
        <Outlet />
      </main>

      {/* Persistent Audio Dock (Never unmounts or interrupts music during page transitions) */}
      <PlayerDock />

      {/* Global Creative Studio Modal */}
      <StudioModal />

      {/* Global Audiophile Login Modal */}
      <LoginModal />


      {/* React Toastify Notification Container (Limited to 1 to prevent toast spam) */}
      <ToastContainer
        position="bottom-right"
        autoClose={2200}
        limit={1}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss={false}
        draggable
        pauseOnHover
        theme="dark"
        toastStyle={{
          backgroundColor: '#142C40',
          color: '#E8EEF0',
          border: '1px solid #31566A',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 10px 25px rgba(0,0,0,0.4)',
        }}
      />
    </div>
  );
}
