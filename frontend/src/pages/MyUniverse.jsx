import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { usePlayerStore } from '../store/playerStore';
import { noteService } from '../services/noteService';
import AudioConstellation from '../universe/AudioConstellation';
import MemoryTimeline from '../universe/MemoryTimeline';
import MemoryShuffle from '../universe/MemoryShuffle';
import StardustCapsules from '../universe/StardustCapsules';
import StreakCalendar from '../universe/StreakCalendar';
import {
  Sparkles, Clock, Compass, Disc, Play, Plus, X,
  ExternalLink, Calendar, Music, Lock, Heart, Share2, Layers
} from 'lucide-react';
import { toast } from 'react-toastify';

export default function MyUniverse() {
  const { user, setStudioOpen } = useAuthStore();
  const { currentTrack, isPlaying, playTrack, togglePlay } = usePlayerStore();

  // Mode: 'CONSTELLATION' | 'TIMELINE'
  const [viewMode, setViewMode] = useState('CONSTELLATION');
  const [notes, setNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedNote, setSelectedNote] = useState(null);

  // Fetch user's personal universe notes
  useEffect(() => {
    let isMounted = true;

    async function fetchUniverseNotes() {
      setIsLoading(true);
      try {
        if (user?.id) {
          const res = await noteService.getUserNotes(user.id);
          const userNotes = res?.data?.data || res?.data || [];
          if (isMounted && userNotes.length > 0) {
            setNotes(userNotes);
            setIsLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn('Backend user notes empty or offline, loading universe archive fallback', err);
      }

      // Default high-fidelity audiophile notes for My Universe
      if (isMounted) {
        const fallbackNotes = [
          {
            id: 'uni-note-01',
            songTitle: 'Pink Moon (Acoustic Remaster)',
            artistName: 'Nick Drake',
            songImageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500',
            externalSongUrl: 'https://audio-samples.github.io/samples/mp3/blizzard_biased/sample-1.mp3',
            audioSnippetStart: 0,
            audioSnippetEnd: 30,
            templateType: 'CASSETTE',
            emotionTag: '🌙 Nostalgic',
            caption: 'Late evening analog tape warmth with a cup of black tea.',
            lyricSnippet: 'I saw it written and I saw it say, pink moon is on its way.',
            visibility: 'PUBLIC',
            createdAt: '2026-11-05T08:30:00Z',
          },
          {
            id: 'uni-note-02',
            songTitle: 'Midnight City Ambient',
            artistName: 'M83 / Echoes',
            songImageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500',
            externalSongUrl: 'https://audio-samples.github.io/samples/mp3/blizzard_biased/sample-2.mp3',
            audioSnippetStart: 15,
            audioSnippetEnd: 45,
            templateType: 'RECEIPTIFY',
            emotionTag: '⚡ Energetic',
            caption: 'Cycling under neon signboards at midnight.',
            lyricSnippet: 'The city is my church, it wraps in the blinding twilight.',
            visibility: 'PUBLIC',
            createdAt: '2026-11-03T19:15:00Z',
          },
          {
            id: 'uni-note-03',
            songTitle: 'Subterranean Homesick Alien',
            artistName: 'Radiohead',
            songImageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=500',
            externalSongUrl: 'https://audio-samples.github.io/samples/mp3/blizzard_unbiased/sample-1.mp3',
            audioSnippetStart: 30,
            audioSnippetEnd: 60,
            templateType: 'VINYL',
            emotionTag: '🪐 Ethereal',
            caption: 'Looking up at cold stars from a quiet rooftop in Shibuya.',
            lyricSnippet: 'Up above aliens hover making home movies for the folks back home.',
            visibility: 'FRIENDS_ONLY',
            createdAt: '2026-10-18T22:40:00Z',
          },
          {
            id: 'uni-note-04',
            songTitle: 'Kyoto Fog (Tape Loop #4)',
            artistName: 'Phoebe Bridgers Vibe',
            songImageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500',
            externalSongUrl: 'https://audio-samples.github.io/samples/mp3/blizzard_biased/sample-1.mp3',
            audioSnippetStart: 0,
            audioSnippetEnd: 30,
            templateType: 'STAMP',
            emotionTag: '🌿 Introspective',
            caption: 'Morning mist rising over the old temple gardens.',
            lyricSnippet: 'Day off in Kyoto, got bored at the temple...',
            visibility: 'PUBLIC',
            createdAt: '2026-05-14T11:00:00Z', // Past anniversary candidate
          },
          {
            id: 'uni-note-05',
            songTitle: 'Starálfur',
            artistName: 'Sigur Rós',
            songImageUrl: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=500',
            externalSongUrl: 'https://audio-samples.github.io/samples/mp3/blizzard_biased/sample-2.mp3',
            audioSnippetStart: 10,
            audioSnippetEnd: 40,
            templateType: 'CASSETTE',
            emotionTag: '✨ Transcendent',
            caption: 'First winter frost forming on glass.',
            lyricSnippet: 'Blátt lítið blóm í hendi mér...',
            visibility: 'PUBLIC',
            createdAt: '2025-11-05T14:20:00Z', // 1-year anniversary match!
          }
        ];
        setNotes(fallbackNotes);
        setIsLoading(false);
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

    if (currentTrack?.id === note.id && isPlaying) {
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
      
      {/* 1. UNIVERSE HERO BANNER */}
      <section className="relative w-full border-b border-[#122e47] bg-gradient-to-b from-[#0a1e32] via-[#081827] to-[#071523] pt-8 pb-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-widest uppercase bg-cyan-950/80 text-cyan-300 border border-cyan-500/40">
                ✦ Autonomous Memory Vault
              </span>
              <span className="text-xs font-mono text-[#91B9C5]/70">
                /universe
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-[#E8EEF0] tracking-wide">
              My Universe
            </h1>
            <p className="text-xs sm:text-sm text-[#91B9C5]/80 mt-1 max-w-xl leading-relaxed">
              Your personal constellation of sound, intimate recollections, and time-sealed stardust capsules.
            </p>
          </div>

          {/* Quick Stats Pill */}
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 rounded-2xl bg-[#091f33] border border-[#173d5f] flex items-center gap-3 shadow-inner">
              <div className="text-center">
                <span className="block text-xs font-mono font-bold text-cyan-300">
                  {notes.length}
                </span>
                <span className="text-[10px] font-mono text-[#91B9C5]/60 uppercase">
                  Stars
                </span>
              </div>
              <div className="h-6 w-px bg-[#183f61]" />
              <div className="text-center">
                <span className="block text-xs font-mono font-bold text-orange-400">
                  {user?.streakDays || 14}d
                </span>
                <span className="text-[10px] font-mono text-[#91B9C5]/60 uppercase">
                  Streak
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setStudioOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-[#1b5d8c] hover:from-cyan-400 hover:to-[#2272ab] text-[#071523] font-extrabold text-xs tracking-wide shadow-[0_0_16px_rgba(34,211,238,0.3)] transition-all cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Create Note</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. MAIN WORKSPACE CONTENT */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
        
        {/* SECTION A: AUDIO CONSTELLATION & MEMORY TIMELINE */}
        <section className="space-y-4">
          {/* Section Header & View Mode Switcher */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <h2 className="text-sm sm:text-base font-serif font-bold text-[#E8EEF0] uppercase tracking-wider">
                Celestial Celestial Map
              </h2>
            </div>

            {/* Toggle View: Constellation vs Timeline */}
            <div className="flex items-center gap-1 bg-[#091e30] p-1 rounded-2xl border border-[#143552]">
              <button
                type="button"
                onClick={() => setViewMode('CONSTELLATION')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold tracking-wide transition-all cursor-pointer ${
                  viewMode === 'CONSTELLATION'
                    ? 'bg-[#184266] text-cyan-200 border border-cyan-500/40 shadow-sm'
                    : 'text-[#91B9C5]/70 hover:text-[#E8EEF0]'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Constellation</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('TIMELINE')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold tracking-wide transition-all cursor-pointer ${
                  viewMode === 'TIMELINE'
                    ? 'bg-[#184266] text-cyan-200 border border-cyan-500/40 shadow-sm'
                    : 'text-[#91B9C5]/70 hover:text-[#E8EEF0]'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Timeline</span>
              </button>
            </div>
          </div>

          {/* Active View Container */}
          {viewMode === 'CONSTELLATION' ? (
            <AudioConstellation
              notes={notes}
              activeNoteId={currentTrack?.id}
              onSelectNote={(note) => setSelectedNote(note)}
              onPlayNote={handlePlayNote}
              onCreateNote={() => setStudioOpen(true)}
            />
          ) : (
            <MemoryTimeline
              notes={notes}
              activeNoteId={currentTrack?.id}
              onSelectNote={(note) => setSelectedNote(note)}
              onPlayNote={handlePlayNote}
              onCreateNote={() => setStudioOpen(true)}
            />
          )}
        </section>

        {/* SECTION B: MEMORY SHUFFLE */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <h2 className="text-sm sm:text-base font-serif font-bold text-[#E8EEF0] uppercase tracking-wider">
              Nostalgic Memory Shuffle
            </h2>
          </div>

          <MemoryShuffle
            notes={notes}
            activeNoteId={currentTrack?.id}
            onPlayNote={handlePlayNote}
            onSelectNote={(note) => setSelectedNote(note)}
          />
        </section>

        {/* SECTION C: STARDUST CAPSULES (Chapter 12.2 DTO Masking Compliant) */}
        <section className="space-y-4">
          <StardustCapsules
            userId={user?.id}
            activeNoteId={currentTrack?.id}
            onPlayNote={handlePlayNote}
          />
        </section>

        {/* SECTION D: AUDITORY STREAK CALENDAR */}
        <section className="space-y-3">
          <StreakCalendar
            userId={user?.id}
            userStreak={user?.streakDays || 14}
          />
        </section>

      </div>

      {/* 3. NOTE DETAIL MODAL (Triggered when user clicks a constellation star or timeline item) */}
      {selectedNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
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
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-[#102d47] text-cyan-300 border border-cyan-500/30">
                ✦ {selectedNote.templateType || 'NOTE'} STAR
              </span>
              <span className="text-xs font-mono text-[#91B9C5]/70 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(selectedNote.createdAt || Date.now()).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </span>
            </div>

            {/* Main Visual & Audio Row */}
            <div className="flex items-center gap-4 p-3.5 rounded-2xl bg-[#061421] border border-[#143552]">
              <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-[#204c75] shrink-0 bg-[#081724]">
                <img
                  src={selectedNote.songImageUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200'}
                  alt={selectedNote.songTitle}
                  className="w-full h-full object-cover"
                />
                {currentTrack?.id === selectedNote.id && isPlaying && (
                  <div className="absolute inset-0 bg-[#081724]/60 flex items-center justify-center">
                    <Disc className="w-7 h-7 text-cyan-300 animate-spin" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0 space-y-1">
                <h3 className="font-bold text-sm sm:text-base text-[#E8EEF0] truncate">
                  {selectedNote.songTitle}
                </h3>
                <p className="text-xs text-[#91B9C5] font-medium truncate">
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
                    ? 'bg-cyan-400 text-[#081827]'
                    : 'bg-[#153a59] hover:bg-[#1d4d75] text-cyan-300 border border-[#23537e]'
                }`}
                title={currentTrack?.id === selectedNote.id && isPlaying ? 'Pause' : 'Play Snippet'}
              >
                {currentTrack?.id === selectedNote.id && isPlaying ? (
                  <Disc className="w-5 h-5 animate-spin" />
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

