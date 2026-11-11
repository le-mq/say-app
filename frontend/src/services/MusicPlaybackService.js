/**
 * MusicPlaybackService.js
 * 
 * Lớp quản lý âm thanh duy nhất (Single Active Provider Pattern) cho SAY App.
 * Tuân thủ Chương 3.2 và Chương 14.2 trong tài liệu SAY (Sound Around You).
 * 
 * Quản lý 2 Providers:
 * 1. ITunesAdapter: HTMLAudioElement cho iTunes Preview / direct audio streams.
 * 2. YouTubeAdapter: YouTube IFrame Player API chính thức cho nguồn YouTube.
 */

export const PlaybackState = {
  IDLE: 'IDLE',
  BUFFERING: 'BUFFERING',
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED',
  ENDED: 'ENDED',
  ERROR: 'ERROR',
};

export const SourceType = {
  ITUNES: 'ITUNES',
  YOUTUBE: 'YOUTUBE',
  UNKNOWN: 'UNKNOWN',
};

const DEFAULT_SNIPPET_DURATION = 30;

// ============================================================================
// 1. ITUNES / HTML AUDIO ADAPTER
// ============================================================================
export class ITunesAdapter {
  constructor(service) {
    this.service = service;
    this.audio = null;
    this.snippetStart = 0;
    this.snippetDuration = DEFAULT_SNIPPET_DURATION;
    this.generationId = 0;
    this.initAudioElement();
  }

  initAudioElement() {
    if (typeof window === 'undefined') return;
    this.audio = new Audio();
    this.audio.preload = 'auto';
    this.audio.volume = this.service.volume ?? 0.85;
    this.audio.muted = !!this.service.isMuted;

    this.audio.addEventListener('loadstart', () => {
      if (this.service.isStale(this.generationId)) return;
      this.service.setState(PlaybackState.BUFFERING);
    });

    this.audio.addEventListener('waiting', () => {
      if (this.service.isStale(this.generationId)) return;
      this.service.setState(PlaybackState.BUFFERING);
    });

    this.audio.addEventListener('canplay', () => {
      if (this.service.isStale(this.generationId)) return;
      if (this.service.isManuallyPaused && this.service.getState() === PlaybackState.BUFFERING) {
        this.service.setState(PlaybackState.PAUSED);
      }
    });

    this.audio.addEventListener('playing', () => {
      if (this.service.isStale(this.generationId)) return;
      this.service.setState(PlaybackState.PLAYING);
    });

    this.audio.addEventListener('pause', () => {
      if (this.service.isStale(this.generationId)) return;
      // Only set PAUSED if not already ended or idle
      if (this.service.getState() === PlaybackState.PLAYING || this.service.getState() === PlaybackState.BUFFERING) {
        this.service.setState(PlaybackState.PAUSED);
      }
    });

    this.audio.addEventListener('timeupdate', () => {
      if (this.service.isStale(this.generationId)) return;
      if (!this.audio) return;
      if (this.ignoreTicksUntil && Date.now() < this.ignoreTicksUntil) return;

      const current = this.audio.currentTime;
      if (current < this.snippetStart - 1) {
        this.audio.currentTime = this.snippetStart;
        return;
      }
      const relativeTime = Math.max(0, current - this.snippetStart);
      this.service.setCurrentTime(Math.min(relativeTime, this.snippetDuration));

      // Check if snippet duration reached
      if (relativeTime >= this.snippetDuration) {
        if (this.service.isLooping) {
          try {
            this.ignoreTicksUntil = Date.now() + 300;
            this.audio.currentTime = this.snippetStart;
            this.audio.play().catch(() => {});
            this.service.setCurrentTime(0);
          } catch (err) {
            console.warn('[ITunesAdapter] loop replay error:', err);
          }
        } else {
          try {
            this.audio.currentTime = this.snippetStart;
          } catch (_) {}
          this.pause();
          this.service.setCurrentTime(0);
          this.service.setState(PlaybackState.ENDED);
          this.service.notifySnippetEnded(this.service.currentTrack);
        }
      }
    });

    this.audio.addEventListener('ended', () => {
      if (this.service.isStale(this.generationId)) return;
      if (this.service.isLooping) {
        try {
          this.audio.currentTime = this.snippetStart;
          this.audio.play().catch(() => {});
          this.service.setCurrentTime(0);
        } catch (err) {
          this.service.setState(PlaybackState.ENDED);
        }
      } else {
        try {
          this.audio.currentTime = this.snippetStart;
        } catch (_) {}
        this.service.setCurrentTime(0);
        this.service.setState(PlaybackState.ENDED);
        this.service.notifySnippetEnded(this.service.currentTrack);
      }
    });

    this.audio.addEventListener('error', (e) => {
      if (this.service.isStale(this.generationId)) return;
      // Do not report error if audio was intentionally stopped/cleared
      if (!this.audio || !this.audio.src || this.audio.src === window.location.href) return;
      console.warn('[ITunesAdapter] Audio error:', e);
      this.service.setState(PlaybackState.ERROR, 'Unable to play audio stream');
    });
  }

  load(track, options = {}, generationId) {
    this.generationId = generationId;
    this.snippetStart = Number(options.snippetStart ?? track.audioSnippetStart ?? 0);
    this.snippetDuration = Number(options.snippetDuration ?? track.snippetDuration ?? DEFAULT_SNIPPET_DURATION);

    const streamUrl = track.previewAudioUrl || track.previewUrl || track.externalSongUrl || track.audioUrl;
    if (!streamUrl || streamUrl.includes('itunes.apple.com/search')) {
      console.warn('[ITunesAdapter] Invalid or search URL passed as streamUrl:', streamUrl);
      this.service.setState(PlaybackState.PAUSED);
      return;
    }

    if (this.audio) {
      try {
        this.audio.src = streamUrl;
        this.audio.currentTime = this.snippetStart;
        this.service.setCurrentTime(0);
        this.service.setDuration(this.snippetDuration);
        this.service.setState(PlaybackState.PAUSED);
      } catch (err) {
        console.warn('[ITunesAdapter] load error:', err);
      }
    }
  }

  async play(generationId) {
    if (generationId) this.generationId = generationId;
    if (!this.audio) return;
    if (this.service.isStale(this.generationId)) return;

    const streamUrl = this.audio.src;
    if (!streamUrl || streamUrl.includes('itunes.apple.com/search') || streamUrl === window.location.href) {
      return;
    }

    try {
      this.service.setState(PlaybackState.BUFFERING);
      await this.audio.play();
    } catch (err) {
      if (this.service.isStale(this.generationId)) return;
      if (err.name === 'AbortError') return; // Handled by race-condition cleanup
      console.warn('[ITunesAdapter] Playback blocked or failed:', err);
      this.service.setState(PlaybackState.PAUSED);
    }
  }

  pause() {
    if (this.audio && !this.audio.paused) {
      this.audio.pause();
    }
  }

  seekTo(relativeSeconds) {
    if (!this.audio) return;
    const clamped = Math.max(0, Math.min(relativeSeconds, this.snippetDuration));
    this.audio.currentTime = this.snippetStart + clamped;
    this.service.setCurrentTime(clamped);
  }

  seekSnippet(startSec, duration, autoPlay = true) {
    this.snippetStart = startSec;
    if (duration) this.snippetDuration = duration;
    this.ignoreTicksUntil = Date.now() + 350;
    if (this.audio) {
      try {
        this.audio.currentTime = startSec;
        if (autoPlay === true) {
          this.audio.play().catch(() => {});
        }
      } catch (e) {
        console.warn('[ITunesAdapter] seekSnippet error:', e);
      }
    }
    this.service.setCurrentTime(0);
  }

  stop() {
    if (this.audio) {
      try {
        this.audio.pause();
        // Triệt để hủy nguồn phát cũ theo yêu cầu Chương 3.2 & 14.2
        this.audio.removeAttribute('src');
        this.audio.load();
      } catch (e) {
        console.warn('[ITunesAdapter] Stop cleanup error:', e);
      }
    }
  }
}

// ============================================================================
// 2. YOUTUBE IFRAME PLAYER API ADAPTER
// ============================================================================
export class YouTubeAdapter {
  constructor(service) {
    this.service = service;
    this.player = null;
    this.containerId = 'say-youtube-player-slot';
    this.isApiReady = false;
    this.isPlayerReady = false;
    this.currentVideoId = null;
    this.snippetStart = 0;
    this.snippetDuration = DEFAULT_SNIPPET_DURATION;
    this.generationId = 0;
    this.ticker = null;
    this.pendingVideoId = null;
    this.pendingAutoPlay = false;

    // Guard against stale time reads during seeking across points A -> B
    this.isSeeking = false;
    this.targetSeekTime = 0;
    this.seekRequestedAt = 0;
    this.ignoreTicksUntil = 0;

    this.ensureYouTubeApi();
  }

  ensureYouTubeApi() {
    if (typeof window === 'undefined') return Promise.resolve();

    if (window.YT && window.YT.Player) {
      this.isApiReady = true;
      return Promise.resolve();
    }

    if (window._sayYtApiPromise) {
      return window._sayYtApiPromise;
    }

    window._sayYtApiPromise = new Promise((resolve) => {
      // 1. Active interval poll in case iframe_api script already fired onYouTubeIframeAPIReady
      const poll = setInterval(() => {
        if (window.YT && window.YT.Player) {
          clearInterval(poll);
          this.isApiReady = true;
          resolve();
        }
      }, 50);

      // 2. Ensure YouTube iframe API script tag exists
      const existingScript = document.getElementById('youtube-iframe-api-script');
      if (!existingScript && !(window.YT && window.YT.Player)) {
        const tag = document.createElement('script');
        tag.id = 'youtube-iframe-api-script';
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        if (firstScriptTag && firstScriptTag.parentNode) {
          firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        } else {
          document.head.appendChild(tag);
        }
      }

      // 3. Official ready callback hook
      const prevCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        clearInterval(poll);
        if (typeof prevCallback === 'function') prevCallback();
        this.isApiReady = true;
        resolve();
      };
    });

    return window._sayYtApiPromise;
  }

  setContainerId(id) {
    this.containerId = id;
  }

  extractVideoId(urlOrId) {
    if (!urlOrId) return null;
    if (typeof urlOrId !== 'string') return null;
    const raw = urlOrId.trim();
    if (raw.startsWith('yt_')) return raw.slice(3);
    const match = raw.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/|music\.youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : (raw.length === 11 ? raw : null);
  }

  async initPlayerInstance() {
    await this.ensureYouTubeApi();
    if (this.player) return;

    let el = document.getElementById(this.containerId);
    if (!el) {
      const container = document.createElement('div');
      container.id = 'say-youtube-audio-engine';
      container.setAttribute('aria-hidden', 'true');
      container.style.cssText = 'position:fixed;bottom:0;left:0;width:1px;height:1px;opacity:0.001;pointer-events:none;overflow:hidden;z-index:-1;';
      const slot = document.createElement('div');
      slot.id = this.containerId;
      container.appendChild(slot);
      document.body.appendChild(container);
      el = slot;
    }

    return new Promise((resolve) => {
      this.player = new window.YT.Player(this.containerId, {
        width: '100%',
        height: '100%',
        videoId: this.pendingVideoId || '',
        playerVars: {
          autoplay: 1,
          controls: 0,
          modestbranding: 1,
          rel: 0,
          fs: 0,
          playsinline: 1,
          disablekb: 1,
          iv_load_policy: 3,
          origin: typeof window !== 'undefined' ? window.location.origin : '',
        },
        events: {
          onReady: () => {
            this.isPlayerReady = true;
            // Force ultra-low bitrate video stream to minimize RAM and CPU overhead
            try {
              if (typeof this.player.setPlaybackQuality === 'function') {
                this.player.setPlaybackQuality('small');
              }
              if (typeof this.player.setVolume === 'function') {
                this.player.setVolume(Math.round((this.service.volume ?? 0.85) * 100));
                if (this.service.isMuted) {
                  this.player.mute();
                } else {
                  this.player.unMute();
                }
              }
            } catch (_) {}

            resolve();
            if (this.pendingVideoId) {
              const vid = this.pendingVideoId;
              const auto = this.pendingAutoPlay;
              this.pendingVideoId = null;
              this.pendingAutoPlay = false;
              if (auto) {
                this.loadAndPlay(vid, this.snippetStart, this.generationId);
              } else {
                this.cue(vid, this.snippetStart, this.generationId);
              }
            }
          },
          onStateChange: (event) => this.handleStateChange(event),
          onError: (e) => this.handleError(e),
        },
      });
    });
  }

  handleStateChange(event) {
    if (this.service.isStale(this.generationId)) return;
    const YT = window.YT;
    if (!YT) return;

    switch (event.data) {
      case YT.PlayerState.BUFFERING:
        this.service.setState(PlaybackState.BUFFERING);
        break;
      case YT.PlayerState.PLAYING:
        this.service.setState(PlaybackState.PLAYING);
        this.startTicker();
        break;
      case YT.PlayerState.PAUSED:
        this.stopTicker();
        if (this.service.getState() !== PlaybackState.ENDED) {
          this.service.setState(PlaybackState.PAUSED);
        }
        break;
      case 5: // YT.PlayerState.CUED
      case -1: // YT.PlayerState.UNSTARTED
        // Instantly inspect full duration from player upon cueing!
        try {
          const fullDur = Math.round(this.player.getDuration() || 0);
          if (fullDur > 0 && (!this.service.currentTrack?.duration || this.service.currentTrack.duration !== fullDur)) {
            if (this.service.currentTrack) {
              this.service.currentTrack.duration = fullDur;
              this.service.currentTrack.fullDuration = fullDur;
            }
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('say_track_duration_detected', {
                detail: { trackId: this.service.currentTrack?.id, duration: fullDur }
              }));
            }
          }
        } catch (_) {}

        if (!this.service.isManuallyPaused && this.service.activeProvider === this) {
          try {
            this.player.playVideo();
          } catch (_) {}
        } else {
          this.service.setState(PlaybackState.PAUSED);
        }
        break;
      case YT.PlayerState.ENDED:
        if (this.service.isLooping) {
          try {
            this.isSeeking = true;
            this.targetSeekTime = this.snippetStart;
            this.seekRequestedAt = Date.now();
            this.ignoreTicksUntil = Date.now() + 800;
            this.player.seekTo(this.snippetStart, true);
            this.player.playVideo();
            this.service.setCurrentTime(0);
          } catch (err) {
            this.stopTicker();
            this.service.setState(PlaybackState.ENDED);
          }
        } else {
          try {
            this.player.seekTo(this.snippetStart, true);
          } catch (_) {}
          this.stopTicker();
          this.service.setCurrentTime(0);
          this.service.setState(PlaybackState.ENDED);
          this.service.notifySnippetEnded(this.service.currentTrack);
        }
        break;
      default:
        break;
    }
  }

  handleError(e) {
    if (this.service.isStale(this.generationId)) return;
    if (this.service.isManuallyPaused || this.isStopping) return;
    console.warn('[YouTubeAdapter] IFrame error:', e?.data || e);
    this.stopTicker();
    this.service.setState(PlaybackState.PAUSED);
  }

  startTicker() {
    this.stopTicker();
    this.ticker = setInterval(() => {
      if (this.service.isStale(this.generationId)) {
        this.stopTicker();
        return;
      }
      if (!this.player || typeof this.player.getCurrentTime !== 'function') return;

      const current = this.player.getCurrentTime();

      // Capture exact video duration from YouTube Player (even if > 1 hour)
      try {
        const fullDur = Math.round(this.player.getDuration() || 0);
        if (fullDur > 0 && (!this.service.currentTrack?.duration || this.service.currentTrack.duration !== fullDur)) {
          if (this.service.currentTrack) {
            this.service.currentTrack.duration = fullDur;
            this.service.currentTrack.fullDuration = fullDur;
          }
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('say_track_duration_detected', {
              detail: { trackId: this.service.currentTrack?.id, duration: fullDur }
            }));
          }
        }
      } catch (_) {}

      // Shield ticker during seek transitions (prevents reading stale previous time)
      if (this.isSeeking) {
        if (Math.abs(current - this.targetSeekTime) < 1.8 || (Date.now() - this.seekRequestedAt > 2200)) {
          this.isSeeking = false;
        } else {
          return;
        }
      }

      if (this.ignoreTicksUntil && Date.now() < this.ignoreTicksUntil) return;

      if (current < this.snippetStart - 1.2) {
        this.player.seekTo(this.snippetStart, true);
        return;
      }

      const relativeTime = Math.max(0, current - this.snippetStart);
      this.service.setCurrentTime(Math.min(relativeTime, this.snippetDuration));

      if (relativeTime >= this.snippetDuration) {
        if (this.service.isLooping) {
          try {
            this.isSeeking = true;
            this.targetSeekTime = this.snippetStart;
            this.seekRequestedAt = Date.now();
            this.ignoreTicksUntil = Date.now() + 800;
            this.player.seekTo(this.snippetStart, true);
            this.player.playVideo();
            this.service.setCurrentTime(0);
          } catch (err) {
            console.warn('[YouTubeAdapter] loop replay error:', err);
          }
        } else {
          this.stopTicker();
          try {
            this.player.seekTo(this.snippetStart, true);
          } catch (_) {}
          this.pause();
          this.service.setCurrentTime(0);
          this.service.setState(PlaybackState.ENDED);
          this.service.notifySnippetEnded(this.service.currentTrack);
        }
      }
    }, 200);
  }

  stopTicker() {
    if (this.ticker) {
      clearInterval(this.ticker);
      this.ticker = null;
    }
  }

  cue(videoId, startSeconds, generationId) {
    this.currentVideoId = videoId;
    this.snippetStart = startSeconds;
    this.generationId = generationId;
    this.isSeeking = false;

    if (!this.isPlayerReady || !this.player || typeof this.player.cueVideoById !== 'function') {
      this.pendingVideoId = videoId;
      this.pendingAutoPlay = false;
      this.initPlayerInstance();
      return;
    }

    try {
      this.player.cueVideoById({
        videoId,
        startSeconds,
        suggestedQuality: 'small',
      });
      if (typeof this.player.setPlaybackQuality === 'function') {
        this.player.setPlaybackQuality('small');
      }
      this.service.setCurrentTime(0);
      this.service.setDuration(this.snippetDuration);
      this.service.setState(PlaybackState.PAUSED);
    } catch (e) {
      console.warn('[YouTubeAdapter] cue error:', e);
    }
  }

  loadAndPlay(videoId, startSeconds, generationId) {
    this.currentVideoId = videoId;
    this.snippetStart = startSeconds;
    this.generationId = generationId;
    this.isSeeking = false;

    if (!this.isPlayerReady || !this.player || typeof this.player.loadVideoById !== 'function') {
      this.pendingVideoId = videoId;
      this.pendingAutoPlay = true;
      this.initPlayerInstance();
      return;
    }

    try {
      this.service.setState(PlaybackState.BUFFERING);
      this.player.loadVideoById({
        videoId,
        startSeconds,
        suggestedQuality: 'small',
      });
      try {
        this.player.playVideo();
      } catch (_) {}
      if (typeof this.player.setPlaybackQuality === 'function') {
        this.player.setPlaybackQuality('small');
      }
    } catch (e) {
      console.warn('[YouTubeAdapter] loadAndPlay error:', e);
    }
  }

  load(track, options = {}, generationId) {
    this.generationId = generationId;
    const videoId = track.youtubeId || this.extractVideoId(track.externalSongUrl);
    this.snippetStart = Number(options.snippetStart ?? track.audioSnippetStart ?? 0);
    this.snippetDuration = Number(options.snippetDuration ?? track.snippetDuration ?? DEFAULT_SNIPPET_DURATION);

    if (!videoId) {
      this.service.setState(PlaybackState.ERROR, 'Invalid YouTube Video ID');
      return;
    }

    this.cue(videoId, this.snippetStart, generationId);
  }

  play(generationId) {
    if (generationId) this.generationId = generationId;
    if (this.service.isStale(this.generationId)) return;

    if (!this.isPlayerReady || !this.player || typeof this.player.playVideo !== 'function') {
      if (this.currentVideoId) {
        this.loadAndPlay(this.currentVideoId, this.snippetStart, this.generationId);
      }
      return;
    }

    try {
      this.service.setState(PlaybackState.BUFFERING);
      this.player.playVideo();
    } catch (e) {
      console.warn('[YouTubeAdapter] play error:', e);
    }
  }

  pause() {
    this.stopTicker();
    if (this.player && typeof this.player.pauseVideo === 'function') {
      try {
        this.player.pauseVideo();
      } catch (e) {
        console.warn('[YouTubeAdapter] pause error:', e);
      }
    }
  }

  seekTo(relativeSeconds) {
    if (!this.player || typeof this.player.seekTo !== 'function') return;
    const clamped = Math.max(0, Math.min(relativeSeconds, this.snippetDuration));
    const targetAbs = this.snippetStart + clamped;
    this.player.seekTo(targetAbs, true);
    this.service.setCurrentTime(clamped);
  }

  seekSnippet(startSec, duration, autoPlay = true) {
    this.snippetStart = startSec;
    if (duration) this.snippetDuration = duration;
    this.isSeeking = true;
    this.targetSeekTime = startSec;
    this.seekRequestedAt = Date.now();
    this.ignoreTicksUntil = Date.now() + 1200;
    this.service.setCurrentTime(0);

    if (!this.player || !this.currentVideoId) return;

    if (autoPlay === true) {
      try {
        const playerState = typeof this.player.getPlayerState === 'function' ? this.player.getPlayerState() : -1;
        // If YouTube player is already initialized and active (1: PLAYING, 2: PAUSED, 3: BUFFERING),
        // seekTo is instant and avoids flashing or reloading the iframe!
        if (playerState === 1 || playerState === 2 || playerState === 3) {
          this.player.seekTo(startSec, true);
          this.player.playVideo();
        } else {
          this.player.loadVideoById({
            videoId: this.currentVideoId,
            startSeconds: startSec,
            suggestedQuality: 'small',
          });
          if (typeof this.player.setPlaybackQuality === 'function') {
            this.player.setPlaybackQuality('small');
          }
        }
      } catch (e) {
        try {
          this.player.seekTo(startSec, true);
          this.player.playVideo();
        } catch (_) {}
      }
    } else {
      try {
        this.player.seekTo(startSec, true);
      } catch (_) {}
    }
  }

  stop() {
    this.stopTicker();
    this.isStopping = true;
    if (this.player && typeof this.player.pauseVideo === 'function') {
      try {
        this.player.pauseVideo();
      } catch (e) {
        console.warn('[YouTubeAdapter] stop error:', e);
      }
    }
    this.currentVideoId = null;
    this.isSeeking = false;
    this.isStopping = false;
  }
}

// ============================================================================
// 3. MUSIC PLAYBACK SERVICE (SINGLE ACTIVE PROVIDER MANAGER)
// ============================================================================
class MusicPlaybackService {
  constructor() {
    this.currentTrack = null;
    this.playbackState = PlaybackState.IDLE;
    this.sourceType = SourceType.UNKNOWN;
    this.currentTime = 0;
    this.duration = DEFAULT_SNIPPET_DURATION;
    this.errorMessage = null;

    // Race condition barrier counter
    this.currentGenerationId = 0;

    // Snippet looping flag - Default true so all 30s Music Note previews in SAY seamlessly loop
    this.isLooping = true;
    this.isManuallyPaused = true;

    // Volume & Mute control (Default 0.85 audiophile level, persisted in localStorage)
    let savedVol = null;
    let savedMuted = null;
    try {
      if (typeof window !== 'undefined') {
        savedVol = localStorage.getItem('say_player_volume');
        savedMuted = localStorage.getItem('say_player_muted');
      }
    } catch (_) {}

    this.volume = savedVol !== null && !isNaN(Number(savedVol)) ? Math.max(0, Math.min(1, Number(savedVol))) : 0.85;
    this.isMuted = savedMuted === 'true';

    // Providers
    this.itunesAdapter = new ITunesAdapter(this);
    this.youtubeAdapter = new YouTubeAdapter(this);
    this.activeProvider = null;

    // Observers
    this.listeners = new Set();
    this.snippetEndedListeners = new Set();
  }

  // --- Volume Control ---
  setVolume(vol) {
    const clamped = Math.max(0, Math.min(1, Number(vol) || 0));
    this.volume = clamped;
    if (this.isMuted && clamped > 0) {
      this.isMuted = false;
      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem('say_player_muted', 'false');
        }
      } catch (_) {}
    }
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('say_player_volume', String(clamped));
      }
    } catch (_) {}

    if (this.itunesAdapter?.audio) {
      this.itunesAdapter.audio.volume = clamped;
      this.itunesAdapter.audio.muted = this.isMuted;
    }
    if (this.youtubeAdapter?.player && typeof this.youtubeAdapter.player.setVolume === 'function') {
      this.youtubeAdapter.player.setVolume(Math.round(clamped * 100));
      if (this.isMuted) {
        this.youtubeAdapter.player.mute();
      } else {
        this.youtubeAdapter.player.unMute();
      }
    }
    this.notify();
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('say_player_muted', String(this.isMuted));
      }
    } catch (_) {}

    if (this.itunesAdapter?.audio) {
      this.itunesAdapter.audio.muted = this.isMuted;
    }
    if (this.youtubeAdapter?.player) {
      if (this.isMuted && typeof this.youtubeAdapter.player.mute === 'function') {
        this.youtubeAdapter.player.mute();
      } else if (!this.isMuted && typeof this.youtubeAdapter.player.unMute === 'function') {
        this.youtubeAdapter.player.unMute();
      }
    }
    this.notify();
  }

  // --- Snippet Ended Notification for Auto-Play progression ---
  notifySnippetEnded(track) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('say_snippet_ended', { detail: { track } }));
    }
    this.snippetEndedListeners.forEach((fn) => {
      try { fn(track); } catch (e) { console.warn(e); }
    });
  }

  // --- Observation & State updates ---
  subscribe(listener) {
    this.listeners.add(listener);
    // Push current snapshot immediately
    listener(this.getSnapshot());
    return () => {
      this.listeners.delete(listener);
    };
  }

  notify() {
    const snapshot = this.getSnapshot();
    this.listeners.forEach((fn) => {
      try {
        fn(snapshot);
      } catch (e) {
        console.error('[MusicPlaybackService] Listener notification error:', e);
      }
    });
  }

  getSnapshot() {
    const isPlaying = this.playbackState === PlaybackState.PLAYING || 
      (!this.isManuallyPaused && (this.playbackState === PlaybackState.BUFFERING || this.playbackState === PlaybackState.PLAYING) && Boolean(this.activeProvider));

    return {
      currentTrack: this.currentTrack,
      playbackState: this.playbackState,
      isPlaying,
      isBuffering: this.playbackState === PlaybackState.BUFFERING,
      sourceType: this.sourceType,
      currentTime: this.currentTime,
      duration: this.duration,
      errorMessage: this.errorMessage,
      generationId: this.currentGenerationId,
      isLooping: this.isLooping,
      volume: this.volume ?? 0.85,
      isMuted: Boolean(this.isMuted),
    };
  }

  setLooping(loop) {
    this.isLooping = Boolean(loop);
    if (this.itunesAdapter) this.itunesAdapter.loop = this.isLooping;
    if (this.youtubeAdapter) this.youtubeAdapter.loop = this.isLooping;
    this.notify();
  }

  getState() {
    return this.playbackState;
  }

  setState(state, errorMessage = null) {
    this.playbackState = state;
    this.errorMessage = errorMessage;
    this.notify();
  }

  setCurrentTime(time) {
    this.currentTime = Math.round(time * 10) / 10;
    this.notify();
  }

  setDuration(dur) {
    this.duration = dur || DEFAULT_SNIPPET_DURATION;
    this.notify();
  }

  isStale(generationId) {
    return generationId !== this.currentGenerationId;
  }

  // Detect whether a track should be handled by YouTube or iTunes
  detectSourceType(track) {
    if (!track) return SourceType.UNKNOWN;
    if (track.platform === 'YOUTUBE' || track.youtubeId || (typeof track.id === 'string' && track.id.startsWith('yt_'))) {
      return SourceType.YOUTUBE;
    }
    const url = track.externalSongUrl || '';
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      return SourceType.YOUTUBE;
    }
    // Direct audio URL or iTunes preview
    if (track.previewAudioUrl || track.previewUrl || url.endsWith('.mp3') || url.endsWith('.m4a') || url.includes('apple.com')) {
      return SourceType.ITUNES;
    }
    // Default fallback
    return SourceType.ITUNES;
  }

  /**
   * stopAll()
   * Hủy nguồn phát cũ triệt để trước khi chuyển nguồn hoặc reset.
   * Tuân thủ Chương 3.2: "Chỉ có một nguồn phát hoạt động tại một thời điểm. Khi chuyển nguồn, phải dừng nguồn phát trước đó."
   */
  stopAll() {
    if (this.itunesAdapter) {
      this.itunesAdapter.stop();
    }
    if (this.youtubeAdapter) {
      this.youtubeAdapter.stop();
    }
    this.activeProvider = null;
  }

  /**
   * Load track into player without auto-playing
   * Đảm bảo không phát âm thanh tự động trước khi người dùng có thao tác hợp lệ.
   */
  loadTrack(track, options = {}) {
    if (!track) return;
    this.currentGenerationId++;
    const gen = this.currentGenerationId;

    // Dừng triệt để nguồn cũ
    this.stopAll();

    this.currentTrack = track;
    this.sourceType = this.detectSourceType(track);
    this.currentTime = 0;
    this.duration = Number(options.snippetDuration || track.snippetDuration || DEFAULT_SNIPPET_DURATION);
    this.setState(PlaybackState.PAUSED);

    if (this.sourceType === SourceType.YOUTUBE) {
      this.activeProvider = this.youtubeAdapter;
      this.youtubeAdapter.load(track, options, gen);
    } else {
      this.activeProvider = this.itunesAdapter;
      this.itunesAdapter.load(track, options, gen);
    }
  }

  /**
   * Play a track (user-initiated action)
   */
  playTrack(track, options = {}) {
    if (!track) return;

    const requestedStart = Number(options.snippetStart ?? track.audioSnippetStart ?? 0);
    const prevStart = Number(this.currentTrack?.audioSnippetStart ?? 0);

    // If same track is already loaded
    const isSameTrack = Boolean(
      this.currentTrack && (
        this.currentTrack.id === track.id ||
        (this.currentTrack.id === 'studio-preview-id' && track.id === 'studio-preview-id') ||
        (track.id === 'studio-preview-id' && this.currentTrack.externalSongUrl === track.externalSongUrl) ||
        (this.currentTrack.id === 'studio-preview-id' && this.currentTrack.externalSongUrl === track.externalSongUrl) ||
        (track.externalSongUrl && this.currentTrack.externalSongUrl === track.externalSongUrl) ||
        (track.youtubeId && this.currentTrack.youtubeId === track.youtubeId)
      )
    );

    if (isSameTrack && this.activeProvider) {
      this.isManuallyPaused = false;
      this.currentTrack = { ...this.currentTrack, ...track };
      if (options.snippetDuration || track.snippetDuration) {
        this.duration = Number(options.snippetDuration || track.snippetDuration);
      }
      if (options.loop !== undefined) {
        this.setLooping(options.loop);
      }
      // Unconditionally seek snippet to guarantee player synchronizes to requestedStart
      this.seekSnippet(requestedStart, options.snippetDuration || track.snippetDuration, true);
      if (this.playbackState !== PlaybackState.PLAYING) {
        this.resume();
      }
      return;
    }

    this.currentGenerationId++;
    const gen = this.currentGenerationId;

    // Dừng triệt để nguồn cũ trước khi phát bài mới
    this.stopAll();

    this.isManuallyPaused = false;
    this.currentTrack = track;
    this.sourceType = this.detectSourceType(track);
    this.currentTime = 0;
    this.duration = Number(options.snippetDuration || track.snippetDuration || DEFAULT_SNIPPET_DURATION);
    this.setState(PlaybackState.BUFFERING);

    if (options.loop !== undefined) {
      this.setLooping(options.loop);
    }

    if (this.sourceType === SourceType.YOUTUBE) {
      this.activeProvider = this.youtubeAdapter;
      this.youtubeAdapter.snippetDuration = this.duration;
      const videoId = track.youtubeId || this.youtubeAdapter.extractVideoId(track.externalSongUrl);
      const start = Number(options.snippetStart ?? track.audioSnippetStart ?? 0);
      this.youtubeAdapter.loadAndPlay(videoId, start, gen);
    } else {
      this.activeProvider = this.itunesAdapter;
      this.itunesAdapter.snippetDuration = this.duration;
      this.itunesAdapter.load(track, options, gen);
      this.itunesAdapter.play(gen);
    }
  }

  resume() {
    this.isManuallyPaused = false;
    if (!this.activeProvider) {
      if (this.currentTrack) {
        this.playTrack(this.currentTrack);
      }
      return;
    }

    // Crucial fix: If already at or near the end of the snippet (or in ENDED state),
    // replay from snippetStart so it doesn't immediately shut off!
    if (this.playbackState === PlaybackState.ENDED || this.currentTime >= this.duration - 0.3) {
      this.seekSnippet(this.currentTrack?.audioSnippetStart || 0, this.duration, true);
      return;
    }

    if (this.activeProvider === this.youtubeAdapter) {
      this.youtubeAdapter.play(this.currentGenerationId);
    } else if (this.activeProvider === this.itunesAdapter) {
      this.itunesAdapter.play(this.currentGenerationId);
    }
  }

  pause() {
    this.isManuallyPaused = true;
    if (this.activeProvider) {
      this.activeProvider.pause();
    }
    this.setState(PlaybackState.PAUSED);
  }

  togglePlay() {
    if (this.playbackState === PlaybackState.PLAYING) {
      this.pause();
    } else {
      this.resume();
    }
  }

  seekTo(relativeSeconds) {
    if (this.activeProvider) {
      this.activeProvider.seekTo(relativeSeconds);
    }
  }

  setSnippetDuration(duration) {
    const dur = Math.max(1, Number(duration) || DEFAULT_SNIPPET_DURATION);
    this.duration = dur;
    if (this.currentTrack) {
      this.currentTrack.snippetDuration = dur;
    }
    if (this.youtubeAdapter) {
      this.youtubeAdapter.snippetDuration = dur;
    }
    if (this.itunesAdapter) {
      this.itunesAdapter.snippetDuration = dur;
    }
    this.notify();
  }

  seekSnippet(startSec, duration, autoPlay = null) {
    const start = Math.max(0, Number(startSec) || 0);
    if (duration) this.duration = Number(duration);
    if (this.currentTrack) {
      this.currentTrack.audioSnippetStart = start;
      if (duration) this.currentTrack.snippetDuration = duration;
    }
    this.currentTime = 0;

    // If autoPlay is explicitly false, do not play!
    const shouldAutoPlay = autoPlay === true;

    if (this.activeProvider === this.youtubeAdapter) {
      this.youtubeAdapter.seekSnippet(start, this.duration, shouldAutoPlay);
    } else if (this.activeProvider === this.itunesAdapter) {
      this.itunesAdapter.seekSnippet(start, this.duration, shouldAutoPlay);
    }
    this.notify();
  }

  stop() {
    this.isManuallyPaused = true;
    this.currentGenerationId++;
    this.stopAll();
    this.currentTrack = null;
    this.currentTime = 0;
    this.setState(PlaybackState.IDLE);
  }
}

// Global Singleton Instance
export const playbackService = new MusicPlaybackService();
export default playbackService;

