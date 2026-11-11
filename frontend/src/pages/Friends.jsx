import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { usePlayerStore } from '../store/playerStore';
import { noteService } from '../services/noteService';
import { socialService } from '../services/socialService';
import MusicNoteCard from '../components/MusicNoteCard';
import ReplyWithSongModal from '../components/ReplyWithSongModal';
import { 
  Users, Radio, UserCheck, Plus, Search, Check, X, 
  Disc, Play, Pause, Heart, Bookmark, MessageSquare, ExternalLink, 
  UserPlus, UserMinus, Sparkles, AlertCircle
} from 'lucide-react';
import { toast } from 'react-toastify';
import { formatTimeDetails } from '../utils/timeFormat';

export default function Friends() {
  const { user } = useAuthStore();
  const { currentTrack, isPlaying, playTrack, togglePlay } = usePlayerStore();
  const [searchParams, setSearchParams] = useSearchParams();

  // Sub-tabs synchronized with Navbar / URL search params: 'feed' (Friends Feed) | 'hub' (Friendship Hub)
  const activeSubTab = (searchParams.get('tab') || 'feed').toLowerCase();
  const setActiveSubTab = (tab) => setSearchParams({ tab });

  // Friends Feed state
  const [friendsNotes, setFriendsNotes] = useState([]);
  const [isLoadingFeed, setIsLoadingFeed] = useState(true);
  const [likedNoteIds, setLikedNoteIds] = useState(new Set());
  const [likeCounts, setLikeCounts] = useState({});

  // Friendship Hub state
  const [friendsList, setFriendsList] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [sentRequestUserIds, setSentRequestUserIds] = useState(new Set());

  // Reply With Song modal state
  const [replyModalNote, setReplyModalNote] = useState(null);

  // View friend profile modal state
  const [viewingProfileFriend, setViewingProfileFriend] = useState(null);

  // 1. Fetch Friends Feed (combining circle feed + user's own friends-only and public notes)
  const loadFriendsFeed = async () => {
    setIsLoadingFeed(true);
    try {
      if (user?.id) {
        const [friendsFeedRes, userNotesRes] = await Promise.allSettled([
          noteService.getFriendsFeed(user.id),
          noteService.getUserNotes(user.id),
        ]);

        const rawFriends = friendsFeedRes.status === 'fulfilled'
          ? (Array.isArray(friendsFeedRes.value) ? friendsFeedRes.value : (friendsFeedRes.value?.data?.data || friendsFeedRes.value?.data || []))
          : [];

        const rawUserNotes = userNotesRes.status === 'fulfilled'
          ? (Array.isArray(userNotesRes.value) ? userNotesRes.value : (userNotesRes.value?.data?.data || userNotesRes.value?.data || []))
          : [];

        // Ensure user's own notes (especially Friends-only) are included in their Friends feed
        const myNotes = rawUserNotes.filter((n) => {
          const vis = (n.visibility || 'PUBLIC').toUpperCase();
          return vis === 'FRIENDS' || vis === 'FRIENDS_ONLY' || vis === 'PUBLIC';
        });

        const mergedMap = new Map();
        rawFriends.forEach((n) => mergedMap.set(String(n.id), n));
        myNotes.forEach((n) => mergedMap.set(String(n.id), n));

        const mergedList = Array.from(mergedMap.values()).sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );

        setFriendsNotes(mergedList);
        setIsLoadingFeed(false);
        return;
      }
    } catch (err) {
      console.warn('Backend friends feed empty or offline', err);
    }
    setFriendsNotes([]);
    setIsLoadingFeed(false);
  };

  // 2. Fetch Friendship Hub data
  const loadFriendshipHub = async () => {
    try {
      if (user?.id) {
        const [friendsRes, pendingRes] = await Promise.allSettled([
          socialService.getFriendsList(user.id),
          socialService.getPendingRequests(user.id)
        ]);

        if (friendsRes.status === 'fulfilled') {
          const data = friendsRes.value;
          const list = Array.isArray(data) ? data : (data?.data?.data || data?.data || []);
          setFriendsList(list);
        } else {
          setFriendsList([]);
        }

        if (pendingRes.status === 'fulfilled') {
          const data = pendingRes.value;
          const list = Array.isArray(data) ? data : (data?.data?.data || data?.data || []);
          setPendingRequests(list);
        } else {
          setPendingRequests([]);
        }
        return;
      }
    } catch (err) {
      console.warn('Friendship hub load error', err);
    }

    setFriendsList([]);
    setPendingRequests([]);
  };

  useEffect(() => {
    loadFriendsFeed();
    loadFriendshipHub();

    const handleNoteCreated = () => {
      loadFriendsFeed();
    };
    window.addEventListener('say_note_created', handleNoteCreated);
    return () => {
      window.removeEventListener('say_note_created', handleNoteCreated);
    };
  }, [user]);

  // Search users in Friendship Hub
  const handleSearchUsers = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setTimeout(() => {
      // Clean mock discovery search
      const q = searchQuery.toLowerCase().replace(/^@/, '');
      const candidates = [
        {
          id: 'cand-1',
          displayName: 'Sora Tanaka',
          handle: '@soratanaka',
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
          audiophileRank: 'Hi-Fi Master',
          bio: 'Shibuya vinyl explorer & jazz kissa enthusiast.'
        },
        {
          id: 'cand-2',
          displayName: 'Clara Oswald',
          handle: '@clara_sounds',
          avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200',
          audiophileRank: 'Tape Specialist',
          bio: 'Listening to rain and cassette recordings in London.'
        },
        {
          id: 'cand-3',
          displayName: 'David K.',
          handle: '@davidk_audio',
          avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
          audiophileRank: 'Novice Listener',
          bio: 'Discovering indie folk and dream pop.'
        }
      ];

      const matches = candidates.filter(
        c => c.displayName.toLowerCase().includes(q) || c.handle.toLowerCase().includes(q)
      );
      setSearchResults(matches.length > 0 ? matches : candidates);
      setIsSearching(false);
    }, 250);
  };

  const handleSendRequest = async (targetUser) => {
    try {
      if (user?.id) {
        await socialService.sendFriendRequest(user.id, targetUser.id);
      }
      setSentRequestUserIds(prev => new Set(prev).add(targetUser.id));
      toast.success(`Friend request sent to ${targetUser.displayName}`);
    } catch (err) {
      setSentRequestUserIds(prev => new Set(prev).add(targetUser.id));
      toast.success(`Friend request sent to ${targetUser.displayName}`);
    }
  };

  const handleAcceptRequest = async (reqId, requesterName) => {
    try {
      if (user?.id) {
        await socialService.acceptFriendRequest(reqId, user.id);
      }
      setPendingRequests(prev => prev.filter(r => r.id !== reqId));
      toast.success(`Connected with ${requesterName}!`);
      loadFriendshipHub();
      loadFriendsFeed();
    } catch (err) {
      setPendingRequests(prev => prev.filter(r => r.id !== reqId));
      toast.success(`Connected with ${requesterName}!`);
    }
  };

  const handleRejectRequest = async (reqId) => {
    try {
      if (user?.id) {
        await socialService.rejectFriendRequest(reqId, user.id);
      }
      setPendingRequests(prev => prev.filter(r => r.id !== reqId));
      toast.info('Friend request declined.');
    } catch (err) {
      setPendingRequests(prev => prev.filter(r => r.id !== reqId));
      toast.info('Friend request declined.');
    }
  };

  const handleRemoveFriend = async (friend, name) => {
    const friendId = friend.friendId || friend.id;
    const friendshipId = friend.friendshipId || friend.id;
    try {
      if (user?.id && friendshipId) {
        await socialService.removeFriend(friendshipId, user.id);
      }
      setFriendsList(prev => prev.filter(f => (f.friendId || f.id) !== friendId));
      toast.info(`Removed ${name} from friends list.`);
    } catch (err) {
      console.warn('Backend remove friend error, updating locally', err);
      setFriendsList(prev => prev.filter(f => (f.friendId || f.id) !== friendId));
      toast.info(`Removed ${name} from friends list.`);
    }
  };

  // Play audio toggle
  const handlePlayToggle = (note) => {
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

  // Like note toggle with actual count tracking
  const handleLikeNote = (noteId, defaultLikes = 0) => {
    setLikedNoteIds(prev => {
      const next = new Set(prev);
      const isCurrentlyLiked = next.has(noteId);
      if (isCurrentlyLiked) {
        next.delete(noteId);
        toast.info('Removed like');
      } else {
        next.add(noteId);
        toast.success('Liked music note!');
      }
      setLikeCounts(counts => {
        const currentCount = counts[noteId] ?? defaultLikes;
        return {
          ...counts,
          [noteId]: isCurrentlyLiked ? Math.max(0, currentCount - 1) : currentCount + 1,
        };
      });
      return next;
    });
  };

  // Handler when a reply is successfully sent via ReplyWithSongModal
  const handleReplySuccess = (newReply) => {
    setFriendsNotes(prevNotes => prevNotes.map(n => {
      if (n.id === replyModalNote.id) {
        const updatedDialogues = [...(n.dialogues || []), {
          id: newReply.id || `reply-${Date.now()}`,
          author: user?.displayName || 'Audiophile',
          song: newReply.songTitle || newReply.song,
          artist: newReply.artistName || newReply.artist,
          caption: newReply.replyCaption || newReply.caption,
        }];
        return { ...n, dialogues: updatedDialogues };
      }
      return n;
    }));
  };

  return (
    <div className="w-full min-h-screen bg-[#071523] text-[#E8EEF0] selection:bg-[#91B9C5] selection:text-[#071523] pb-28">
      
      {/* SUB-TAB CONTENT */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* SUB-TAB A: FRIENDS FEED (Chapter 5.3) */}
        {activeSubTab === 'feed' && (
          <div className="space-y-6">
            
            <div className="flex items-center justify-between border-b border-[#13304c] pb-3">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-cyan-300 animate-pulse" />
                <h2 className="text-sm font-serif font-bold text-[#E8EEF0] uppercase tracking-wider">
                  Friends Auditory Stream
                </h2>
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-[#0e273d] text-cyan-300 border border-[#1b4366]">
                  {friendsNotes.length} notes
                </span>
              </div>
              <p className="text-[11px] text-[#91B9C5]/60 font-mono hidden sm:block">
                Public & Friends-only notes from your circle
              </p>
            </div>

            {isLoadingFeed ? (
              <div className="py-16 text-center text-xs text-[#91B9C5]/60 flex items-center justify-center gap-2">
                <Disc className="w-4 h-4 animate-spin text-cyan-300" />
                <span>Synchronizing friends feed...</span>
              </div>
            ) : friendsNotes.length === 0 ? (
              <div className="py-16 rounded-3xl bg-[#091d30]/50 border border-[#143552] flex flex-col items-center justify-center text-center p-6 space-y-3">
                <Users className="w-10 h-10 text-[#91B9C5]/40" />
                <h3 className="text-sm font-bold text-[#E8EEF0]">Your Friends Feed is Quiet</h3>
                <p className="text-xs text-[#91B9C5]/70 max-w-sm">
                  Connect with friends in the Friendship Hub to listen to their shared music notes here.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveSubTab('hub')}
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-[#071523] text-xs font-bold transition-all shadow-md cursor-pointer"
                >
                  Explore Friendship Hub
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
                {friendsNotes.map((note) => (
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
          </div>
        )}

        {/* SUB-TAB B: FRIENDSHIP HUB (Chapter 5.4 Wireframe) */}
        {activeSubTab === 'hub' && (
          <div className="space-y-8 max-w-2xl mx-auto">
            
            {/* 1. FIND FRIENDS (Chapter 5.4 Wireframe) */}
            <div className="rounded-3xl bg-[#091d30]/70 border border-[#143552] p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-cyan-300" />
                <h3 className="text-xs font-mono font-bold text-[#E8EEF0] uppercase tracking-wider">
                  Find Friends
                </h3>
              </div>

              <form onSubmit={handleSearchUsers} className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#91B9C5]/60" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search username / name..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#061421] border border-[#183d5f] text-xs text-[#E8EEF0] focus:border-cyan-400 focus:outline-none placeholder-[#91B9C5]/40 font-mono"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSearching}
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-[#07131e] font-bold text-xs transition-colors cursor-pointer shrink-0"
                >
                  {isSearching ? 'Searching...' : 'Search'}
                </button>
              </form>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-[#122e47]">
                  <span className="text-[10px] font-mono text-[#91B9C5]/70 block">
                    Discovery Results ({searchResults.length})
                  </span>
                  {searchResults.map((person) => {
                    const isAlreadyFriend = friendsList.some(f => f.id === person.id);
                    const hasSent = sentRequestUserIds.has(person.id);

                    return (
                      <div
                        key={person.id}
                        className="p-3 rounded-2xl bg-[#071827] border border-[#153654] flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={person.avatarUrl}
                            alt={person.displayName}
                            className="w-9 h-9 rounded-xl object-cover border border-[#204d73] shrink-0"
                          />
                          <div className="min-w-0">
                            <h5 className="text-xs font-bold text-[#E8EEF0] truncate">
                              {person.displayName}
                            </h5>
                            <p className="text-[10px] text-[#91B9C5]/70 font-mono truncate">
                              {person.handle} · {person.audiophileRank}
                            </p>
                          </div>
                        </div>

                        {isAlreadyFriend ? (
                          <span className="px-3 py-1.5 rounded-xl bg-[#0c2438] text-cyan-300 border border-cyan-500/30 text-[10px] font-bold font-mono">
                            Connected
                          </span>
                        ) : hasSent ? (
                          <span className="px-3 py-1.5 rounded-xl bg-[#12293d] text-[#91B9C5]/80 text-[10px] font-bold font-mono">
                            Pending
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSendRequest(person)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-200 border border-cyan-500/40 text-xs font-bold transition-all cursor-pointer"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>Add</span>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 2. PENDING REQUESTS (Chapter 5.4 Wireframe) */}
            <div className="rounded-3xl bg-[#091d30]/70 border border-[#143552] p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-amber-300" />
                  <h3 className="text-xs font-mono font-bold text-[#E8EEF0] uppercase tracking-wider">
                    Pending Requests
                  </h3>
                </div>
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-[#0e273d] text-amber-300 border border-amber-500/30">
                  {pendingRequests.length}
                </span>
              </div>

              {pendingRequests.length === 0 ? (
                <p className="text-xs text-[#91B9C5]/60 font-mono py-2 text-center">
                  No pending friendship invitations.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {pendingRequests.map((req) => {
                    const reqUser = req.requester || {
                      displayName: 'Julian Vance',
                      handle: '@julianv',
                      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100',
                      audiophileRank: 'Vinyl Archivist',
                    };

                    return (
                      <div
                        key={req.id}
                        className="p-3.5 rounded-2xl bg-[#061421] border border-[#193d5f] flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={reqUser.avatarUrl}
                            alt={reqUser.displayName}
                            className="w-10 h-10 rounded-xl object-cover border border-[#204d73] shrink-0"
                          />
                          <div className="min-w-0">
                            <h5 className="text-xs font-bold text-[#E8EEF0] truncate">
                              {reqUser.displayName}
                            </h5>
                            <p className="text-[10px] text-[#91B9C5]/70 font-mono truncate">
                              {reqUser.handle} · {reqUser.audiophileRank}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleAcceptRequest(req.id, reqUser.displayName)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-[#07131e] text-xs font-bold transition-colors cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            <span>Accept</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRejectRequest(req.id)}
                            className="p-1.5 rounded-xl hover:bg-[#142e47] text-[#91B9C5] hover:text-rose-300 transition-colors cursor-pointer"
                            title="Decline"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 3. MY FRIENDS (Chapter 5.4 Wireframe) */}
            <div className="rounded-3xl bg-[#091d30]/70 border border-[#143552] p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-cyan-300" />
                  <h3 className="text-xs font-mono font-bold text-[#E8EEF0] uppercase tracking-wider">
                    My Friends
                  </h3>
                </div>
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-[#0e273d] text-cyan-300 border border-[#1b4366]">
                  {friendsList.length} Friends
                </span>
              </div>

              {friendsList.length === 0 ? (
                <p className="text-xs text-[#91B9C5]/60 font-mono py-2 text-center">
                  You haven't added any friends yet.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {friendsList.map((friend) => (
                    <div
                      key={friend.id}
                      className="p-3.5 rounded-2xl bg-[#061421] border border-[#153654] flex items-center justify-between gap-3 hover:border-[#1d4870] transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={friend.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                          alt={friend.displayName}
                          className="w-10 h-10 rounded-xl object-cover border border-[#204d73] shrink-0"
                        />
                        <div className="min-w-0">
                          <h5 className="text-xs font-bold text-[#E8EEF0] truncate">
                            {friend.displayName}
                          </h5>
                          <p className="text-[10px] text-[#91B9C5]/70 font-mono truncate">
                            {friend.handle || '@friend'} · {friend.audiophileRank || 'Audiophile'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {/* Chapter 5.4: [VIEW PROFILE] button */}
                        <button
                          type="button"
                          onClick={() => setViewingProfileFriend(friend)}
                          className="px-3 py-1.5 rounded-xl bg-[#0e273d] hover:bg-[#143552] text-[#91B9C5] hover:text-white border border-[#1b4366] text-xs font-medium transition-colors cursor-pointer"
                        >
                          View Profile
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRemoveFriend(friend, friend.displayName)}
                          className="p-1.5 rounded-xl hover:bg-rose-950/40 text-[#91B9C5]/50 hover:text-rose-400 transition-colors cursor-pointer"
                          title="Unfriend"
                        >
                          <UserMinus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

      </div>

      {/* 3. REPLY WITH SONG MODAL (Chapter 9) */}
      <ReplyWithSongModal
        isOpen={Boolean(replyModalNote)}
        onClose={() => setReplyModalNote(null)}
        note={replyModalNote}
        onSuccess={handleReplySuccess}
      />

      {/* 4. VIEW FRIEND PROFILE MODAL */}
      {viewingProfileFriend && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-sm rounded-3xl bg-[#091e30] border border-[#1b4366] p-6 shadow-2xl space-y-4 text-center">
            <button
              type="button"
              onClick={() => setViewingProfileFriend(null)}
              className="absolute top-4 right-4 p-1 rounded-full text-[#91B9C5] hover:text-white hover:bg-[#122e47]"
            >
              <X className="w-4 h-4" />
            </button>

            <img
              src={viewingProfileFriend.avatarUrl}
              alt={viewingProfileFriend.displayName}
              className="w-20 h-20 rounded-3xl object-cover border-2 border-[#204d73] mx-auto shadow-lg"
            />

            <div>
              <h4 className="text-base font-serif font-bold text-[#E8EEF0]">
                {viewingProfileFriend.displayName}
              </h4>
              <p className="text-xs font-mono text-cyan-300">
                {viewingProfileFriend.handle}
              </p>
            </div>

            <p className="text-xs text-[#91B9C5]/80 leading-relaxed font-sans">
              {viewingProfileFriend.bio || 'Connected music listener on SAY.'}
            </p>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setViewingProfileFriend(null)}
                className="w-full py-2 rounded-xl bg-[#143552] hover:bg-[#1c476d] text-xs font-bold text-[#E8EEF0] transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
