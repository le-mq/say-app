import React, { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import { useAuthStore } from '../store/authStore';
import { musicService } from '../services/musicService';
import { noteService } from '../services/noteService';
import { X, Search, Sparkles, Disc, AlertCircle } from 'lucide-react';

const TEMPLATES = [
  { id: 'RECEIPTIFY', label: 'Receiptify', desc: 'Minimalist thermal paper' },
  { id: 'CASSETTE', label: 'Cassette Tape', desc: 'Retro stereo magnetic tape' },
  { id: 'STAMP', label: 'Vintage Stamp', desc: 'Perforated postal artwork' },
  { id: 'VINYL', label: 'Vinyl Record', desc: 'Analog spinning record' },
];

const EMOTIONS = [
  '🌙 Midnight Melancholy',
  '⚡ Neon Euphoria',
  '☕ Lo-Fi Warmth',
  '🌧️ Rain Nostalgia',
  '🌊 Ocean Ambient',
  '✨ Dream Pop Glow'
];

// Yup Validation Schema
const NoteValidationSchema = Yup.object().shape({
  songTitle: Yup.string().required('Song title is required. Search and pick a track.'),
  artistName: Yup.string().required('Artist name is required.'),
  songImageUrl: Yup.string().url('Invalid image URL').required('Album artwork is required.'),
  externalSongUrl: Yup.string().url('Invalid external URL').required('Audio link is required.'),
  audioSnippetStart: Yup.number().min(0, 'Minimum start is 0s').max(180, 'Maximum start is 180s').required(),
  templateType: Yup.string().oneOf(['RECEIPTIFY', 'CASSETTE', 'STAMP', 'VINYL']).required(),
  emotionTag: Yup.string().required('Please choose an emotion vibe.'),
  lyricSnippet: Yup.string().max(250, 'Lyric snippet cannot exceed 250 characters.'),
  caption: Yup.string().max(500, 'Caption cannot exceed 500 characters.'),
  visibility: Yup.string().oneOf(['PUBLIC', 'FRIENDS_ONLY']).required(),
});

export default function StudioModal({ onNoteCreated }) {
  const { user, isStudioOpen, setStudioOpen } = useAuthStore();
  
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const formik = useFormik({
    initialValues: {
      songTitle: '',
      artistName: '',
      songImageUrl: '',
      externalSongUrl: '',
      audioSnippetStart: 30,
      templateType: 'RECEIPTIFY',
      emotionTag: EMOTIONS[0],
      lyricSnippet: '',
      caption: '',
      visibility: 'PUBLIC',
    },
    validationSchema: NoteValidationSchema,
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      try {
        const payload = {
          userId: user.id,
          ...values,
          stickerBadge: 'FEATURED',
        };

        const createdNote = await noteService.createNote(payload);
        toast.success(`Dropped "${values.songTitle}" onto the sound stream!`);
        resetForm();
        setSearchResults([]);
        setQuery('');
        if (onNoteCreated) onNoteCreated(createdNote);
        setStudioOpen(false);
      } catch (err) {
        toast.error(err.message || 'Failed to publish sound note');
      } finally {
        setSubmitting(false);
      }
    },
  });

  if (!isStudioOpen) return null;

  const handleSearchMusic = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    try {
      const data = await musicService.searchTracks(query);
      setSearchResults(data || []);
      if (data && data.length === 0) {
        toast.info("No tracks found. Try a different artist or song name.");
      }
    } catch (err) {
      toast.error("Failed to query music proxy API");
    } finally {
      setSearching(false);
    }
  };

  const handleSelectTrack = (track) => {
    formik.setFieldValue('songTitle', track.songTitle);
    formik.setFieldValue('artistName', track.artistName);
    formik.setFieldValue('songImageUrl', track.songImageUrl);
    formik.setFieldValue('externalSongUrl', track.externalSongUrl);
    setSearchResults([]);
    toast.info(`Selected track: ${track.songTitle}`);
  };

  const handleClearSelectedTrack = () => {
    formik.setFieldValue('songTitle', '');
    formik.setFieldValue('artistName', '');
    formik.setFieldValue('songImageUrl', '');
    formik.setFieldValue('externalSongUrl', '');
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#081724]/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#142C40] border border-[#31566A] rounded-3xl max-w-xl w-full p-6 shadow-2xl relative my-8 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#31566A]/40 mb-5">
          <div className="flex items-center gap-2">
            <Disc className="w-5 h-5 text-[#91B9C5]" />
            <h2 className="text-lg font-extrabold text-[#E8EEF0]">SAY Creative Studio</h2>
          </div>
          <button
            onClick={() => setStudioOpen(false)}
            className="p-1.5 rounded-full hover:bg-[#31566A]/50 text-[#91B9C5] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={formik.handleSubmit} className="space-y-5">
          
          {/* 1. Track Search & Selection */}
          <div>
            <label className="block text-xs font-semibold text-[#91B9C5] mb-2 uppercase tracking-wider">
              1. Search Track (Spotify & YouTube)
            </label>
            {!formik.values.songTitle ? (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-[#91B9C5]/50" />
                    <input
                      type="text"
                      placeholder="Search title, artist, or vibe..."
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className="w-full bg-[#081724] border border-[#31566A] rounded-xl pl-9 pr-3 py-2 text-xs text-[#E8EEF0] focus:outline-none focus:border-[#91B9C5]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleSearchMusic}
                    disabled={searching}
                    className="bg-[#31566A] hover:bg-[#91B9C5] hover:text-[#081724] text-[#E8EEF0] px-4 py-2 rounded-xl text-xs font-bold transition-colors"
                  >
                    {searching ? "Searching..." : "Search"}
                  </button>
                </div>

                {/* Dropdown Results */}
                {searchResults.length > 0 && (
                  <div className="bg-[#081724] border border-[#31566A] rounded-xl p-2 space-y-1 max-h-48 overflow-y-auto">
                    {searchResults.map((track) => (
                      <div
                        key={track.id}
                        onClick={() => handleSelectTrack(track)}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#142C40] cursor-pointer transition-colors"
                      >
                        <img src={track.songImageUrl} alt="" className="w-10 h-10 rounded-md object-cover" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-[#E8EEF0] truncate">{track.songTitle}</p>
                          <p className="text-[10px] text-[#91B9C5] truncate">{track.artistName} • {track.platform}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between p-3 bg-[#081724] rounded-2xl border border-[#91B9C5]/30">
                <div className="flex items-center gap-3 min-w-0">
                  <img src={formik.values.songImageUrl} alt="" className="w-12 h-12 rounded-xl object-cover" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#E8EEF0] truncate">{formik.values.songTitle}</p>
                    <p className="text-[11px] text-[#91B9C5] truncate">{formik.values.artistName}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleClearSelectedTrack}
                  className="text-xs text-[#B39DDB] hover:underline ml-2"
                >
                  Change
                </button>
              </div>
            )}
            
            {/* Formik Error for song selection */}
            {formik.touched.songTitle && formik.errors.songTitle && (
              <div className="flex items-center gap-1.5 text-rose-400 text-xs mt-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{formik.errors.songTitle}</span>
              </div>
            )}
          </div>

          {/* 2. 30s Snippet Window */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold text-[#91B9C5] uppercase tracking-wider">
                2. 30s Snippet Window
              </label>
              <span className="text-xs font-mono text-[#E8EEF0]">
                {formik.values.audioSnippetStart}s - {Number(formik.values.audioSnippetStart) + 30}s
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="180"
              step="5"
              name="audioSnippetStart"
              value={formik.values.audioSnippetStart}
              onChange={formik.handleChange}
              className="w-full accent-[#91B9C5] cursor-pointer"
            />
          </div>

          {/* 3. Visual Aesthetic Template */}
          <div>
            <label className="block text-xs font-semibold text-[#91B9C5] mb-2 uppercase tracking-wider">
              3. Visual Aesthetic Template
            </label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {TEMPLATES.map((t) => (
                <div
                  key={t.id}
                  onClick={() => formik.setFieldValue('templateType', t.id)}
                  className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                    formik.values.templateType === t.id
                      ? 'border-[#91B9C5] bg-[#31566A]/40 ring-1 ring-[#91B9C5]'
                      : 'border-[#31566A]/40 bg-[#081724]/60 hover:border-[#91B9C5]/40'
                  }`}
                >
                  <p className="text-xs font-bold text-[#E8EEF0]">{t.label}</p>
                  <span className="text-[9px] text-[#91B9C5]/70 leading-tight block mt-1">{t.desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 4. Emotion Tag Picker */}
          <div>
            <label className="block text-xs font-semibold text-[#91B9C5] mb-2 uppercase tracking-wider">
              4. Emotion Tag
            </label>
            <div className="flex flex-wrap gap-1.5">
              {EMOTIONS.map((emo) => (
                <button
                  key={emo}
                  type="button"
                  onClick={() => formik.setFieldValue('emotionTag', emo)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                    formik.values.emotionTag === emo
                      ? 'bg-[#91B9C5] text-[#081724] font-bold border-[#91B9C5]'
                      : 'bg-[#081724] text-[#91B9C5] border-[#31566A]/50 hover:border-[#91B9C5]'
                  }`}
                >
                  {emo}
                </button>
              ))}
            </div>
          </div>

          {/* 5. Lyric Snippet */}
          <div>
            <label className="block text-xs font-semibold text-[#91B9C5] mb-1 uppercase tracking-wider">
              5. Lyric Snippet (Optional)
            </label>
            <input
              type="text"
              name="lyricSnippet"
              placeholder="e.g. 'And the sound of the ocean washes over me...'"
              value={formik.values.lyricSnippet}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className="w-full bg-[#081724] border border-[#31566A] rounded-xl px-3 py-2 text-xs text-[#E8EEF0] focus:outline-none focus:border-[#91B9C5]"
            />
            {formik.touched.lyricSnippet && formik.errors.lyricSnippet && (
              <span className="text-rose-400 text-xs block mt-1">{formik.errors.lyricSnippet}</span>
            )}
          </div>

          {/* 6. Caption */}
          <div>
            <label className="block text-xs font-semibold text-[#91B9C5] mb-1 uppercase tracking-wider">
              6. Personal Reflection / Caption
            </label>
            <textarea
              rows="2"
              name="caption"
              placeholder="What makes this song special to you right now?"
              value={formik.values.caption}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className="w-full bg-[#081724] border border-[#31566A] rounded-xl px-3 py-2 text-xs text-[#E8EEF0] focus:outline-none focus:border-[#91B9C5]"
            />
            {formik.touched.caption && formik.errors.caption && (
              <span className="text-rose-400 text-xs block mt-1">{formik.errors.caption}</span>
            )}
          </div>

          {/* 7. Visibility */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-[#91B9C5]">Visibility:</span>
            <div className="flex gap-2">
              {['PUBLIC', 'FRIENDS_ONLY'].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => formik.setFieldValue('visibility', v)}
                  className={`text-xs px-3 py-1 rounded-xl font-semibold border ${
                    formik.values.visibility === v
                      ? 'bg-[#31566A] text-[#E8EEF0] border-[#91B9C5]'
                      : 'text-[#91B9C5]/60 border-[#31566A]/40'
                  }`}
                >
                  {v === 'PUBLIC' ? 'Public Feed' : 'Friends Only'}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-[#31566A]/40">
            <button
              type="button"
              onClick={() => setStudioOpen(false)}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[#91B9C5] hover:bg-[#31566A]/30 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={formik.isSubmitting || !formik.values.songTitle}
              className="bg-[#91B9C5] hover:bg-[#B39DDB] disabled:opacity-50 text-[#081724] px-6 py-2.5 rounded-xl text-xs font-extrabold shadow-lg transition-transform hover:scale-105"
            >
              {formik.isSubmitting ? "Dropping Note..." : "Publish Sound Note"}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
