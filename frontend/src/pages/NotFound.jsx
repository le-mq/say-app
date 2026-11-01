import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Disc3, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center text-center px-4">
      <div className="w-24 h-24 rounded-full bg-[#142C40] border-2 border-[#91B9C5]/40 flex items-center justify-center mb-6 shadow-2xl">
        <Disc3 className="w-12 h-12 text-[#91B9C5] animate-spin-slow" />
      </div>

      <span className="text-xs font-mono uppercase tracking-widest text-[#B39DDB] mb-2 block">
        Error 404 • Track Not Found
      </span>

      <h1 className="text-3xl sm:text-4xl font-extrabold text-[#E8EEF0] mb-3">
        Out of Frequency
      </h1>

      <p className="text-xs sm:text-sm text-[#91B9C5]/80 max-w-md mb-8">
        The needle slipped off the record. The sound note or frequency you are looking for does not exist in the SAY universe.
      </p>

      <button
        onClick={() => navigate('/feed')}
        className="flex items-center gap-2 bg-[#91B9C5] hover:bg-[#B39DDB] text-[#081724] font-bold text-xs px-5 py-3 rounded-2xl shadow-lg transition-transform hover:scale-105"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Sound Stream</span>
      </button>
    </div>
  );
}
