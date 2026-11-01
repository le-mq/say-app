import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Disc3, Music2, Users, PlusCircle, Compass } from 'lucide-react';

export default function Navbar() {
  const { user, setStudioOpen } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const currentPath = location.pathname;

  return (
    <header className="sticky top-0 z-40 bg-[#081724]/90 backdrop-blur-md border-b border-[#31566A]/40 transition-colors">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        
        {/* Brand */}
        <div 
          onClick={() => navigate('/feed')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#142C40] to-[#31566A] border border-[#91B9C5]/30 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
            <Disc3 className="w-6 h-6 text-[#91B9C5] animate-spin-slow group-hover:text-white" />
          </div>
          <div>
            <span className="font-extrabold text-xl tracking-wider text-[#E8EEF0] group-hover:text-[#91B9C5] transition-colors">
              SAY
            </span>
            <span className="text-[10px] block font-mono text-[#91B9C5]/80 uppercase tracking-widest">
              Sound Around You
            </span>
          </div>
        </div>

        {/* Navigation Tabs using React Router DOM */}
        <nav className="hidden md:flex items-center gap-1 bg-[#142C40]/60 p-1.5 rounded-2xl border border-[#31566A]/30">
          <button
            onClick={() => navigate('/feed')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all ${
              currentPath === '/' || currentPath.startsWith('/feed')
                ? 'bg-[#31566A] text-[#E8EEF0] shadow-md'
                : 'text-[#91B9C5]/80 hover:text-white hover:bg-[#142C40]'
            }`}
          >
            <Music2 className="w-4 h-4" />
            Feed
          </button>

          <button
            onClick={() => navigate('/profile')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all ${
              currentPath.startsWith('/profile')
                ? 'bg-[#31566A] text-[#E8EEF0] shadow-md'
                : 'text-[#91B9C5]/80 hover:text-white hover:bg-[#142C40]'
            }`}
          >
            <Disc3 className="w-4 h-4" />
            Sonic Streak
          </button>

          <button
            onClick={() => navigate('/friends')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all ${
              currentPath.startsWith('/friends')
                ? 'bg-[#31566A] text-[#E8EEF0] shadow-md'
                : 'text-[#91B9C5]/80 hover:text-white hover:bg-[#142C40]'
            }`}
          >
            <Users className="w-4 h-4" />
            Friends
          </button>

          <button
            onClick={() => navigate('/landing')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all ${
              currentPath.startsWith('/landing')
                ? 'bg-[#31566A] text-[#E8EEF0] shadow-md'
                : 'text-[#91B9C5]/80 hover:text-white hover:bg-[#142C40]'
            }`}
            title="Discovery & Concept"
          >
            <Compass className="w-4 h-4" />
            Discovery
          </button>
        </nav>

        {/* Right CTA & User */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setStudioOpen(true)}
            className="flex items-center gap-2 bg-[#91B9C5] hover:bg-[#B39DDB] text-[#081724] font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg transition-all hover:scale-105"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Drop Note</span>
          </button>

          {user && (
            <div 
              onClick={() => navigate('/profile')}
              className="flex items-center gap-2.5 pl-2 border-l border-[#31566A]/40 cursor-pointer"
            >
              <img
                src={user.avatarUrl}
                alt={user.displayName}
                className="w-9 h-9 rounded-full object-cover ring-2 ring-[#91B9C5]/40"
              />
              <div className="hidden lg:block text-left">
                <p className="text-xs font-semibold text-[#E8EEF0] leading-none">{user.displayName}</p>
                <span className="text-[10px] text-[#91B9C5] font-mono leading-tight">{user.audiophileRank}</span>
              </div>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}
