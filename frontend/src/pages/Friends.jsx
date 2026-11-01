import React, { useState } from 'react';
import MusicCard from '../components/MusicCard';
import { Users, Radio, UserCheck, Plus, Sparkles } from 'lucide-react';
import { toast } from 'react-toastify';

const FRIENDS_NOTES = [
  {
    id: 'friend-note-1',
    userDisplayName: 'Marcus Webb',
    handle: '@marcusw',
    userAvatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
    timeAgo: '2h ago',
    songTitle: 'ALBERTO BALSALM TAPE DUB',
    artistName: 'Aphex Vibe',
    songImageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=500',
    externalSongUrl: 'https://open.spotify.com',
    audioSnippetStart: '0:15',
    audioSnippetEnd: '0:45',
    templateType: 'CASSETTE',
    emotionTag: '💬 Nostalgic',
    visibility: 'FRIENDS',
    lyricSnippet: 'Late night tea, rainy windows in Berlin.',
    caption: 'Cleaning tape heads with isopropyl and savoring quiet.',
    likesCount: 16,
    dialogues: [],
  },
  {
    id: 'friend-note-2',
    userDisplayName: 'Elena Rostova',
    handle: '@erostova',
    userAvatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200',
    timeAgo: '5h ago',
    songTitle: 'HOLOCENE ACOUSTIC CHILL',
    artistName: 'Bon Iver Style',
    songImageUrl: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=500',
    externalSongUrl: 'https://open.spotify.com',
    audioSnippetStart: '0:30',
    audioSnippetEnd: '1:00',
    templateType: 'STAMP',
    emotionTag: '🍃 Peaceful',
    lyricSnippet: 'And at once I knew I was not magnificent.',
    caption: 'Fog rolling off the pines in Bergen. Cold acoustic air.',
    likesCount: 22,
    dialogues: [],
  },
];

export default function Friends() {
  const [activeSubTab, setActiveSubTab] = useState('feed'); // 'feed' | 'hub'
  const [friendRequests, setFriendRequests] = useState([
    {
      id: 'req-1',
      displayName: 'Julian Vance',
      handle: '@julianv',
      audiophileRank: 'Ambient Specialist',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100',
    },
  ]);

  const handleAcceptRequest = (id, name) => {
    setFriendRequests(prev => prev.filter(r => r.id !== id));
    toast.success(`Connected with ${name}!`);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 pb-36">
      
      {/* 1. Header with Friends count & Sub-Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-5 h-5 text-[#91B9C5]" />
            <h1 className="text-xl sm:text-2xl font-bold text-[#E8EEF0]">
              Friends Space
            </h1>
            <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-[#142c40] text-[#91B9C5] border border-[#1f425f]">
              2 Friends
            </span>
          </div>
          <p className="text-xs text-[#91B9C5]/70 max-w-xl">
            Shared auditory diary with your inner circle. Private notes and acoustic dialogue.
          </p>
        </div>

        {/* Sub-Tabs: Friends Feed | Friendship Hub */}
        <div className="flex items-center gap-1 bg-[#0c1f2e] p-1 rounded-xl border border-[#16354d]">
          <button
            onClick={() => setActiveSubTab('feed')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
              activeSubTab === 'feed'
                ? 'bg-[#183952] text-[#E8EEF0] border border-[#235073]'
                : 'text-[#91B9C5]/70 hover:text-white'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Friends Feed</span>
          </button>

          <button
            onClick={() => setActiveSubTab('hub')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
              activeSubTab === 'hub'
                ? 'bg-[#183952] text-[#E8EEF0] border border-[#235073]'
                : 'text-[#91B9C5]/70 hover:text-white'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Friendship Hub ({friendRequests.length})</span>
          </button>
        </div>
      </div>

      {/* 2. Main Tab Content */}
      {activeSubTab === 'feed' ? (
        /* 2-COLUMN GRID MATCHING SCREENSHOT 2 */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6 justify-items-center w-full items-start">
          {FRIENDS_NOTES.map(note => (
            <MusicCard key={note.id} note={note} compact />
          ))}
        </div>
      ) : (
        /* Friendship Hub Tab */
        <div className="bg-[#0c1f2e] border border-[#16354d] rounded-2xl p-6 max-w-xl mx-auto">
          <h2 className="text-sm font-bold text-[#E8EEF0] font-mono mb-4 flex items-center gap-2">
            <span>Pending Acoustic Invitations</span>
          </h2>

          {friendRequests.length === 0 ? (
            <p className="text-xs text-[#91B9C5]/60 font-mono py-4 text-center">
              No pending connection requests.
            </p>
          ) : (
            <div className="space-y-3">
              {friendRequests.map(req => (
                <div key={req.id} className="flex items-center justify-between p-3 rounded-xl bg-[#081724] border border-[#193a54]">
                  <div className="flex items-center gap-3">
                    <img src={req.avatarUrl} alt={req.displayName} className="w-9 h-9 rounded-full object-cover" />
                    <div>
                      <p className="text-xs font-bold text-[#E8EEF0]">{req.displayName}</p>
                      <p className="text-[10px] text-[#91B9C5] font-mono">{req.handle} · {req.audiophileRank}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleAcceptRequest(req.id, req.displayName)}
                    className="px-3 py-1.5 rounded-lg bg-[#91B9C5] text-[#081724] font-mono text-xs font-bold hover:bg-[#a4cad6] transition-colors cursor-pointer"
                  >
                    Accept
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
