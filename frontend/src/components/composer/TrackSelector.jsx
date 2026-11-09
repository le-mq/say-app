import React, { useState } from 'react';
import { Search, Link as LinkIcon, RefreshCw, Check, AlertCircle, X, Music, Radio, Sparkles } from 'lucide-react';
import { musicService, formatTime } from '../../services/musicService';
import { toast } from 'react-toastify';

export default function TrackSelector({ selectedTrack, onSelectTrack, onClearTrack }) {
  // Prioritize Paste Link as the default tab for custom 30s snippet picking
  const [activeTab, setActiveTab] = useState('youtube'); // 'youtube' (Priority Paste Link) | 'search' (iTunes)
  
  // YouTube URL state
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [isResolvingUrl, setIsResolvingUrl] = useState(false);
  const [resolvedPreview, setResolvedPreview] = useState(null);
  const [urlError, setUrlError] = useState('');

  // iTunes Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Auto-resolve YouTube URL
  const handleResolveYoutubeUrl = async (customUrl) => {
    const raw = (customUrl || youtubeUrl).trim();
    if (!raw) return;

    setUrlError('');
    const videoId = musicService.extractYoutubeId(raw);
    if (!videoId) {
      setUrlError('Invalid link. Please enter a valid YouTube, YouTube Music, or Shorts link.');
      return;
    }

    setIsResolvingUrl(true);
    setResolvedPreview(null);

    try {
      const resolved = await musicService.resolveYoutubeUrl(raw);
      if (resolved) {
        const enriched = {
          ...resolved,
          duration: resolved.duration || 240, // 4-minute scrubber window for custom 30s selection
          snippetDuration: 30,
          platform: 'YOUTUBE',
        };
        setResolvedPreview(enriched);
        // Auto-select immediately so user can begin adjusting 30s snippet right away
        onSelectTrack(enriched);
      } else {
        // Fallback info from videoId
        const fallback = {
          id: `yt_${videoId}`,
          youtubeId: videoId,
          songTitle: 'Midnight Ambient Audio',
          artistName: 'YouTube Creator',
          songImageUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
          externalSongUrl: `https://www.youtube.com/watch?v=${videoId}`,
          duration: 240,
          snippetDuration: 30,
          platform: 'YOUTUBE',
        };
        setResolvedPreview(fallback);
        onSelectTrack(fallback);
      }
    } catch (err) {
      setUrlError('Failed to load video info. Check your link or try again.');
    } finally {
      setIsResolvingUrl(false);
    }
  };

  // Handle Track Search
  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;

    setIsSearching(true);
    setSearchResults([]);

    try {
      let found = false;

      // 1. Primary: Search via backend (YouTube Search)
      try {
        const res = await musicService.searchTracks(q, 'YOUTUBE');
        const list = Array.isArray(res) ? res : (res?.data?.data || res?.data || []);

        if (Array.isArray(list) && list.length > 0) {
          const formatted = list.map((item) => {
            const isYt = item.platform === 'YOUTUBE' || Boolean(item.externalSongUrl?.includes('youtube') || item.externalSongUrl?.includes('youtu.be') || (typeof item.id === 'string' && item.id.startsWith('yt_')));
            const durationSec = isYt 
              ? Math.max(180, Math.round((item.durationMs || 240000) / 1000))
              : Math.round((item.durationMs || 30000) / 1000);

            const cleaned = musicService.cleanMetadata(item.songTitle, item.artistName);
            const videoId = item.externalSongUrl ? musicService.extractYoutubeId(item.externalSongUrl) : (typeof item.id === 'string' && item.id.startsWith('yt_') ? item.id.replace('yt_', '') : null);

            return {
              id: item.id || `yt_${videoId || Math.random().toString(36).slice(2)}`,
              youtubeId: videoId,
              songTitle: cleaned.songTitle || item.songTitle || 'Untitled Track',
              artistName: cleaned.artistName || item.artistName || 'Artist',
              songImageUrl: item.songImageUrl || (videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : ''),
              externalSongUrl: item.externalSongUrl || (videoId ? `https://www.youtube.com/watch?v=${videoId}` : ''),
              previewAudioUrl: item.previewAudioUrl || item.externalSongUrl || '',
              duration: durationSec,
              snippetDuration: 30,
              platform: isYt ? 'YOUTUBE' : 'ITUNES',
            };
          });

          setSearchResults(formatted);
          found = true;
        }
      } catch (err) {
        console.warn('Backend search API error:', err);
      }

      // 2. Direct client fallback search (if backend returned 0 results)
      if (!found) {
        try {
          const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(q)}&entity=song&limit=10`);
          if (!res.ok) throw new Error('Search request failed');
          const data = await res.json();

          if (data.results && data.results.length > 0) {
            const formatted = data.results.map((item) => ({
              id: `itunes_${item.trackId}`,
              songTitle: item.trackName,
              artistName: item.artistName,
              songImageUrl: (item.artworkUrl100 || item.artworkUrl60 || '').replace('100x100bb', '600x600bb'),
              externalSongUrl: item.previewUrl,
              previewAudioUrl: item.previewUrl,
              duration: Math.round((item.trackTimeMillis || 30000) / 1000),
              snippetDuration: 30,
              platform: 'ITUNES',
            }));
            setSearchResults(formatted);
          } else {
            toast.info(`Không tìm thấy bài hát "${q}". Bạn hãy thử từ khóa khác hoặc dán link nhé.`);
          }
        } catch (fallbackErr) {
          toast.info('Không thể tìm kiếm bài hát lúc này. Bạn hãy thử dán link nhé.');
        }
      }
    } finally {
      setIsSearching(false);
    }
  };

  const confirmTrack = (track) => {
    onSelectTrack(track);
    setSearchResults([]);
    setResolvedPreview(null);
    setYoutubeUrl('');
  };

  return (
    <div className="space-y-3">
      {/* Step Header */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-mono font-bold uppercase tracking-wider text-sky-200 flex items-center gap-1.5">
          <span>Select Track</span>
        </label>
        {selectedTrack?.songTitle && (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-sky-300 font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00594c] shadow-[0_0_8px_rgba(0,89,76,0.9)] animate-pulse" />
            <span>Track Synced</span>
          </span>
        )}
      </div>

      {/* Selected Track Confirmation Banner */}
      {selectedTrack?.songTitle ? (
        <div className="flex items-center justify-between p-3 rounded-2xl bg-[#091f33] border border-sky-400/30 shadow-md relative overflow-hidden">
          {/* Subtle Aston Martin teal sheen */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#00594c]/15 via-transparent to-transparent pointer-events-none" />
          <div className="flex items-center gap-3 min-w-0 relative z-10">
            <img
              src={selectedTrack.songImageUrl}
              alt={selectedTrack.songTitle}
              className="w-12 h-12 rounded-xl object-cover shrink-0 border border-sky-400/30"
              onError={(e) => {
                e.currentTarget.src = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=120';
              }}
            />
            <div className="min-w-0">
              <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                {selectedTrack.songTitle}
              </h4>
              <p className="text-[11px] text-[#91B9C5] font-mono truncate">
                {selectedTrack.artistName}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                {selectedTrack.duration && (
                  <span className="text-[10px] font-mono text-slate-400">
                    {formatTime(selectedTrack.duration)}
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClearTrack}
            className="p-1.5 rounded-lg bg-[#0a0d12] hover:bg-rose-950/60 text-neutral-400 hover:text-rose-300 border border-white/10 hover:border-rose-500/40 transition-colors cursor-pointer shrink-0 ml-2 relative z-10"
            title="Change track"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        /* Source Selector Tabs */
        <div className="bg-[#10141a]/95 border border-white/10 rounded-2xl p-3 space-y-3">
          
          <div className="flex items-center gap-1 bg-[#0a0d12] p-1 rounded-xl border border-white/10">
            {/* Tab 1: Paste Link */}
            <button
              type="button"
              onClick={() => setActiveTab('youtube')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'youtube'
                  ? 'bg-neutral-200 text-neutral-900 shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <LinkIcon className="w-3.5 h-3.5" />
              <span>Paste Link</span>
            </button>

            {/* Tab 2: Search */}
            <button
              type="button"
              onClick={() => setActiveTab('search')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'search'
                  ? 'bg-neutral-200 text-neutral-900 shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search Music</span>
            </button>
          </div>

          {/* TAB 1: PASTE LINK */}
          {activeTab === 'youtube' && (
            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <input
                  type="url"
                  placeholder="Paste any YouTube, YouTube Music or track link..."
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  onPaste={(e) => {
                    const pasted = e.clipboardData.getData('text');
                    if (pasted) {
                      setYoutubeUrl(pasted);
                      handleResolveYoutubeUrl(pasted);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleResolveYoutubeUrl();
                    }
                  }}
                  className="w-full bg-[#0a0d12] border border-white/10 rounded-xl px-3 py-2 text-xs text-[#E8EEF0] focus:outline-none focus:border-white/30 font-mono placeholder:text-neutral-600"
                />
                <button
                  type="button"
                  onClick={() => handleResolveYoutubeUrl()}
                  disabled={isResolvingUrl || !youtubeUrl.trim()}
                  className="px-4 py-2 bg-neutral-200 hover:bg-white text-neutral-900 text-xs font-mono font-bold rounded-xl transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shrink-0 shadow-sm"
                >
                  {isResolvingUrl ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>{isResolvingUrl ? 'Loading...' : 'Load'}</span>
                </button>
              </div>

              {urlError && (
                <p className="text-[11px] font-mono text-rose-400 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{urlError}</span>
                </p>
              )}
            </div>
          )}

          {/* TAB 2: SEARCH */}
          {activeTab === 'search' && (
            <div className="space-y-2">
              <form onSubmit={handleSearchSubmit} className="relative flex items-center">
                <Search className="w-4 h-4 absolute left-3 text-neutral-500" />
                <input
                  type="text"
                  placeholder="Search song title or artist..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#0a0d12] border border-white/10 rounded-xl pl-9 pr-24 py-2 text-xs text-[#E8EEF0] focus:outline-none focus:border-white/30 font-mono placeholder:text-neutral-600"
                />
                <button
                  type="submit"
                  disabled={isSearching || !searchQuery.trim()}
                  className="absolute right-1.5 px-3 py-1 bg-neutral-200 hover:bg-white text-neutral-900 text-[11px] font-mono font-bold rounded-lg transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1"
                >
                  {isSearching ? <RefreshCw className="w-3 h-3 animate-spin" /> : null}
                  <span>{isSearching ? 'Finding...' : 'Search'}</span>
                </button>
              </form>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="max-h-56 overflow-y-auto space-y-1 rounded-xl bg-[#0a0d12] p-1.5 border border-white/10">
                  {searchResults.map((track) => (
                    <div
                      key={track.id}
                      onClick={() => confirmTrack(track)}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-[#161c26] cursor-pointer transition-colors group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={track.songImageUrl}
                          alt=""
                          className="w-9 h-9 rounded-md object-cover shrink-0 border border-white/10"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white group-hover:text-amber-200 truncate">
                            {track.songTitle}
                          </p>
                          <p className="text-[10px] text-neutral-400 font-mono truncate">
                            {track.artistName}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <span className="text-[10px] font-mono font-medium text-neutral-300 bg-[#1c2432] group-hover:bg-white group-hover:text-black px-2.5 py-1 rounded-lg transition-colors border border-white/10">
                          Select
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      )}
    </div>
  );
}
