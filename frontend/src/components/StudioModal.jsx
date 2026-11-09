import React, { useState, useMemo, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { usePlayerStore } from '../store/playerStore';
import { noteService } from '../services/noteService';
import MusicNoteCard from './MusicNoteCard';
import TemplateSelector from './composer/TemplateSelector';
import TrackSelector from './composer/TrackSelector';
import AudioSnippetSelector from './composer/AudioSnippetSelector';
import PersonalContentEditor from './composer/PersonalContentEditor';
import { X, Sparkles, Send, Eye, Volume2, Plus } from 'lucide-react';
import { toast } from 'react-toastify';
import { formatTime } from '../services/musicService';

export default function StudioModal({ onNoteCreated }) {
  const { user, isStudioOpen, setStudioOpen } = useAuthStore();
  const { setLooping, stopTrack, playTrack, pauseTrack, isPlaying, currentTrack } = usePlayerStore();

  // Stop background feed music immediately whenever the Studio Modal is opened
  useEffect(() => {
    if (isStudioOpen) {
      stopTrack();
      setLooping(true);
    }
  }, [isStudioOpen, stopTrack, setLooping]);

  // Core Form State (Preserved seamlessly when switching templates)
  const [templateType, setTemplateType] = useState('CASSETTE'); // RECEIPTIFY | CASSETTE | STAMP | VINYL
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [snippetStart, setSnippetStart] = useState(10);
  const [snippetDuration, setSnippetDuration] = useState(30);
  const [caption, setCaption] = useState('');
  const [lyricSnippet, setLyricSnippet] = useState('');
  const [emotionTag, setEmotionTag] = useState('🌙 Melancholic');
  const [stickerBadge, setStickerBadge] = useState('Moon');
  const [visibility, setVisibility] = useState('PUBLIC'); // PUBLIC | FRIENDS_ONLY
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Close & Reset: Stop background preview playback immediately
  const handleClose = () => {
    stopTrack();
    setLooping(false);
    setStudioOpen(false);
  };

  const resetForm = () => {
    stopTrack();
    setLooping(false);
    setSelectedTrack(null);
    setSnippetStart(10);
    setSnippetDuration(30);
    setCaption('');
    setLyricSnippet('');
    setEmotionTag('🌙 Melancholic');
    setStickerBadge('Moon');
    setVisibility('PUBLIC');
  };

  // Real-time Preview Note Object
  const previewNote = useMemo(() => ({
    id: 'studio-preview-id',
    userDisplayName: user?.displayName || 'Audiophile',
    handle: user?.handle || (user?.username ? `@${user.username}` : '@listener'),
    userAvatarUrl: user?.avatarUrl,
    timeAgo: 'Just now',
    songTitle: selectedTrack?.songTitle || 'Select or Paste a Track',
    artistName: selectedTrack?.artistName || 'Awaiting Music Link',
    songImageUrl: selectedTrack?.songImageUrl || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500',
    externalSongUrl: selectedTrack?.externalSongUrl || '',
    previewAudioUrl: selectedTrack?.previewAudioUrl || selectedTrack?.externalSongUrl || '',
    audioSnippetStart: snippetStart,
    audioSnippetEnd: snippetStart + snippetDuration,
    snippetDuration,
    templateType: `${templateType}:${snippetDuration}`,
    emotionTag,
    stickerBadge,
    caption,
    lyricSnippet,
    visibility,
    likesCount: 0,
    dialogues: [],
  }), [
    user,
    selectedTrack,
    snippetStart,
    snippetDuration,
    templateType,
    emotionTag,
    stickerBadge,
    caption,
    lyricSnippet,
    visibility,
  ]);

  // Preview Playback State & Instant Trigger
  const isPreviewPlaying = isPlaying && (currentTrack?.id === previewNote.id || currentTrack?.externalSongUrl === previewNote.externalSongUrl);

  const handlePreviewPlayToggle = (e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (!selectedTrack?.externalSongUrl) {
      toast.info("Please search or paste a music track link first to test audio playback.");
      return;
    }
    if (isPreviewPlaying) {
      pauseTrack();
    } else {
      playTrack(previewNote, { snippetStart, snippetDuration, loop: true });
    }
  };

  // Publish Note Validation & Submission
  const handlePublishNote = async () => {
    if (!selectedTrack || !selectedTrack.songTitle || !selectedTrack.externalSongUrl) {
      toast.error('Please search or paste a valid music track before publishing.');
      return;
    }

    if (!user?.id) {
      toast.error('You must be signed in to publish a Music Note.');
      return;
    }

    const validTemplates = ['RECEIPTIFY', 'CASSETTE', 'STAMP', 'VINYL', 'GALAXY'];
    if (!validTemplates.includes(templateType.toUpperCase())) {
      toast.error('Please choose a valid physical template.');
      return;
    }

    setIsSubmitting(true);

    const cleanUrl = selectedTrack.externalSongUrl.trim();
    const finalUrl = cleanUrl.includes('#') ? cleanUrl : `${cleanUrl}#snippetDur=${snippetDuration}`;

    const payload = {
      userId: user.id,
      songTitle: selectedTrack.songTitle.trim(),
      artistName: selectedTrack.artistName.trim(),
      songImageUrl: selectedTrack.songImageUrl.trim(),
      externalSongUrl: finalUrl,
      audioSnippetStart: Number(snippetStart) || 0,
      templateType: templateType.toUpperCase(),
      emotionTag: emotionTag.trim(),
      caption: caption.trim(),
      lyricSnippet: lyricSnippet.trim(),
      stickerBadge: stickerBadge.trim(),
      visibility: visibility.toUpperCase(),
    };

    try {
      const created = await noteService.createNote(payload);
      toast.success(`Published "${payload.songTitle}" to your soundscape!`);
      stopTrack();
      setLooping(false);
      resetForm();
      if (onNoteCreated && created) {
        onNoteCreated(created);
      }
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('say_note_created', { detail: created }));
      }
      setStudioOpen(false);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to publish note to server';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isStudioOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-xl overflow-hidden animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      {/* Click outside backdrop */}
      <div className="fixed inset-0" onClick={handleClose} />

      {/* Main Studio Modal Window */}
      <div className="relative z-10 w-full max-w-[1180px] my-auto bg-[#0d1015] border border-white/10 rounded-3xl shadow-[0_30px_90px_rgba(0,0,0,0.9)] flex flex-col overflow-hidden max-h-[92vh]">
        
        {/* Header Bar: Trendy, minimalist with Discard & Publish Note */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between shrink-0 bg-[#0a0d12]">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="p-1 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-base sm:text-lg font-serif font-bold tracking-tight text-white">
              Write your note
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-3.5 py-1.5 rounded-xl text-xs font-mono text-neutral-400 hover:text-white transition-colors cursor-pointer"
            >
              Discard
            </button>
            <button
              type="button"
              onClick={handlePublishNote}
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-neutral-200 hover:bg-white text-neutral-900 font-mono text-xs font-bold tracking-wide transition-all shadow-sm cursor-pointer disabled:opacity-50 flex items-center gap-1.5 active:scale-95"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>{isSubmitting ? 'Publishing...' : 'Publish Note'}</span>
            </button>
          </div>
        </div>

        {/* Modal Body: Left Column (Editor) vs Right Column (Live Preview) */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          
          {/* ============================================================== */}
          {/* LEFT COLUMN: THE COMPOSER EDITOR                                */}
          {/* ============================================================== */}
          <div className="flex-1 p-4 sm:p-6 space-y-4 overflow-y-auto overscroll-contain custom-scrollbar">
            
            {/* 1. Choose Physical Template */}
            <TemplateSelector
              selectedTemplate={templateType}
              onSelectTemplate={(tpl) => setTemplateType(tpl)}
            />

            {/* 2. Select Track (iTunes API vs YouTube Link) */}
            <TrackSelector
              selectedTrack={selectedTrack}
              onSelectTrack={(track) => {
                setSelectedTrack(track);
                const startSec = Number(track.audioSnippetStart) || 0;
                setSnippetStart(startSec);
                loadTrack(track, {
                  snippetStart: startSec,
                  snippetDuration: snippetDuration,
                  autoPlay: false,
                });
              }}
              onClearTrack={() => {
                setSelectedTrack(null);
                stopTrack();
              }}
            />

            {/* 3. Audio Snippet Scrubber */}
            <AudioSnippetSelector
              selectedTrack={selectedTrack}
              snippetStart={snippetStart}
              onSnippetStartChange={setSnippetStart}
              snippetDuration={snippetDuration}
              onSnippetDurationChange={setSnippetDuration}
            />

            {/* 4. Personal Content (Caption & Lyric Snippet) + Mood & Sticker + Visibility */}
            <PersonalContentEditor
              caption={caption}
              onCaptionChange={setCaption}
              lyricSnippet={lyricSnippet}
              onLyricSnippetChange={setLyricSnippet}
              emotionTag={emotionTag}
              onEmotionTagChange={setEmotionTag}
              stickerBadge={stickerBadge}
              onStickerBadgeChange={setStickerBadge}
              visibility={visibility}
              onVisibilityChange={setVisibility}
            />

          </div>

          {/* ============================================================== */}
          {/* RIGHT COLUMN: REAL-TIME LIVE PREVIEW                            */}
          {/* ============================================================== */}
          <div className="w-full lg:w-[460px] bg-[#071524] border-t lg:border-t-0 lg:border-l border-sky-500/20 p-5 sm:p-6 flex flex-col items-center justify-between shrink-0 overflow-y-auto custom-scrollbar relative">
            <div className="absolute inset-0 bg-gradient-to-b from-[#00594c]/15 via-transparent to-sky-500/10 pointer-events-none" />
            
            {/* Minimalist Live Header */}
            <div className="w-full flex items-center justify-between pb-3 border-b border-sky-500/20 text-xs font-mono text-slate-400 relative z-10">
              <span className="font-bold tracking-wider text-sky-100 uppercase text-[11px]">
                LIVE NOTE ARTIFACT
              </span>
              <span className="flex items-center gap-1.5 text-[10px] text-sky-300 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00594c] shadow-[0_0_6px_rgba(0,89,76,0.9)] animate-pulse" />
                <span>LIVE PREVIEW</span>
              </span>
            </div>

            {/* The Live Physical Card Rendering */}
            <div className="w-full my-auto flex items-center justify-center py-4 relative z-10">
              <MusicNoteCard 
                note={previewNote}
                isActive={true}
                isPlaying={isPreviewPlaying}
                onPlayToggle={handlePreviewPlayToggle}
              />
            </div>

            {/* Minimalist Studio Footer */}
            <div className="w-full pt-3 border-t border-sky-500/20 flex items-center justify-between text-[11px] font-mono text-slate-400 relative z-10">
              <span>Snippet: {formatTime(snippetStart)} – {formatTime(snippetStart + snippetDuration)}</span>
              <span className="flex items-center gap-1 text-sky-300">
                <Volume2 className="w-3.5 h-3.5" />
                <span>Click card to listen</span>
              </span>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
