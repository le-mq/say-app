import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';
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

      {/* React Toastify Notification Container with Custom Lucide SVG Icons */}
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
        icon={({ type }) => {
          switch (type) {
            case 'success':
              return <CheckCircle2 className="w-4 h-4 text-[#91B9C5] shrink-0" />;
            case 'error':
              return <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />;
            case 'warning':
              return <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />;
            case 'info':
            default:
              return <Info className="w-4 h-4 text-[#91B9C5] shrink-0" />;
          }
        }}
        toastStyle={{
          backgroundColor: '#0a1a29',
          color: '#E8EEF0',
          border: '1px solid #1a3d5b',
          borderRadius: '14px',
          boxShadow: '0 12px 32px rgba(0,0,0,0.6)',
          fontSize: '13px',
          fontFamily: 'Inter, system-ui, sans-serif',
          padding: '12px 16px',
        }}
      />
    </div>
  );
}
