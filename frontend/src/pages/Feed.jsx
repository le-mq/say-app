import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { noteService } from '../services/noteService';
import MusicCard from '../components/MusicCard';
import { Sparkles, RefreshCw, Plus } from 'lucide-react';

const SAMPLE_NOTES = [
  {
    id: 'sample-1',
    userDisplayName: 'Luna Astralis',
    userAvatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
    userAudiophileRank: 'Vinyl Connoisseur',
    songTitle: 'Midnight City (Slowed + Reverb)',
    artistName: 'M83',
    songImageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500',
    externalSongUrl: 'https://open.spotify.com',
    audioSnippetStart: 45,
    templateType: 'VINYL',
    emotionTag: '🌙 Midnight Melancholy',
    lyricSnippet: 'The city is my church, it wraps in the blinding twilight...',
    caption: 'Nothing compares to 2AM city lights reflected on cold asphalt.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'sample-2',
    userDisplayName: 'Kai Soundscape',
    userAvatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
    userAudiophileRank: 'Crate Digger',
    songTitle: 'Weightless (Ambient Dub)',
    artistName: 'Marconi Union',
    songImageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=500',
    externalSongUrl: 'https://open.spotify.com',
    audioSnippetStart: 15,
    templateType: 'CASSETTE',
    emotionTag: '🌊 Ocean Ambient',
    lyricSnippet: 'Submerging completely into zero gravity.',
    caption: 'Recorded straight from a vintage tape deck found in Shibuya.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'sample-3',
    userDisplayName: 'Elena Vox',
    userAvatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100',
    userAudiophileRank: 'Sonic Curator',
    songTitle: 'Coffee & Cigarettes on Vinyl',
    artistName: 'Otis Redding',
    songImageUrl: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=500',
    externalSongUrl: 'https://open.spotify.com',
    audioSnippetStart: 60,
    templateType: 'RECEIPTIFY',
    emotionTag: '☕ Lo-Fi Warmth',
    lyricSnippet: 'Give me another cup of coffee, and let me hold your hand...',
    caption: 'Sunday morning aroma and crackles.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'sample-4',
    userDisplayName: 'Marcus Groove',
    userAvatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100',
    userAudiophileRank: 'Novice Listener',
    songTitle: 'Starfield Odyssey',
    artistName: 'Tycho',
    songImageUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500',
    externalSongUrl: 'https://open.spotify.com',
    audioSnippetStart: 30,
    templateType: 'STAMP',
    emotionTag: '✨ Dream Pop Glow',
    lyricSnippet: 'Golden horizons expanding beyond time.',
    caption: 'Postal stamp design for an interstellar journey.',
    createdAt: new Date().toISOString(),
  }
];

export default function Feed() {
  const { user, setStudioOpen } = useAuthStore();
  const [feedType, setFeedType] = useState('PUBLIC'); // 'PUBLIC' or 'FRIENDS'
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmotion, setSelectedEmotion] = useState('ALL');

  const fetchNotes = async () => {
    setLoading(true);
    try {
      let data = [];
      if (feedType === 'PUBLIC') {
        data = await noteService.getPublicFeed();
      } else {
        data = await noteService.getFriendsFeed(user.id);
      }
      setNotes((data && data.length > 0) ? data : SAMPLE_NOTES);
    } catch (err) {
      console.warn("Backend feed unavailable, displaying sample audiophile notes:", err);
      setNotes(SAMPLE_NOTES);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [feedType]);

  const filteredNotes = selectedEmotion === 'ALL'
    ? notes
    : notes.filter(n => n.emotionTag?.includes(selectedEmotion));

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 pb-32">
      
      {/* Feed Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-[#E8EEF0] tracking-tight">Sound Stream</h1>
          <p className="text-xs text-[#91B9C5]">Listen to snippets dropped by the community in real-time</p>
        </div>

        {/* Feed Type Switcher */}
        <div className="flex items-center gap-2 bg-[#142C40] p-1.5 rounded-2xl border border-[#31566A]/40">
          <button
            onClick={() => setFeedType('PUBLIC')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              feedType === 'PUBLIC'
                ? 'bg-[#91B9C5] text-[#081724] shadow'
                : 'text-[#91B9C5] hover:text-white'
            }`}
          >
            Public Feed
          </button>
          <button
            onClick={() => setFeedType('FRIENDS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              feedType === 'FRIENDS'
                ? 'bg-[#91B9C5] text-[#081724] shadow'
                : 'text-[#91B9C5] hover:text-white'
            }`}
          >
            Friends Circle
          </button>
        </div>
      </div>

      {/* Filter Emotion Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 no-scrollbar">
        {['ALL', 'Melancholy', 'Euphoria', 'Warmth', 'Ambient', 'Glow'].map(emo => (
          <button
            key={emo}
            onClick={() => setSelectedEmotion(emo)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
              selectedEmotion === emo
                ? 'bg-[#31566A] text-[#E8EEF0] border-[#91B9C5]'
                : 'bg-[#142C40]/60 text-[#91B9C5]/70 border-[#31566A]/30 hover:border-[#91B9C5]/40'
            }`}
          >
            {emo === 'ALL' ? 'All Emotions' : emo}
          </button>
        ))}
      </div>

      {/* Feed Notes Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-[#91B9C5] font-mono text-xs">
          <RefreshCw className="w-5 h-5 animate-spin mr-2" />
          Tuning analog frequencies...
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="text-center py-20 bg-[#142C40]/40 rounded-3xl border border-[#31566A]/30 p-8">
          <p className="text-sm text-[#E8EEF0] font-bold mb-2">No notes match this vibe yet.</p>
          <p className="text-xs text-[#91B9C5] mb-5">Be the first to drop a 30s track snippet!</p>
          <button
            onClick={() => setStudioOpen(true)}
            className="inline-flex items-center gap-2 bg-[#91B9C5] text-[#081724] font-bold text-xs px-5 py-2.5 rounded-xl shadow"
          >
            <Plus className="w-4 h-4" />
            Drop First Note
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {filteredNotes.map(note => (
            <MusicCard key={note.id} note={note} onReplyAdded={fetchNotes} />
          ))}
        </div>
      )}

    </div>
  );
}
