import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { usePlayerStore } from '../store/playerStore';
import { Play, Pause, MessageCircle, ExternalLink, Send, Quote, Sparkles } from 'lucide-react';
import { noteService } from '../services/noteService';

export default function MusicCard({ note, onReplyAdded }) {
  const { currentTrack, isPlaying, playTrack, togglePlay } = usePlayerStore();
  const [showReplies, setShowReplies] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replies, setReplies] = useState([]);
  const [loadingReplies, setLoadingReplies] = useState(false);

  const isCurrentPlaying = currentTrack?.id === note.id && isPlaying;

  const handlePlayToggle = () => {
    if (currentTrack?.id === note.id) {
      togglePlay();
    } else {
      playTrack(note, note.audioSnippetStart || 0);
    }
  };

  const handleToggleReplies = async () => {
    if (!showReplies && replies.length === 0) {
      setLoadingReplies(true);
      try {
        const data = await noteService.getReplies(note.id);
        setReplies(data || []);
      } catch (err) {
        console.error("Failed to load replies:", err);
      } finally {
        setLoadingReplies(false);
      }
    }
    setShowReplies(!showReplies);
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    try {
      const newReply = await noteService.createReply({
        parentNoteId: note.id,
        userId: note.userId, // mock session
        songTitle: "Echoing Track",
        artistName: "Dialogue Reply",
        songImageUrl: note.songImageUrl,
        externalSongUrl: note.externalSongUrl,
        replyCaption: replyText.trim(),
      });
      setReplies(prev => [...prev, newReply]);
      setReplyText('');
      toast.success("Song Dialogue reply added!");
      if (onReplyAdded) onReplyAdded(note.id);
    } catch (err) {
      console.error("Failed to post reply:", err);
      toast.error(err.message || "Failed to post song reply");
    }
  };

  const template = (note.templateType || 'RECEIPTIFY').toUpperCase();

  return (
    <article className="bg-[#142C40]/80 border border-[#31566A]/40 rounded-3xl p-5 shadow-xl transition-all duration-300 hover:border-[#91B9C5]/50 hover:shadow-2xl flex flex-col justify-between">
      
      {/* Author Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <img
            src={note.userAvatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100"}
            alt={note.userDisplayName}
            className="w-10 h-10 rounded-full object-cover border border-[#91B9C5]/40"
          />
          <div>
            <h4 className="text-sm font-bold text-[#E8EEF0] leading-tight">{note.userDisplayName || "Audiophile"}</h4>
            <span className="text-[10px] text-[#91B9C5] font-mono">{note.userAudiophileRank || "Novice Listener"}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {note.emotionTag && (
            <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-[#31566A]/50 text-[#91B9C5] border border-[#91B9C5]/20 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#B39DDB]" />
              {note.emotionTag}
            </span>
          )}
        </div>
      </div>

      {/* Visual Template Body */}
      <div className="mb-4">
        {/* VINYL TEMPLATE */}
        {template === 'VINYL' && (
          <div className="relative flex items-center justify-center p-3 bg-[#081724]/60 rounded-2xl border border-[#31566A]/30 overflow-hidden">
            <div className="relative z-10 w-44 h-44 rounded-xl overflow-hidden shadow-2xl">
              <img src={note.songImageUrl} alt={note.songTitle} className="w-full h-full object-cover" />
            </div>
            {/* Extended Vinyl Disk */}
            <div className={`absolute right-4 w-40 h-40 rounded-full bg-black border-4 border-neutral-800 shadow-2xl flex items-center justify-center ${isCurrentPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }}>
              <div className="w-14 h-14 rounded-full border-2 border-[#91B9C5]/50 overflow-hidden">
                <img src={note.songImageUrl} alt="vinyl center" className="w-full h-full object-cover opacity-80" />
              </div>
            </div>
          </div>
        )}

        {/* CASSETTE TEMPLATE */}
        {template === 'CASSETTE' && (
          <div className="bg-gradient-to-b from-[#2a3a48] to-[#121e28] rounded-2xl p-4 border-2 border-[#31566A] shadow-inner text-[#E8EEF0]">
            <div className="flex justify-between items-center text-[10px] font-mono tracking-widest text-[#91B9C5] mb-2 uppercase">
              <span>Stereo Chrome • A-Side</span>
              <span>30s Snippet</span>
            </div>
            <div className="bg-[#081724] rounded-xl p-3 flex items-center justify-around border border-[#31566A]/50">
              <div className={`w-10 h-10 rounded-full border-2 border-dashed border-[#91B9C5] ${isCurrentPlaying ? 'animate-spin' : ''}`} />
              <div className="h-6 w-24 bg-[#142C40] rounded border border-[#31566A] flex items-center justify-center text-[9px] font-mono text-[#91B9C5]">
                {note.audioSnippetStart || 0}s ~ {(note.audioSnippetStart || 0) + 30}s
              </div>
              <div className={`w-10 h-10 rounded-full border-2 border-dashed border-[#91B9C5] ${isCurrentPlaying ? 'animate-spin' : ''}`} />
            </div>
          </div>
        )}

        {/* RECEIPTIFY TEMPLATE */}
        {template === 'RECEIPTIFY' && (
          <div className="bg-[#F2EDE3] text-[#081724] rounded-2xl p-4 font-mono text-xs shadow-lg border border-[#F2EDE3]/20">
            <div className="text-center font-extrabold tracking-widest border-b border-neutral-300 pb-2 mb-2 uppercase">
              SAY SOUND RECEIPT
            </div>
            <div className="flex justify-between text-[11px] mb-1">
              <span className="font-semibold truncate max-w-[170px]">{note.songTitle}</span>
              <span>1x TRACK</span>
            </div>
            <div className="text-[10px] text-neutral-600 mb-2">{note.artistName}</div>
            <div className="border-t border-dashed border-neutral-400 pt-2 flex justify-between text-[10px]">
              <span>START TIME</span>
              <span>{note.audioSnippetStart || 0}s</span>
            </div>
          </div>
        )}

        {/* STAMP TEMPLATE */}
        {template === 'STAMP' && (
          <div className="p-3 bg-[#142C40] border-2 border-dashed border-[#91B9C5]/50 rounded-2xl flex gap-3 items-center">
            <img src={note.songImageUrl} alt={note.songTitle} className="w-20 h-20 rounded-lg object-cover shadow" />
            <div className="flex-1">
              <span className="text-[9px] font-mono text-[#B39DDB] uppercase tracking-wider block">Sonic Postage 2026</span>
              <p className="font-bold text-sm text-[#E8EEF0]">{note.songTitle}</p>
              <p className="text-xs text-[#91B9C5]">{note.artistName}</p>
            </div>
          </div>
        )}
      </div>

      {/* Song Metadata & Play Control */}
      <div className="flex items-center justify-between gap-3 bg-[#081724]/70 p-3 rounded-2xl border border-[#31566A]/30 mb-3">
        <button
          onClick={handlePlayToggle}
          className="w-11 h-11 rounded-xl bg-[#91B9C5] text-[#081724] flex items-center justify-center hover:scale-105 transition-all shadow-md"
        >
          {isCurrentPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
        </button>

        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-sm text-[#E8EEF0] truncate leading-tight">{note.songTitle}</h3>
          <p className="text-xs text-[#91B9C5] truncate">{note.artistName}</p>
        </div>

        <a
          href={note.externalSongUrl}
          target="_blank"
          rel="noreferrer"
          className="p-2 rounded-lg text-[#91B9C5]/60 hover:text-[#91B9C5] hover:bg-[#142C40] transition-colors"
          title="Open in Spotify/YouTube"
        >
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>

      {/* Lyric Snippet or Caption */}
      {note.lyricSnippet && (
        <div className="mb-3 px-3 py-2.5 rounded-xl bg-[#142C40]/50 border-l-2 border-[#B39DDB] text-xs italic text-[#E8EEF0]/90 flex items-start gap-2">
          <Quote className="w-3.5 h-3.5 text-[#B39DDB] shrink-0 mt-0.5" />
          <span>"{note.lyricSnippet}"</span>
        </div>
      )}

      {note.caption && (
        <p className="text-xs text-[#E8EEF0]/80 mb-3 px-1">{note.caption}</p>
      )}

      {/* Reply Action Toggle */}
      <div className="pt-2 border-t border-[#31566A]/30 flex items-center justify-between">
        <button
          onClick={handleToggleReplies}
          className="flex items-center gap-1.5 text-xs text-[#91B9C5] hover:text-white transition-colors"
        >
          <MessageCircle className="w-4 h-4" />
          <span>Song Dialogues ({replies.length})</span>
        </button>
        <span className="text-[10px] text-[#91B9C5]/60 font-mono">
          {new Date(note.createdAt).toLocaleDateString()}
        </span>
      </div>

      {/* Replies Accordion */}
      {showReplies && (
        <div className="mt-3 pt-3 border-t border-[#31566A]/30 space-y-2">
          {loadingReplies ? (
            <p className="text-xs text-[#91B9C5] text-center py-2 font-mono">Loading dialogue...</p>
          ) : replies.length === 0 ? (
            <p className="text-xs text-[#91B9C5]/60 text-center py-2">No song replies yet. Start the dialogue!</p>
          ) : (
            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {replies.map(r => (
                <div key={r.id} className="bg-[#081724]/70 p-2.5 rounded-xl border border-[#31566A]/30 text-xs">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-[#91B9C5] text-[11px]">{r.userDisplayName}</span>
                    <span className="text-[9px] text-neutral-400 font-mono">🎵 {r.songTitle}</span>
                  </div>
                  <p className="text-[#E8EEF0]/90">{r.replyCaption}</p>
                </div>
              ))}
            </div>
          )}

          {/* Add Reply Input */}
          <form onSubmit={handleSendReply} className="flex gap-2 mt-2">
            <input
              type="text"
              placeholder="Reply with your song reaction..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className="flex-1 bg-[#081724] border border-[#31566A] rounded-xl px-3 py-1.5 text-xs text-[#E8EEF0] focus:outline-none focus:border-[#91B9C5]"
            />
            <button
              type="submit"
              className="bg-[#31566A] hover:bg-[#91B9C5] hover:text-[#081724] text-[#E8EEF0] px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}

    </article>
  );
}
