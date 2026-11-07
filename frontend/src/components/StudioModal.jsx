import React, { useState, useMemo, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { usePlayerStore } from '../store/playerStore';
import { noteService } from '../services/noteService';
import MusicNoteCard from './MusicNoteCard';
import TemplateSelector from './composer/TemplateSelector';
import TrackSelector from './composer/TrackSelector';
import AudioSnippetSelector from './composer/AudioSnippetSelector';
import PersonalContentEditor from './composer/PersonalContentEditor';
import { X, Sparkles, Send, Eye, AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';

export default function StudioModal({ onNoteCreated }) {
  const { user, isStudioOpen, setStudioOpen } = useAuthStore();
  const { setLooping, stopTrack, loadTrack } = usePlayerStore();

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

  // Real-time Preview Note Object (Chapter 8.2)
  const previewNote = useMemo(() => ({
    id: 'studio-preview-id',
    userDisplayName: user?.displayName || 'Audiophile',
    handle: user?.handle || '@listener',
    userAvatarUrl: user?.avatarUrl,
    timeAgo: 'Just now',
    songTitle: selectedTrack?.songTitle || 'Select a Song to Preview',
    artistName: selectedTrack?.artistName || 'Artist Name',
    songImageUrl: selectedTrack?.songImageUrl || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500',
    externalSongUrl: selectedTrack?.externalSongUrl || '',
    audioSnippetStart: snippetStart,
    audioSnippetEnd: snippetStart + snippetDuration,
    templateType,
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

  // Publish Note Validation & Submission (Chapter 8.9)
  const handlePublishNote = async () => {
    // 1. Mandatory Valid Track Validation
    if (!selectedTrack || !selectedTrack.songTitle || !selectedTrack.externalSongUrl) {
      toast.error('Please search or paste a valid music track before publishing.');
      return;
    }

    // 2. Authentication Check
    if (!user?.id) {
      toast.error('You must be signed in to publish a Music Note.');
      return;
    }

    // 3. Template Validation
    const validTemplates = ['RECEIPTIFY', 'CASSETTE', 'STAMP', 'VINYL'];
    if (!validTemplates.includes(templateType.toUpperCase())) {
      toast.error('Please choose a valid physical template.');
      return;
    }

    if (!user?.id) {
      toast.error('Please sign in to compose and publish a note.');
      return;
    }

    setIsSubmitting(true);

    const payload = {
      userId: user.id,
      songTitle: selectedTrack.songTitle.trim(),
      artistName: selectedTrack.artistName.trim(),
      songImageUrl: selectedTrack.songImageUrl.trim(),
      externalSongUrl: selectedTrack.externalSongUrl.trim(),
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
      toast.success(`Published "${payload.songTitle}" to your collection!`);
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
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-[#05111d]/90 backdrop-blur-xl overflow-hidden animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      {/* Click outside backdrop */}
      <div className="fixed inset-0" onClick={handleClose} />

      {/* Main Studio Modal Window */}
      <div className="relative z-10 w-full max-w-[1180px] my-auto bg-[#091827] border border-[#16354d] rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.85)] flex flex-col overflow-hidden max-h-[92vh]">
        
        {/* Header Bar */}
        <div className="px-5 sm:px-7 py-3.5 border-b border-[#132c40] flex items-center justify-between shrink-0 bg-[#06121d]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm sm:text-base font-bold font-mono tracking-wider text-white uppercase">
              Create Music Note
            </h2>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-full bg-[#0c1f2e] hover:bg-[#15344d] text-[#91B9C5] hover:text-white transition-colors cursor-pointer"
            title="Close studio"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body: Left Column (Editor) vs Right Column (Live Preview) */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          
          {/* ============================================================== */}
          {/* LEFT COLUMN: THE COMPOSER EDITOR                                */}
          {/* ============================================================== */}
          <div className="flex-1 p-4 sm:p-6 space-y-4 overflow-y-auto overscroll-contain custom-scrollbar">
            
            {/* 1. Choose Template */}
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

            {/* Publish Action Bar */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2.5 rounded-xl border border-[#16354d] text-xs font-mono text-[#91B9C5] hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handlePublishNote}
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-[#07131e] font-mono text-xs font-extrabold tracking-wider shadow-lg shadow-cyan-950/60 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Publishing Note...' : 'Publish Note'}</span>
              </button>
            </div>

          </div>

          {/* ============================================================== */}
          {/* RIGHT COLUMN: REAL-TIME LIVE PREVIEW (Chapter 8.2)              */}
          {/* ============================================================== */}
          <div className="w-full lg:w-[440px] bg-[#06121d] border-t lg:border-t-0 lg:border-l border-[#132c40] p-4 sm:p-6 flex flex-col items-center justify-between shrink-0 overflow-y-auto custom-scrollbar">
            
            <div className="w-full flex items-center justify-between pb-3 border-b border-[#142c40] mb-3 text-xs font-mono text-[#91B9C5]">
              <span className="font-bold flex items-center gap-1.5 uppercase text-white">
                <Eye className="w-3.5 h-3.5 text-cyan-400" />
                <span>Live Note Preview</span>
              </span>
              <span className="text-[10px] text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30">
                {templateType}
              </span>
            </div>

            {/* The Live Physical Card Rendering */}
            <div className="w-full my-auto flex items-center justify-center">
              <MusicNoteCard 
                note={previewNote}
                isActive={true}
                isPlaying={false}
              />
            </div>

            {/* Helpful Studio Footer Tip */}
            <div className="w-full pt-3 border-t border-[#142c40] mt-3 text-center">
              <p className="text-[10px] font-mono text-[#91B9C5]/70">
                Switching templates preserves 100% of your entered music, lyrics & caption.
              </p>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
