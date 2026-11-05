import React, { useMemo } from 'react';
import { Play, Disc, Calendar, Music, Clock } from 'lucide-react';

/**
 * Format timestamp into display date e.g. "05 NOV" and group key "NOVEMBER 2026"
 */
function parseDate(dateStr) {
  const d = dateStr ? new Date(dateStr) : new Date();
  const day = String(d.getDate()).padStart(2, '0');
  const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const fullMonthNames = [
    'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
    'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
  ];
  const monthShort = monthNames[d.getMonth()];
  const monthFull = fullMonthNames[d.getMonth()];
  const year = d.getFullYear();

  return {
    dayBadge: `${day} ${monthShort}`,
    groupKey: `${monthFull} ${year}`,
    timestamp: d.getTime(),
  };
}

export default function MemoryTimeline({
  notes = [],
  activeNoteId = null,
  onSelectNote,
  onPlayNote,
  onCreateNote
}) {
  // Sort notes descending by createdAt and group by "MONTH YEAR"
  const groupedNotes = useMemo(() => {
    const sorted = [...notes].sort((a, b) => {
      const timeA = new Date(a.createdAt || 0).getTime();
      const timeB = new Date(b.createdAt || 0).getTime();
      return timeB - timeA;
    });

    const groups = {};
    sorted.forEach((note) => {
      const parsed = parseDate(note.createdAt);
      if (!groups[parsed.groupKey]) {
        groups[parsed.groupKey] = [];
      }
      groups[parsed.groupKey].push({
        ...note,
        dayBadge: parsed.dayBadge,
      });
    });

    return groups;
  }, [notes]);

  const groupKeys = Object.keys(groupedNotes);

  if (notes.length === 0) {
    return (
      <div className="w-full py-16 px-4 rounded-3xl bg-[#091b2c]/60 border border-[#14324b] flex flex-col items-center justify-center text-center">
        <Clock className="w-10 h-10 text-[#91B9C5]/50 mb-3" />
        <h4 className="text-sm font-bold text-[#E8EEF0] mb-1">No Memories in Timeline</h4>
        <p className="text-xs text-[#91B9C5]/70 max-w-sm mb-4">
          Start chronicling your life in sound. Each Music Note will appear along this chronological timeline.
        </p>
        {onCreateNote && (
          <button
            type="button"
            onClick={onCreateNote}
            className="px-4 py-2 rounded-xl bg-[#13324d] hover:bg-[#1a4468] text-xs font-semibold text-cyan-200 border border-cyan-500/30 transition-all cursor-pointer"
          >
            Create First Memory
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="w-full space-y-8 select-none">
      {groupKeys.map((groupKey) => (
        <div key={groupKey} className="space-y-4">
          {/* Timeline Group Header (e.g. NOVEMBER 2026) */}
          <div className="sticky top-20 z-10 py-1.5 flex items-center gap-3 bg-[#081724]/90 backdrop-blur-md">
            <span className="text-xs font-mono font-bold tracking-widest text-cyan-300 uppercase px-3 py-1 rounded-lg bg-[#0e273d] border border-[#1b4366]">
              {groupKey}
            </span>
            <div className="h-px flex-1 bg-gradient-to-r from-[#1b4366] to-transparent" />
          </div>

          {/* Timeline Items List */}
          <div className="relative pl-6 sm:pl-8 border-l border-[#193a54] space-y-4 ml-3 sm:ml-4">
            {groupedNotes[groupKey].map((note) => {
              const isPlaying = activeNoteId === note.id;

              return (
                <div
                  key={note.id}
                  className="relative group transition-all"
                >
                  {/* Timeline Indicator Dot */}
                  <div
                    className={`absolute -left-[31px] sm:-left-[39px] top-4 w-3.5 h-3.5 rounded-full border-2 transition-all duration-200 ${
                      isPlaying
                        ? 'bg-cyan-300 border-cyan-400 ring-4 ring-cyan-400/30 scale-125'
                        : 'bg-[#081724] border-[#91B9C5] group-hover:border-cyan-300 group-hover:scale-110'
                    }`}
                  />

                  {/* Note Card Row */}
                  <div className={`p-4 rounded-2xl bg-[#0a1f33]/80 hover:bg-[#0d2842] border transition-all duration-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                    isPlaying ? 'border-cyan-400/60 shadow-[0_0_20px_rgba(34,211,238,0.15)]' : 'border-[#14324d] hover:border-[#1d476d]'
                  }`}>
                    
                    {/* Left: Day Badge & Track Info */}
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      {/* Day Badge */}
                      <span className="text-[11px] font-mono font-bold text-[#91B9C5]/80 px-2.5 py-1.5 rounded-xl bg-[#071726] border border-[#15344f] shrink-0">
                        {note.dayBadge}
                      </span>

                      {/* Song Cover Art */}
                      <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-[#1b4366] shrink-0 bg-[#071625]">
                        <img
                          src={note.songImageUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=120'}
                          alt={note.songTitle}
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

                      {/* Metadata & Personal Note */}
                      <div className="overflow-hidden min-w-0">
                        <div className="flex items-center gap-2">
                          <h5 className="font-bold text-xs text-[#E8EEF0] truncate group-hover:text-cyan-200 transition-colors">
                            {note.songTitle}
                          </h5>
                          {note.templateType && (
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#102b44] text-[#91B9C5]/90 border border-[#1b4366]">
                              {note.templateType}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#91B9C5]/75 truncate">
                          {note.artistName}
                        </p>
                        {(note.caption || note.lyricSnippet) && (
                          <p className="text-[11px] text-[#E8EEF0]/85 italic line-clamp-1 mt-1 font-serif">
                            "{note.caption || note.lyricSnippet}"
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#122c42]">
                      <button
                        type="button"
                        onClick={() => onPlayNote && onPlayNote(note)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          isPlaying
                            ? 'bg-cyan-400 text-[#081827] shadow-[0_0_12px_rgba(34,211,238,0.5)]'
                            : 'bg-[#122e47] hover:bg-[#1a4061] text-[#E8EEF0] border border-[#1e486e]'
                        }`}
                        title={isPlaying ? 'Now Playing' : 'Play Snippet'}
                      >
                        {isPlaying ? (
                          <>
                            <Disc className="w-3.5 h-3.5 animate-spin" />
                            <span>Playing</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>Play</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => onSelectNote && onSelectNote(note)}
                        className="px-3 py-1.5 rounded-xl bg-[#091b2c] hover:bg-[#102d47] border border-[#163857] text-xs font-medium text-[#91B9C5] hover:text-[#E8EEF0] transition-colors cursor-pointer"
                      >
                        Details
                      </button>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

