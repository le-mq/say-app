import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useAuthStore } from '../store/authStore';
import { socialService } from '../services/socialService';
import { Users, UserPlus, Check, X, Disc } from 'lucide-react';

const MOCK_FRIENDS = [
  {
    friendshipId: 'fs-1',
    friendId: 'u-2',
    displayName: 'Aria Melodia',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100',
    audiophileRank: 'Vinyl Connoisseur',
    bio: 'Late night jazz, analog synths, and cup of warm matcha.'
  },
  {
    friendshipId: 'fs-2',
    friendId: 'u-3',
    displayName: 'Dorian Beats',
    avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100',
    audiophileRank: 'Crate Digger',
    bio: 'Sampling Tokyo train sounds into ambient dub.'
  }
];

export default function Friends() {
  const { user } = useAuthStore();
  const [friends, setFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [targetId, setTargetId] = useState('');
  const [loading, setLoading] = useState(true);

  const loadSocialData = async () => {
    setLoading(true);
    try {
      const flist = await socialService.getFriendsList(user.id);
      setFriends(flist && flist.length > 0 ? flist : MOCK_FRIENDS);
    } catch (err) {
      setFriends(MOCK_FRIENDS);
    }

    try {
      const reqs = await socialService.getPendingRequests(user.id);
      setPendingRequests(reqs || []);
    } catch (err) {
      setPendingRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSocialData();
  }, [user.id]);

  const handleSendRequest = async (e) => {
    e.preventDefault();
    if (!targetId.trim()) return;
    try {
      await socialService.sendFriendRequest(user.id, targetId.trim());
      toast.success("Friend request sent!");
      setTargetId('');
      loadSocialData();
    } catch (err) {
      toast.error("Failed to send request: " + err.message);
    }
  };

  const handleAccept = async (friendshipId) => {
    try {
      await socialService.acceptFriendRequest(friendshipId, user.id);
      toast.success("Friend request accepted!");
      loadSocialData();
    } catch (err) {
      toast.error(err.message || "Failed to accept");
    }
  };

  const handleReject = async (friendshipId) => {
    try {
      await socialService.rejectFriendRequest(friendshipId, user.id);
      toast.info("Friend request declined");
      loadSocialData();
    } catch (err) {
      toast.error(err.message || "Failed to decline");
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 pb-32 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#E8EEF0] tracking-tight">Sound Community</h1>
          <p className="text-xs text-[#91B9C5]">Connect with fellow listeners and exchange song dialogues</p>
        </div>

        {/* Add Friend Form */}
        <form onSubmit={handleSendRequest} className="flex gap-2">
          <input
            type="text"
            placeholder="Enter User UUID..."
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
            className="bg-[#142C40] border border-[#31566A] rounded-xl px-3 py-2 text-xs text-[#E8EEF0] focus:outline-none focus:border-[#91B9C5] w-56"
          />
          <button
            type="submit"
            className="bg-[#91B9C5] text-[#081724] font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Connect
          </button>
        </form>
      </div>

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <section className="bg-[#142C40]/60 border border-[#91B9C5]/40 rounded-3xl p-5 shadow">
          <h2 className="text-sm font-bold text-[#E8EEF0] mb-3">Pending Friend Requests ({pendingRequests.length})</h2>
          <div className="space-y-2">
            {pendingRequests.map(req => (
              <div key={req.id} className="flex items-center justify-between bg-[#081724] p-3 rounded-2xl border border-[#31566A]/40">
                <div className="flex items-center gap-3">
                  <img src={req.requesterAvatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80"} alt="" className="w-9 h-9 rounded-full object-cover" />
                  <div>
                    <p className="text-xs font-bold text-[#E8EEF0]">{req.requesterDisplayName}</p>
                    <span className="text-[10px] text-[#91B9C5] font-mono">Wants to share sound notes</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAccept(req.id)}
                    className="p-1.5 bg-[#91B9C5] text-[#081724] rounded-lg hover:scale-105 transition-transform"
                    title="Accept"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleReject(req.id)}
                    className="p-1.5 bg-[#31566A]/50 text-red-300 rounded-lg hover:bg-red-950/40 transition-colors"
                    title="Reject"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Friends List */}
      <section className="bg-[#142C40]/80 border border-[#31566A]/40 rounded-3xl p-6 shadow-xl">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-[#91B9C5]" />
          <h2 className="text-lg font-bold text-[#E8EEF0]">Your Audiophile Circle ({friends.length})</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {friends.map(f => (
            <div
              key={f.friendshipId || f.friendId}
              className="bg-[#081724]/70 border border-[#31566A]/30 p-4 rounded-2xl flex items-start gap-3.5 hover:border-[#91B9C5]/40 transition-all"
            >
              <img
                src={f.avatarUrl}
                alt={f.displayName}
                className="w-12 h-12 rounded-full object-cover ring-2 ring-[#91B9C5]/30 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-[#E8EEF0] truncate">{f.displayName}</h3>
                  <span className="text-[10px] font-mono text-[#B39DDB]">{f.audiophileRank}</span>
                </div>
                <p className="text-xs text-[#91B9C5]/80 line-clamp-2 mt-1">{f.bio}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
