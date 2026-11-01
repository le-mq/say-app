import React from 'react';
import { Outlet } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Navbar from '../components/Navbar';
import PlayerDock from '../components/PlayerDock';
import StudioModal from '../components/StudioModal';

export default function MainLayout() {
  return (
    <div className="min-h-screen bg-[#081724] text-[#E8EEF0] flex flex-col font-sans selection:bg-[#91B9C5] selection:text-[#081724]">
      {/* Persistent Navigation Bar */}
      <Navbar />

      {/* Main Routed Content via Outlet */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Persistent Audio Dock (Never unmounts or interrupts music during page transitions) */}
      <PlayerDock />

      {/* Global Creative Studio Modal */}
      <StudioModal />

      {/* React Toastify Notification Container */}
      <ToastContainer
        position="bottom-right"
        autoClose={3500}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
        toastStyle={{
          backgroundColor: '#142C40',
          color: '#E8EEF0',
          border: '1px solid #31566A',
          borderRadius: '16px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.4)',
        }}
      />
    </div>
  );
}
