import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { usePlayerStore } from '../store/playerStore';
import { noteService } from '../services/noteService';
import { authService } from '../services/authService';
import { calculateCurrentStreak } from '../utils/streakUtils';
import MusicNoteCard from '../components/MusicNoteCard';
import { 
  Flame, User, Edit3, X, Check, Disc, Play, 
  ExternalLink, Sparkles, Globe, Music, Trash2, AlertTriangle, Image as ImageIcon, Users
} from 'lucide-react';
import { toast } from 'react-toastify';

const AVATAR_PRESETS = [
  { label: 'Vinyl', url: 'https://images.unsplash.com/photo-1539185441755-769473a23570?w=200' },
  { label: 'Cyber', url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200' },
  { label: 'Tape', url: 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?w=200' },
  { label: 'Cosmic', url: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=200' },
  { label: 'Rain', url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200' },
  { label: 'Lo-Fi', url: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=200' },
];

export default function Profile() {
  const { user, setUser, setStudioOpen, deleteAccount } = useAuthStore();
  const { currentTrack, isPlaying, playTrack, togglePlay } = usePlayerStore();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [notes, setNotes] = useState([]);
  const [visibilityFilter, setVisibilityFilter] = useState('ALL'); // 'ALL' | 'PUBLIC' | 'FRIENDS_ONLY'
  const [isLoading, setIsLoading] = useState(true);
  const [streakDays, setStreakDays] = useState(user?.streakDays ?? 0);

  // Edit Profile Modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(searchParams.get('modal') === 'edit');
  const [editName, setEditName] = useState(user?.displayName || '');
  const [editHandle, setEditHandle] = useState(user?.username || (user?.handle ? user.handle.replace(/^@/, '') : ''));
  const [editAvatarUrl, setEditAvatarUrl] = useState(user?.avatarUrl || '');
  const [editBio, setEditBio] = useState(user?.bio || 'Curating timeless records on SAY.');
  const [editWarning, setEditWarning] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Delete Account Modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // Handle URL query trigger for modal
  useEffect(() => {
    if (searchParams.get('modal') === 'edit') {
      setIsEditModalOpen(true);
    }
  }, [searchParams]);

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    if (searchParams.get('modal') === 'edit') {
      searchParams.delete('modal');
      setSearchParams(searchParams);
    }
  };

  // Sync edit state with active user
  useEffect(() => {
    if (user) {
      setEditName(user.displayName || '');
      setEditHandle(user.username || (user.handle ? user.handle.replace(/^@/, '') : ''));
      setEditAvatarUrl(user.avatarUrl || '');
      setEditBio(user.bio || 'Curating timeless records on SAY.');
    }
  }, [user]);

  // Load all published notes belonging to this user (Public and Friends Circle)
  useEffect(() => {
    let isMounted = true;

    async function loadUserNotes() {
      setIsLoading(true);
      try {
        if (user?.id) {
          const res = await noteService.getUserNotes(user.id);
          const userNotes = Array.isArray(res) ? res : (res?.data?.data || res?.data || []);
          
          // Calculate true streak from all user notes
          const computedStreak = calculateCurrentStreak(userNotes);
          setStreakDays(computedStreak);
          if (user?.streakDays !== computedStreak) {
            setUser({ ...user, streakDays: computedStreak });
          }

          if (isMounted) {
            setNotes(userNotes);
            setIsLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn('Could not fetch user notes from backend', err);
      }

      if (isMounted) {
        setNotes([]);
        setIsLoading(false);
      }
    }

    loadUserNotes();

    // Instant update when a new note is published from StudioModal
    const handleNoteCreated = () => {
      loadUserNotes();
    };
    window.addEventListener('say_note_created', handleNoteCreated);

    return () => {
      isMounted = false;
      window.removeEventListener('say_note_created', handleNoteCreated);
    };
  }, [user]);

  // Computed visibility filters
  const publicCount = useMemo(() => {
    return notes.filter((n) => (n.visibility || 'PUBLIC').toUpperCase() === 'PUBLIC').length;
  }, [notes]);

  const friendsCount = useMemo(() => {
    return notes.filter((n) => {
      const v = (n.visibility || 'PUBLIC').toUpperCase();
      return v === 'FRIENDS' || v === 'FRIENDS_ONLY';
    }).length;
  }, [notes]);

  const filteredNotes = useMemo(() => {
    if (visibilityFilter === 'PUBLIC') {
      return notes.filter((n) => (n.visibility || 'PUBLIC').toUpperCase() === 'PUBLIC');
    }
    if (visibilityFilter === 'FRIENDS_ONLY') {
      return notes.filter((n) => {
        const v = (n.visibility || 'PUBLIC').toUpperCase();
        return v === 'FRIENDS' || v === 'FRIENDS_ONLY';
      });
    }
    return notes;
  }, [notes, visibilityFilter]);

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
    const cleanHandle = editHandle.trim().replace(/^@/, '').toLowerCase();
    if (!editName.trim() || !cleanHandle) {
      toast.warning('Name and username are required');
      return;
    }

    if (cleanHandle.length < 3 || cleanHandle.length > 30) {
      toast.warning('Username must be 3-30 characters');
      return;
    }

    setIsSavingProfile(true);
    const updatedData = {
      displayName: editName.trim(),
      username: cleanHandle,
      handle: `@${cleanHandle}`,
      avatarUrl: editAvatarUrl.trim(),
      bio: editBio.trim(),
    };

    try {
      if (user?.id) {
        const res = await authService.updateProfile(user.id, updatedData);
        const serverUser = res?.data?.data || res?.data;
        setUser({
          ...user,
          ...updatedData,
          ...(serverUser || {}),
          handle: `@${cleanHandle}`,
        });
      } else {
        setUser({
          ...user,
          ...updatedData,
        });
      }
      toast.success('Profile and avatar updated successfully!');
      handleCloseEditModal();
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Failed to update profile';
      console.error('Update profile error:', errMsg);
      toast.error(errMsg);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeletingAccount(true);
    try {
      if (user?.id) {
        await authService.deleteAccount(user.id);
      }
      deleteAccount();
      toast.info('Your account and all associated data have been permanently deleted.');
      setIsDeleteModalOpen(false);
      navigate('/feed');
    } catch (err) {
      console.error('Failed to delete account:', err);
      toast.error(err.response?.data?.message || 'Failed to delete account');
    } finally {
      setIsDeletingAccount(false);
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
      
      {/* 1. HORIZONTAL PROFILE IDENTITY BANNER */}
      <section className="relative w-full border-b border-[#122e47] bg-gradient-to-b from-[#0b2034] via-[#081827] to-[#071523] py-7 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center sm:items-center justify-between gap-6">
          
          {/* Left: Avatar + Identity Info */}
          <div className="flex items-center gap-5 min-w-0 flex-1">
            {/* Avatar with Streak Badge */}
            <div className="relative shrink-0">
              <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-2xl overflow-hidden bg-[#0a1f33] border border-[#1f486d] shadow-xl flex items-center justify-center text-xl font-bold text-[#E8EEF0]">
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

              {/* Streak Badge */}
              <div
                className={`absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full bg-[#081827] shadow-md flex items-center gap-1 text-[11px] font-mono font-bold border ${
                  streakDays >= 7 ? 'border-orange-500/50 text-orange-400' : 'border-cyan-500/40 text-cyan-300'
                }`}
                title="Daily Music Note Streak"
              >
                <Flame className={`w-3 h-3 ${
                  streakDays >= 7 ? 'fill-orange-400 animate-pulse text-orange-400' : 'fill-cyan-300/30 text-cyan-300'
                }`} />
                <span>{streakDays}d</span>
              </div>
            </div>

            {/* Display Name (top), Username (middle), Bio (bottom) */}
            <div className="min-w-0 flex-1 space-y-1">
              <h1 className="text-xl sm:text-2xl font-serif font-bold text-[#E8EEF0] tracking-wide truncate leading-tight">
                {user?.displayName || 'Audiophile'}
              </h1>
              
              <p className="text-xs font-mono text-cyan-300/80 leading-none">
                @{user?.username || 'listener'}
              </p>

              <p className="text-xs sm:text-sm text-[#91B9C5]/85 leading-relaxed font-sans line-clamp-2 max-w-2xl pt-0.5">
                {user?.bio || 'Curating timeless records on SAY.'}
              </p>
            </div>
          </div>

          {/* Right: Action Button */}
          <div className="shrink-0">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0e2a44] hover:bg-[#163a5d] text-xs font-bold text-[#E8EEF0] border border-[#1e486e] hover:border-cyan-400/50 shadow transition-all cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5 text-cyan-300" />
              <span>Edit Profile</span>
            </button>
          </div>

        </div>
      </section>

      {/* 2. PUBLISHED MUSIC NOTES SECTION */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        
        {/* Section Header with Visibility Filter Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#13304c] pb-3">
          <div className="flex items-center gap-2">
            <Music className="w-4 h-4 text-cyan-300" />
            <h2 className="text-sm font-serif font-bold text-[#E8EEF0] uppercase tracking-wider">
              Published Music Notes
            </h2>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-[#0e273d] text-cyan-300 border border-[#1b4366]">
              {filteredNotes.length}
            </span>
          </div>

          {/* Visibility Filter Selector */}
          <div className="flex items-center gap-1 bg-[#091f33] p-1 rounded-xl border border-sky-500/20 text-xs font-mono self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setVisibilityFilter('ALL')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer font-bold ${
                visibilityFilter === 'ALL'
                  ? 'bg-[#183952] text-cyan-200 border border-cyan-500/40 shadow-sm'
                  : 'text-[#91B9C5]/70 hover:text-white'
              }`}
            >
              All ({notes.length})
            </button>
            <button
              type="button"
              onClick={() => setVisibilityFilter('PUBLIC')}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg transition-all cursor-pointer font-bold ${
                visibilityFilter === 'PUBLIC'
                  ? 'bg-[#183952] text-cyan-200 border border-cyan-500/40 shadow-sm'
                  : 'text-[#91B9C5]/70 hover:text-white'
              }`}
            >
              <Globe className="w-3 h-3" />
              <span>Public ({publicCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setVisibilityFilter('FRIENDS_ONLY')}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg transition-all cursor-pointer font-bold ${
                visibilityFilter === 'FRIENDS_ONLY'
                  ? 'bg-[#183952] text-cyan-200 border border-cyan-500/40 shadow-sm'
                  : 'text-[#91B9C5]/70 hover:text-white'
              }`}
            >
              <Users className="w-3 h-3" />
              <span>Friends ({friendsCount})</span>
            </button>
          </div>
        </div>

        {/* Notes Grid */}
        {isLoading ? (
          <div className="py-16 text-center text-xs text-[#91B9C5]/60 flex items-center justify-center gap-2">
            <Disc className="w-4 h-4 animate-spin text-cyan-300" />
            <span>Loading published notes...</span>
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="py-16 rounded-3xl bg-[#091d30]/50 border border-[#143552] flex flex-col items-center justify-center text-center p-6 space-y-3">
            <Music className="w-10 h-10 text-[#91B9C5]/40" />
            <h3 className="text-sm font-bold text-[#E8EEF0]">
              {visibilityFilter === 'FRIENDS_ONLY' 
                ? 'No Friends-Only Notes' 
                : visibilityFilter === 'PUBLIC' 
                ? 'No Public Notes' 
                : 'No Published Notes Yet'}
            </h3>
            <p className="text-xs text-[#91B9C5]/70 max-w-sm">
              {visibilityFilter === 'FRIENDS_ONLY'
                ? 'You have not published any notes with Friends-only visibility.'
                : visibilityFilter === 'PUBLIC'
                ? 'You have not published any notes with Public visibility.'
                : 'Share your sonic soul by creating your first music note.'}
            </p>
            <button
              type="button"
              onClick={() => setStudioOpen(true)}
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-[#071523] text-xs font-bold transition-all shadow-md cursor-pointer"
            >
              Create Note
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
            {filteredNotes.map((note) => (
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
                Edit Profile & Account
              </h3>
              <button
                type="button"
                onClick={handleCloseEditModal}
                className="p-1 rounded-full text-[#91B9C5] hover:text-white hover:bg-[#122e47]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              {/* Display Name */}
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

              {/* Username (No handle text) */}
              <div>
                <label className="block text-[11px] font-bold text-[#91B9C5] mb-1">
                  Username *
                </label>
                <input
                  type="text"
                  required
                  value={editHandle}
                  onChange={(e) => handleHandleChange(e.target.value)}
                  placeholder="e.g. minh_quang"
                  className="w-full px-3 py-2 rounded-xl bg-[#061421] border border-[#183d5f] text-xs text-[#E8EEF0] focus:border-cyan-400 focus:outline-none font-mono"
                />
                {editWarning && (
                  <p className="text-[10px] text-amber-300 mt-1">{editWarning}</p>
                )}
              </div>

              {/* Avatar Selector & Preview */}
              <div>
                <label className="block text-[11px] font-bold text-[#91B9C5] mb-1.5 flex items-center justify-between">
                  <span>Profile Avatar</span>
                  <span className="text-[10px] font-mono text-cyan-300/80">Choose preset or enter URL</span>
                </label>
                
                <div className="flex items-center gap-3 mb-2.5">
                  <div className="w-12 h-12 rounded-2xl overflow-hidden bg-[#071624] border-2 border-cyan-400/50 shrink-0 shadow-md flex items-center justify-center">
                    {editAvatarUrl ? (
                      <img
                        src={editAvatarUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200';
                        }}
                      />
                    ) : (
                      <span className="text-xs font-bold text-[#E8EEF0]">{initials}</span>
                    )}
                  </div>

                  <input
                    type="url"
                    value={editAvatarUrl}
                    onChange={(e) => setEditAvatarUrl(e.target.value)}
                    placeholder="https://example.com/avatar.jpg"
                    className="flex-1 px-3 py-2 rounded-xl bg-[#061421] border border-[#183d5f] text-xs text-[#E8EEF0] focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                {/* Preset Avatars for quick 1-click selection */}
                <div className="grid grid-cols-6 gap-2">
                  {AVATAR_PRESETS.map((p) => {
                    const isSelected = editAvatarUrl === p.url;
                    return (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => setEditAvatarUrl(p.url)}
                        className={`relative rounded-xl overflow-hidden aspect-square border transition-all cursor-pointer group ${
                          isSelected ? 'ring-2 ring-cyan-400 border-cyan-400 scale-105' : 'border-[#1b4366] hover:border-cyan-400/60'
                        }`}
                        title={p.label}
                      >
                        <img src={p.url} alt={p.label} className="w-full h-full object-cover" />
                        <span className="absolute inset-x-0 bottom-0 text-[8px] bg-black/75 text-center text-cyan-200 py-0.5 truncate leading-none">
                          {p.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Personal Bio */}
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

              <div className="pt-4 border-t border-[#13304c] flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    handleCloseEditModal();
                    setIsDeleteModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 text-xs font-medium transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Account</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCloseEditModal}
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
              </div>
            </form>

          </div>
        </div>
      )}

      {/* 4. DELETE ACCOUNT CONFIRMATION MODAL */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-[#091a2b] border border-rose-500/40 p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-950/60 border border-rose-500/40 flex items-center justify-center text-rose-400 mx-auto">
              <AlertTriangle className="w-6 h-6 animate-pulse" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-base font-serif font-bold text-white tracking-wide">
                Permanently Delete Account?
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                This will irreversibly remove your audiophile identity <span className="font-mono text-rose-300 font-bold">{user?.handle || `@${user?.username}`}</span>, along with all your published music notes, temporal filaments, and friendships.
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-black/40 border border-rose-500/20 text-[11px] text-rose-300/80 font-mono text-center">
              ⚠ This action cannot be undone.
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isDeletingAccount}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/[0.05] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={isDeletingAccount}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold text-xs shadow-lg shadow-rose-950/50 cursor-pointer disabled:opacity-50 transition-all"
              >
                {isDeletingAccount ? 'Deleting...' : 'Delete My Account'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
