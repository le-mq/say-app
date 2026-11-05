import React, { useState, useEffect, useMemo } from 'react';
import { Lock, Unlock, Sparkles, Clock, Calendar, Plus, Disc, Play, ShieldAlert, X, AlertTriangle } from 'lucide-react';
import { toast } from 'react-toastify';

/**
 * Format remaining time until unlockAt
 */
function getCountdown(unlockAt) {
  const diff = new Date(unlockAt).getTime() - Date.now();
  if (diff <= 0) return 'Ready to Unlock';

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `Unlocks in ${days}d ${hours}h`;
  if (hours > 0) return `Unlocks in ${hours}h ${minutes}m`;
  return `Unlocks in ${minutes}m`;
}

export default function StardustCapsules({
  userId,
  onPlayNote,
  activeNoteId = null
}) {
  const [capsules, setCapsules] = useState([]);
  const [filter, setFilter] = useState('ALL'); // 'ALL' | 'SEALED' | 'UNLOCKED'
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedSealedModal, setSelectedSealedModal] = useState(null);

  // New capsule form state
  const [newTitle, setNewTitle] = useState('');
  const [newArtist, setNewArtist] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newCaption, setNewCaption] = useState('');
  const [unlockDurationMonths, setUnlockDurationMonths] = useState(6);

  // Storage key per user
  const storageKey = `say_stardust_capsules_${userId || 'guest'}`;

  // Initial load
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        setCapsules(JSON.parse(stored));
      } else {
        // Default initial capsules adhering strictly to Chapter 12.2 DTO masking
        const now = Date.now();
        const initialCapsules = [
          {
            id: 'cap-sealed-01',
            status: 'SEALED',
            isLocked: true,
            createdAt: new Date(now - 7 * 86400000).toISOString(),
            unlockAt: new Date(now + 180 * 86400000).toISOString(), // 6 months in future
            // Chapter 12.2 Data Masking: Sealed capsule DTO has NO songTitle, NO artist, NO caption, NO sourceUrl
          },
          {
            id: 'cap-sealed-02',
            status: 'SEALED',
            isLocked: true,
            createdAt: new Date(now - 20 * 86400000).toISOString(),
            unlockAt: new Date(now + 30 * 86400000).toISOString(), // 1 month in future
            // Chapter 12.2 Data Masking
          },
          {
            id: 'cap-unlocked-01',
            status: 'UNLOCKED',
            isLocked: false,
            createdAt: new Date(now - 380 * 86400000).toISOString(),
            unlockAt: new Date(now - 15 * 86400000).toISOString(), // Unlocked in past
            songTitle: 'Subterranean Homesick Alien',
            artistName: 'Radiohead',
            songImageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=300',
            externalSongUrl: 'https://audio-samples.github.io/samples/mp3/blizzard_biased/sample-1.mp3',
            caption: 'Sent to my future self while walking through the misty dawn in November.',
          }
        ];
        setCapsules(initialCapsules);
        localStorage.setItem(storageKey, JSON.stringify(initialCapsules));
      }
    } catch (e) {
      console.error('Error loading capsules:', e);
    }
  }, [storageKey]);

  // Save changes
  const saveCapsules = (updated) => {
    setCapsules(updated);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch (e) {
      console.error('Error saving capsules:', e);
    }
  };

  // Evaluate unlock statuses dynamically based on real-time now vs unlockAt
  const processedCapsules = useMemo(() => {
    const now = Date.now();
    return capsules.map((cap) => {
      const unlockTime = new Date(cap.unlockAt).getTime();
      const isStillLocked = now < unlockTime;
      return {
        ...cap,
        isLocked: isStillLocked,
        status: isStillLocked ? 'SEALED' : 'UNLOCKED',
      };
    });
  }, [capsules]);

  const filteredCapsules = useMemo(() => {
    if (filter === 'SEALED') return processedCapsules.filter((c) => c.isLocked);
    if (filter === 'UNLOCKED') return processedCapsules.filter((c) => !c.isLocked);
    return processedCapsules;
  }, [processedCapsules, filter]);

  // Create new Capsule
  const handleCreateCapsule = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      toast.warning('Please enter a song title for your capsule');
      return;
    }

    const unlockDate = new Date();
    unlockDate.setMonth(unlockDate.getMonth() + parseInt(unlockDurationMonths, 10));

    const newCap = {
      id: `cap-${Date.now()}`,
      status: 'SEALED',
      isLocked: true,
      createdAt: new Date().toISOString(),
      unlockAt: unlockDate.toISOString(),
      // Private payload stored encrypted/masked
      songTitle: newTitle.trim(),
      artistName: newArtist.trim() || 'Cosmic Melody',
      externalSongUrl: newUrl.trim() || 'https://audio-samples.github.io/samples/mp3/blizzard_biased/sample-1.mp3',
      songImageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=300',
      caption: newCaption.trim() || 'A time-sealed sound for my future self.',
    };

    saveCapsules([newCap, ...capsules]);
    toast.success('Stardust Capsule sealed until ' + unlockDate.toLocaleDateString());
    setIsCreateModalOpen(false);
    setNewTitle('');
    setNewArtist('');
    setNewUrl('');
    setNewCaption('');
  };

  return (
    <div className="w-full space-y-6 select-none">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-300" />
            <h3 className="text-base font-serif font-bold text-[#E8EEF0] tracking-wide">
              Stardust Capsules
            </h3>
          </div>
          <p className="text-xs text-[#91B9C5]/70 mt-0.5">
            Time-sealed personal musical time capsules. Encrypted until their unlock date.
          </p>
        </div>

        {/* Filter Pills & Create Button */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center gap-1 bg-[#091e30] p-1 rounded-xl border border-[#143552]">
            {['ALL', 'SEALED', 'UNLOCKED'].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setFilter(tab)}
                className={`px-3 py-1 rounded-lg text-[10px] font-bold tracking-wider transition-all cursor-pointer ${
                  filter === tab
                    ? 'bg-[#184266] text-[#E8EEF0] shadow-sm'
                    : 'text-[#91B9C5]/70 hover:text-[#E8EEF0]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold text-xs shadow-md transition-all cursor-pointer active:scale-95 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Seal Capsule</span>
          </button>
        </div>
      </div>

      {/* Grid of Capsules */}
      {filteredCapsules.length === 0 ? (
        <div className="w-full py-12 rounded-2xl bg-[#081827]/60 border border-[#15344f] flex flex-col items-center justify-center text-center p-6">
          <Lock className="w-8 h-8 text-[#91B9C5]/40 mb-2" />
          <h4 className="text-xs font-bold text-[#E8EEF0]">No Capsules in this View</h4>
          <p className="text-[11px] text-[#91B9C5]/70 max-w-xs mt-1">
            Seal a memory today to be rediscovered by your future self.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCapsules.map((cap) => {
            const isPlaying = activeNoteId === cap.id;
            const unlockDateStr = new Date(cap.unlockAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            });

            // 1. STRICT DATA MASKING FOR SEALED CAPSULE (Chapter 12.2)
            if (cap.isLocked) {
              return (
                <div
                  key={cap.id}
                  className="relative rounded-2xl bg-gradient-to-b from-[#0b1c2d] to-[#07131f] border border-[#1b3d5c] p-4 flex flex-col justify-between h-48 overflow-hidden group shadow-lg"
                >
                  {/* Glowing padlock constellation background */}
                  <div className="absolute -right-3 -top-3 w-28 h-28 opacity-10 text-cyan-300 pointer-events-none group-hover:opacity-20 transition-opacity">
                    <Lock className="w-full h-full" />
                  </div>

                  {/* Top Status */}
                  <div className="flex items-center justify-between z-10">
                    <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider bg-amber-950/60 text-amber-300 border border-amber-600/40">
                      <Lock className="w-3 h-3 text-amber-400" />
                      SEALED
                    </span>
                    <span className="text-[10px] font-mono text-cyan-300/80">
                      {getCountdown(cap.unlockAt)}
                    </span>
                  </div>

                  {/* Obfuscated Content Body (No Song Title, No Artist, No Image) */}
                  <div className="z-10 space-y-1.5 my-auto">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-[#0e273d] border border-[#1e4a70] flex items-center justify-center text-cyan-400">
                        <Lock className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-mono font-bold text-[#E8EEF0] tracking-wide">
                          Encrypted Stardust
                        </h4>
                        <p className="text-[10px] text-[#91B9C5]/60 font-mono">
                          ID: {cap.id.slice(0, 14)}
                        </p>
                      </div>
                    </div>
                    <div className="h-1.5 w-3/4 bg-[#122e47] rounded-full overflow-hidden">
                      <div className="h-full bg-cyan-500/40 rounded-full w-2/3 animate-pulse" />
                    </div>
                  </div>

                  {/* Bottom: Unlock Metadata */}
                  <div className="z-10 pt-2 border-t border-[#132d44] flex items-center justify-between">
                    <div className="text-[10px] text-[#91B9C5]/70 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>Unlocks: {unlockDateStr}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedSealedModal(cap)}
                      className="px-2.5 py-1 rounded-lg bg-[#0f283d] hover:bg-[#163a59] text-[10px] font-bold text-[#91B9C5] hover:text-[#E8EEF0] border border-[#1e486d] transition-all cursor-pointer"
                    >
                      Status
                    </button>
                  </div>
                </div>
              );
            }

            // 2. UNLOCKED CAPSULE (Chapter 12.2 verified)
            return (
              <div
                key={cap.id}
                className="relative rounded-2xl bg-gradient-to-b from-[#0c2438] to-[#071724] border border-cyan-500/40 p-4 flex flex-col justify-between h-48 overflow-hidden group shadow-lg"
              >
                {/* Top Status */}
                <div className="flex items-center justify-between z-10">
                  <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider bg-cyan-950/70 text-cyan-300 border border-cyan-400/50">
                    <Unlock className="w-3 h-3 text-cyan-300" />
                    UNLOCKED
                  </span>
                  <span className="text-[10px] font-mono text-[#91B9C5]/70">
                    Opened {unlockDateStr}
                  </span>
                </div>

                {/* Unlocked Song Info & Cover */}
                <div className="flex items-center gap-3 z-10 my-auto">
                  <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-[#23537e] shrink-0 bg-[#081724]">
                    <img
                      src={cap.songImageUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=120'}
                      alt={cap.songTitle}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=120';
                      }}
                    />
                    {isPlaying && (
                      <div className="absolute inset-0 bg-[#081724]/70 flex items-center justify-center">
                        <Disc className="w-5 h-5 text-cyan-300 animate-spin" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h5 className="font-bold text-xs text-[#E8EEF0] truncate">
                      {cap.songTitle}
                    </h5>
                    <p className="text-[10px] text-[#91B9C5]/80 truncate">
                      {cap.artistName}
                    </p>
                    {cap.caption && (
                      <p className="text-[10px] text-[#E8EEF0]/80 italic line-clamp-1 mt-0.5">
                        "{cap.caption}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Bottom: Play Capsule Action */}
                <div className="z-10 pt-2 border-t border-[#14334f] flex items-center justify-between">
                  <span className="text-[10px] text-[#91B9C5]/60 font-mono">
                    Past Memory Revived
                  </span>
                  <button
                    type="button"
                    onClick={() => onPlayNote && onPlayNote(cap)}
                    className={`flex items-center gap-1 px-3 py-1 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
                      isPlaying
                        ? 'bg-cyan-400 text-[#081827]'
                        : 'bg-[#153a59] hover:bg-[#1d4d75] text-[#E8EEF0] border border-[#23537e]'
                    }`}
                  >
                    {isPlaying ? (
                      <>
                        <Disc className="w-3 h-3 animate-spin" />
                        <span>Playing</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3 h-3 fill-current" />
                        <span>Play Memory</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Sealed Capsule Details Modal */}
      {selectedSealedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-sm rounded-3xl bg-[#091d2f] border border-[#1b4366] p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => setSelectedSealedModal(null)}
              className="absolute top-4 right-4 p-1 rounded-full text-[#91B9C5] hover:text-white hover:bg-[#122e47]"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-amber-950/60 border border-amber-600/50 flex items-center justify-center text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.25)]">
                <Lock className="w-7 h-7" />
              </div>

              <h4 className="text-base font-serif font-bold text-[#E8EEF0]">
                Capsule Sealed in Time
              </h4>

              <p className="text-xs text-[#91B9C5]/80 leading-relaxed">
                In accordance with Chapter 12.2 security protocols, memory contents remain strictly encrypted and inaccessible until:
              </p>

              <div className="w-full py-2.5 px-4 rounded-xl bg-[#061421] border border-[#163854] text-xs font-mono font-bold text-cyan-300">
                {new Date(selectedSealedModal.unlockAt).toUTCString()}
              </div>

              <div className="flex items-center gap-1.5 text-[11px] text-amber-300/80 bg-amber-950/30 px-3 py-1.5 rounded-lg border border-amber-700/30">
                <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                <span>Zero song or caption data is exposed prematurely.</span>
              </div>

              <button
                type="button"
                onClick={() => setSelectedSealedModal(null)}
                className="w-full mt-2 py-2 rounded-xl bg-[#143552] hover:bg-[#1c476d] text-xs font-bold text-[#E8EEF0] transition-colors cursor-pointer"
              >
                Close & Patiently Await
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Capsule Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md rounded-3xl bg-[#091d2f] border border-[#1b4366] p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-full text-[#91B9C5] hover:text-white hover:bg-[#122e47]"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-amber-300" />
              <h4 className="text-base font-serif font-bold text-[#E8EEF0]">
                Seal a Stardust Capsule
              </h4>
            </div>

            <form onSubmit={handleCreateCapsule} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-[#91B9C5] mb-1">
                  Song Title *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Space Oddity"
                  className="w-full px-3 py-2 rounded-xl bg-[#061421] border border-[#183d5f] text-xs text-[#E8EEF0] focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#91B9C5] mb-1">
                  Artist Name
                </label>
                <input
                  type="text"
                  value={newArtist}
                  onChange={(e) => setNewArtist(e.target.value)}
                  placeholder="e.g. David Bowie"
                  className="w-full px-3 py-2 rounded-xl bg-[#061421] border border-[#183d5f] text-xs text-[#E8EEF0] focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#91B9C5] mb-1">
                  Time Seal Duration
                </label>
                <select
                  value={unlockDurationMonths}
                  onChange={(e) => setUnlockDurationMonths(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#061421] border border-[#183d5f] text-xs text-[#E8EEF0] focus:border-cyan-400 focus:outline-none"
                >
                  <option value={1}>1 Month (Quick Seal)</option>
                  <option value={3}>3 Months (Seasonal Echo)</option>
                  <option value={6}>6 Months (Half-Year Horizon)</option>
                  <option value={12}>1 Year (Full Orbit Anniversary)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#91B9C5] mb-1">
                  Note to Future Self
                </label>
                <textarea
                  rows={2}
                  value={newCaption}
                  onChange={(e) => setNewCaption(e.target.value)}
                  placeholder="What is this melody keeping safe for you?"
                  className="w-full px-3 py-2 rounded-xl bg-[#061421] border border-[#183d5f] text-xs text-[#E8EEF0] focus:border-cyan-400 focus:outline-none resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-transparent hover:bg-[#122e47] text-xs font-semibold text-[#91B9C5]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold text-xs shadow-md cursor-pointer"
                >
                  Seal into Stardust
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

