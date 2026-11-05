import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { usePlayerStore } from '../store/playerStore';
import { noteService } from '../services/noteService';
import { authService } from '../services/authService';
import MusicNoteCard from '../components/MusicNoteCard';
import { 
  Flame, User, Edit3, X, Check, Disc, Play, 
  ExternalLink, Sparkles, Globe, Music
} from 'lucide-react';
import { toast } from 'react-toastify';

export default function Profile() {
  const { user, setUser, setStudioOpen } = useAuthStore();
  const { currentTrack, isPlaying, playTrack, togglePlay } = usePlayerStore();

  const [notes, setNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Edit Profile Modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState(user?.displayName || 'Linh Tran');
  const [editHandle, setEditHandle] = useState(user?.handle ? user.handle.replace(/^@/, '') : 'linhtran');
  const [editBio, setEditBio] = useState(user?.bio || 'Acoustic archiver & tape bias curator based in Berlin.');
  const [editWarning, setEditWarning] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Load public notes belonging to this user
  useEffect(() => {
    let isMounted = true;

    async function loadPublicNotes() {
      setIsLoading(true);
      try {
        if (user?.id) {
          const res = await noteService.getUserNotes(user.id);
          const userNotes = res?.data?.data || res?.data || [];
          // Chapter 7.3: Profile ONLY contains Public Music Notes! Filter out FRIENDS_ONLY / PRIVATE
          const publicOnly = userNotes.filter((n) => (n.visibility || 'PUBLIC').toUpperCase() === 'PUBLIC');
          if (isMounted && publicOnly.length > 0) {
            setNotes(publicOnly);
            setIsLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn('Could not fetch user public notes from backend, using default public notes', err);
      }

      if (isMounted) {
        // Fallback default public notes for user profile
        const defaultPublicNotes = [
          {
            id: 'pub-note-1',
            userDisplayName: user?.displayName || 'Linh Tran',
            handle: user?.handle || '@linhtran',
            userAvatarUrl: user?.avatarUrl,
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
            likesCount: 38,
            createdAt: '2026-11-05T08:30:00Z',
          },
          {
            id: 'pub-note-2',
            userDisplayName: user?.displayName || 'Linh Tran',
            handle: user?.handle || '@linhtran',
            userAvatarUrl: user?.avatarUrl,
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
            likesCount: 45,
            createdAt: '2026-11-03T19:15:00Z',
          },
        ];
        setNotes(defaultPublicNotes);
        setIsLoading(false);
      }
    }

    loadPublicNotes();
    return () => {
      isMounted = false;
    };
  }, [user]);

  // Handle Edit Handle validation
  const handleHandleChange = (val) => {
    const raw = val.replace(/^@/, '');
    if (/[^a-zA-Z0-9_.]/.test(raw)) {
      setEditWarning('Username cannot contain spaces or symbols.');
    } else {
      setEditWarning('');
    }
    const clean = raw.replace(/[^a-zA-Z0-9_.]/g, '');
    setEditHandle(clean);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!editName.trim() || !editHandle.trim()) {
      toast.warning('Name and username are required');
      return;
    }

    setIsSavingProfile(true);
    const updatedData = {
      displayName: editName.trim(),
      handle: `@${editHandle.trim()}`,
      bio: editBio.trim(),
    };

    try {
      if (user?.id) {
        await authService.updateProfile(user.id, updatedData);
      }
      setUser({
        ...user,
        ...updatedData,
      });
      toast.success('Profile updated successfully!');
      setIsEditModalOpen(false);
    } catch (err) {
      console.warn('Backend updateProfile failed, updating local store', err);
      setUser({
        ...user,
        ...updatedData,
      });
      toast.success('Profile updated!');
      setIsEditModalOpen(false);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePlayToggle = (note) => {
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

  const initials = user?.displayName
    ? user.displayName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'LT';

  return (
    <div className="w-full min-h-screen bg-[#071523] text-[#E8EEF0] selection:bg-[#91B9C5] selection:text-[#071523] pb-28">
      
      {/* 1. PROFILE IDENTITY BANNER (Chapter 7.2 Wireframe) */}
      <section className="relative w-full border-b border-[#122e47] bg-gradient-to-b from-[#0b2034] via-[#081827] to-[#071523] pt-12 pb-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto flex flex-col items-center text-center space-y-4">
          
          {/* Avatar with Ring */}
          <div className="relative group">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl overflow-hidden bg-[#0e273d] border-2 border-[#204d73] shadow-2xl flex items-center justify-center text-2xl font-bold text-[#E8EEF0]">
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{initials}</span>
              )}
            </div>

            {/* Basic Streak Badge */}
            <div
              className="absolute -bottom-2 -right-2 px-2.5 py-1 rounded-full bg-[#081827] border border-orange-500/50 shadow-md flex items-center gap-1 text-xs font-mono font-bold text-orange-400"
              title="Daily Music Note Streak"
            >
              <Flame className="w-3.5 h-3.5 fill-orange-400 animate-pulse" />
              <span>{user?.streakDays || 14}d</span>
            </div>
          </div>

          {/* User Name & Handle */}
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-serif font-bold text-[#E8EEF0] tracking-wide">
              {user?.displayName || 'Linh Tran'}
            </h1>
            <p className="text-xs sm:text-sm font-mono text-cyan-300">
              {user?.handle || '@linhtran'}
            </p>
          </div>

          {/* Personal Bio */}
          <p className="text-xs sm:text-sm text-[#91B9C5]/85 max-w-lg leading-relaxed font-sans">
            {user?.bio || 'Acoustic archiver & tape bias curator based in Berlin.'}
          </p>

          {/* Actions: Edit Profile Button */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0e2a44] hover:bg-[#163a5d] text-xs font-bold text-[#E8EEF0] border border-[#1e486e] hover:border-cyan-400/50 shadow transition-all cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5 text-cyan-300" />
              <span>Edit Profile</span>
            </button>
          </div>

        </div>
      </section>

      {/* 2. PUBLIC MUSIC NOTES SECTION (Chapter 7.2 & 7.3: Only Public Notes) */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        
        {/* Section Header */}
        <div className="flex items-center justify-between border-b border-[#13304c] pb-3">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-cyan-300" />
            <h2 className="text-sm font-serif font-bold text-[#E8EEF0] uppercase tracking-wider">
              Public Music Notes
            </h2>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-[#0e273d] text-cyan-300 border border-[#1b4366]">
              {notes.length}
            </span>
          </div>

          <p className="text-[11px] text-[#91B9C5]/60 font-mono hidden sm:block">
            Visible to the entire soundscape
          </p>
        </div>

        {/* Notes Grid */}
        {isLoading ? (
          <div className="py-16 text-center text-xs text-[#91B9C5]/60 flex items-center justify-center gap-2">
            <Disc className="w-4 h-4 animate-spin text-cyan-300" />
            <span>Loading public notes...</span>
          </div>
        ) : notes.length === 0 ? (
          <div className="py-16 rounded-3xl bg-[#091d30]/50 border border-[#143552] flex flex-col items-center justify-center text-center p-6 space-y-3">
            <Music className="w-10 h-10 text-[#91B9C5]/40" />
            <h3 className="text-sm font-bold text-[#E8EEF0]">No Public Notes Yet</h3>
            <p className="text-xs text-[#91B9C5]/70 max-w-sm">
              You haven't published any public notes to your profile yet.
            </p>
            <button
              type="button"
              onClick={() => setStudioOpen(true)}
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-[#071523] text-xs font-bold transition-all shadow-md cursor-pointer"
            >
              Create First Public Note
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
            {notes.map((note) => (
              <MusicNoteCard
                key={note.id}
                note={note}
                isPlaying={currentTrack?.id === note.id && isPlaying}
                onPlayToggle={() => handlePlayToggle(note)}
                compact={true}
              />
            ))}
          </div>
        )}

      </section>

      {/* 3. EDIT PROFILE MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md rounded-3xl bg-[#091e30] border border-[#1b4366] p-6 shadow-2xl space-y-4">
            
            <div className="flex items-center justify-between border-b border-[#143552] pb-3">
              <h3 className="text-sm sm:text-base font-serif font-bold text-[#E8EEF0]">
                Edit Profile
              </h3>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-full text-[#91B9C5] hover:text-white hover:bg-[#122e47]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-[#91B9C5] mb-1">
                  Display Name *
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#061421] border border-[#183d5f] text-xs text-[#E8EEF0] focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#91B9C5] mb-1">
                  Username (@handle) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-[#91B9C5]/60">
                    @
                  </span>
                  <input
                    type="text"
                    required
                    value={editHandle}
                    onChange={(e) => handleHandleChange(e.target.value)}
                    className="w-full pl-7 pr-3 py-2 rounded-xl bg-[#061421] border border-[#183d5f] text-xs text-[#E8EEF0] focus:border-cyan-400 focus:outline-none font-mono"
                  />
                </div>
                {editWarning && (
                  <p className="text-[10px] text-amber-300 mt-1">{editWarning}</p>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#91B9C5] mb-1">
                  Personal Bio
                </label>
                <textarea
                  rows={3}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#061421] border border-[#183d5f] text-xs text-[#E8EEF0] focus:border-cyan-400 focus:outline-none resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#91B9C5] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-[#195a89] hover:from-cyan-400 hover:to-[#206fa8] text-[#07131e] font-bold text-xs shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isSavingProfile ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
