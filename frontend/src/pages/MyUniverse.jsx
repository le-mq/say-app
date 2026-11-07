import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { usePlayerStore } from '../store/playerStore';
import { noteService } from '../services/noteService';
import AudioConstellation from '../universe/AudioConstellation';
import MemoryTimeline from '../universe/MemoryTimeline';
import MemoryShuffle from '../universe/MemoryShuffle';
import StardustCapsules from '../universe/StardustCapsules';
import StreakCalendar from '../universe/StreakCalendar';
import { formatTimeDetails } from '../utils/timeFormat';
import {
  Sparkles, Clock, Compass, Disc, Play, Pause, Plus, X,
  ExternalLink, Calendar, Music, Lock, Heart, Share2, Layers
} from 'lucide-react';
import { toast } from 'react-toastify';

export default function MyUniverse() {
  const { user, setUser, setStudioOpen } = useAuthStore();
  const { currentTrack, isPlaying, playTrack, togglePlay } = usePlayerStore();
  const [searchParams] = useSearchParams();

  // Mode: Synchronized seamlessly with Navbar query parameter ('CONSTELLATION' | 'TIMELINE')
  const viewMode = (searchParams.get('view') || 'constellation').toUpperCase();
  const [notes, setNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedNote, setSelectedNote] = useState(null);

  // Fetch real personal universe notes from backend (No mock fixtures, strictly current user's notes)
  useEffect(() => {
    let isMounted = true;

    async function fetchUniverseNotes() {
      setIsLoading(true);
      try {
        const targetUserId = user?.id;
        if (!targetUserId) {
          if (isMounted) {
            setNotes([]);
            setIsLoading(false);
          }
          return;
        }

        let userNotes = [];
        try {
          const res = await noteService.getUserNotes(targetUserId);
          userNotes = Array.isArray(res) ? res : (res?.data?.data || res?.data || []);
        } catch (e) {
          console.warn('Failed to load user universe notes:', e);
        }

        if (isMounted) {
          setNotes(Array.isArray(userNotes) ? userNotes : []);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Failed to fetch personal notes from database:', err);
        if (isMounted) {
          setNotes([]);
          setIsLoading(false);
        }
      }
    }

    fetchUniverseNotes();

    const handleCreated = (e) => {
      const newNote = e.detail;
      if (newNote) {
        setNotes((prev) => [newNote, ...prev.filter(n => String(n.id) !== String(newNote.id))]);
      } else {
        fetchUniverseNotes();
      }
    };
    window.addEventListener('say_note_created', handleCreated);

    return () => {
      isMounted = false;
      window.removeEventListener('say_note_created', handleCreated);
    };
  }, [user]);

  // Handle playing snippet in GlobalPlayerDock
  const handlePlayNote = (note) => {
    if (!note) return;

    if (currentTrack?.id === note.id) {
      togglePlay();
      return;
    }

    playTrack({
      id: note.id,
      songTitle: note.songTitle,
      artistName: note.artistName,
      externalSongUrl: note.externalSongUrl,
      songImageUrl: note.songImageUrl,
      audioSnippetStart: note.audioSnippetStart || 0,
      audioSnippetEnd: (note.audioSnippetStart || 0) + 30,
      templateType: note.templateType,
      emotionTag: note.emotionTag,
    });
  };

  return (
    <div className="w-full min-h-screen bg-[#071523] text-[#E8EEF0] selection:bg-[#91B9C5] selection:text-[#071523]">
      
      {/* MAIN WORKSPACE CONTENT (Full vertical height dedicated to Celestial Map) */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-12 space-y-10">
        
        {/* SECTION A: AUDIO CONSTELLATION & MEMORY TIMELINE */}
        <section className="space-y-4">
          {/* Active View Container */}
          {viewMode === 'CONSTELLATION' ? (
            <AudioConstellation
              notes={notes}
              activeNoteId={currentTrack?.id}
              isPlaying={isPlaying}
              onSelectNote={(note) => setSelectedNote(note)}
              onPlayNote={handlePlayNote}
              onCreateNote={() => setStudioOpen(true)}
            />
          ) : (
            <MemoryTimeline
              notes={notes}
              activeNoteId={currentTrack?.id}
              isPlaying={isPlaying}
              onSelectNote={(note) => setSelectedNote(note)}
              onPlayNote={handlePlayNote}
              onCreateNote={() => setStudioOpen(true)}
            />
          )}
        </section>

        {/* SECTION B & C: NOSTALGIC MEMORY SHUFFLE & STREAK CALENDAR SIDE-BY-SIDE */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left Column: Nostalgic Memory Shuffle (~41% on desktop) */}
          <div className="lg:col-span-5 flex flex-col space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <h2 className="text-sm sm:text-base font-serif font-bold text-[#E8EEF0] uppercase tracking-wider">
                Nostalgic Memory Shuffle
              </h2>
            </div>
            <div className="flex-1">
              <MemoryShuffle
                notes={notes}
                activeNoteId={currentTrack?.id}
                isPlaying={isPlaying}
                onPlayNote={handlePlayNote}
                onSelectNote={(note) => setSelectedNote(note)}
              />
            </div>
          </div>

          {/* Right Column: Auditory Streak Calendar (~59% on desktop for larger, clearer tiles) */}
          <div className="lg:col-span-7 flex flex-col space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <h2 className="text-sm sm:text-base font-serif font-bold text-[#E8EEF0] uppercase tracking-wider">
                Auditory Habit Streak
              </h2>
            </div>
            <div className="flex-1">
              <StreakCalendar
                userId={user?.id}
                userNotes={notes}
                activeNoteId={currentTrack?.id}
                onPlayNote={handlePlayNote}
                onSelectNote={(note) => setSelectedNote(note)}
              />
            </div>
          </div>
        </section>

        {/* SECTION D: STARDUST CAPSULES (Paginated & Chapter 12.2 DTO Masking Compliant) */}
        <section className="space-y-4">
          <StardustCapsules
            userId={user?.id}
            activeNoteId={currentTrack?.id}
            isPlaying={isPlaying}
            onPlayNote={handlePlayNote}
          />
        </section>

      </div>

      {/* 3. NOTE DETAIL MODAL (Triggered when user clicks a constellation star or timeline item) */}
      {selectedNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in select-text">
          <div className="relative w-full max-w-lg rounded-3xl bg-[#091e30] border border-[#1b466d] p-6 shadow-2xl space-y-5">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setSelectedNote(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-[#91B9C5] hover:text-white hover:bg-[#122e47] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Note Header & Badge */}
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-[#102d47] text-cyan-300 border border-cyan-500/30">
                ✦ {selectedNote.templateType || 'NOTE'} STAR
              </span>
              <span className="text-xs font-mono text-[#91B9C5]/80 flex items-center gap-1.5 bg-[#071726] px-2.5 py-1 rounded-lg border border-[#14324c]">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                <span>{formatTimeDetails(selectedNote.createdAt).full}</span>
              </span>
            </div>

            {/* Main Visual & Audio Row (Clean, unobstructed album cover) */}
            <div className="flex items-center gap-4 p-3.5 rounded-2xl bg-[#061421] border border-[#143552]">
              <div className={`relative w-20 h-20 rounded-xl overflow-hidden border shrink-0 bg-[#081724] transition-all shadow-md ${
                currentTrack?.id === selectedNote.id && isPlaying ? 'border-cyan-400 ring-2 ring-cyan-400/40 shadow-cyan-950/60' : 'border-[#204c75]'
              }`}>
                <img
                  src={selectedNote.songImageUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200'}
                  alt={selectedNote.songTitle}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1 min-w-0 space-y-1">
                <h3 className="font-bold text-sm sm:text-base text-[#E8EEF0] truncate select-text">
                  {selectedNote.songTitle}
                </h3>
                <p className="text-xs text-[#91B9C5] font-medium truncate select-text">
                  {selectedNote.artistName}
                </p>
                {selectedNote.emotionTag && (
                  <span className="inline-block text-[10px] text-amber-200/90 font-medium">
                    {selectedNote.emotionTag}
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => handlePlayNote(selectedNote)}
                className={`p-3 rounded-2xl transition-all shadow-md shrink-0 cursor-pointer ${
                  currentTrack?.id === selectedNote.id && isPlaying
                    ? 'bg-cyan-400 text-[#081827] shadow-[0_0_16px_rgba(34,211,238,0.4)]'
                    : 'bg-[#153a59] hover:bg-[#1d4d75] text-cyan-300 border border-[#23537e]'
                }`}
                title={currentTrack?.id === selectedNote.id && isPlaying ? 'Pause Snippet' : 'Play Snippet'}
              >
                {currentTrack?.id === selectedNote.id && isPlaying ? (
                  <Pause className="w-5 h-5 fill-current" />
                ) : (
                  <Play className="w-5 h-5 fill-current ml-0.5" />
                )}
              </button>
            </div>

            {/* Note Lyric & Personal Caption */}
            {selectedNote.lyricSnippet && (
              <div className="p-3.5 rounded-2xl bg-[#071827] border border-[#122e47] space-y-1">
                <span className="text-[10px] font-mono font-bold text-[#91B9C5]/70 uppercase tracking-widest block">
                  Lyric Snippet
                </span>
                <p className="text-xs text-[#E8EEF0] font-serif italic">
                  "{selectedNote.lyricSnippet}"
                </p>
              </div>
            )}

            {selectedNote.caption && (
              <div className="p-3.5 rounded-2xl bg-[#071827] border border-[#122e47] space-y-1">
                <span className="text-[10px] font-mono font-bold text-[#91B9C5]/70 uppercase tracking-widest block">
                  Personal Reflection
                </span>
                <p className="text-xs text-[#E8EEF0]/90 leading-relaxed">
                  {selectedNote.caption}
                </p>
              </div>
            )}

            {/* Footer Actions */}
            <div className="pt-2 flex items-center justify-between border-t border-[#13304c]">
              <span className="text-[10px] font-mono text-[#91B9C5]/60">
                Visibility: {selectedNote.visibility || 'PUBLIC'}
              </span>

              <button
                type="button"
                onClick={() => setSelectedNote(null)}
                className="px-4 py-2 rounded-xl bg-[#143859] hover:bg-[#1d4d75] text-xs font-bold text-[#E8EEF0] transition-colors cursor-pointer"
              >
                Close View
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

