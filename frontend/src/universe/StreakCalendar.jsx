import React, { useState, useEffect, useMemo } from 'react';
import { Flame, Calendar, Trophy, ChevronLeft, ChevronRight, Music, Play } from 'lucide-react';
import { authService } from '../services/authService';
import { calculateCurrentStreak } from '../utils/streakUtils';

export default function StreakCalendar({
  userId,
  userNotes = [],
  activeNoteId = null,
  onPlayNote,
  onSelectNote
}) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [streakData, setStreakData] = useState(null);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  useEffect(() => {
    if (userId) {
      authService.getStreakCalendar(userId, year, month)
        .then((res) => {
          const data = Array.isArray(res) ? res[0] : (res?.data?.data || res?.data || res);
          if (data && data.days) {
            setStreakData(data);
          }
        })
        .catch((err) => {
          console.warn('Streak calendar fetch error:', err);
        });
    }
  }, [userId, year, month]);

  const handlePrevMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  // Generate days for current month view
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDayIndex = new Date(year, month - 1, 1).getDay(); // 0 is Sunday
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Group user notes by day of current month for rich Sonic Mosaic display
  const notesByDay = useMemo(() => {
    const map = {};
    if (Array.isArray(userNotes)) {
      userNotes.forEach((n) => {
        if (!n?.createdAt) return;
        const dt = new Date(n.createdAt);
        if (dt.getFullYear() === year && dt.getMonth() + 1 === month) {
          const dayNum = dt.getDate();
          if (!map[dayNum]) map[dayNum] = [];
          map[dayNum].push(n);
        }
      });
    }
    return map;
  }, [userNotes, year, month]);

  // Real Habit Streak: Only turns warm golden starlight amber when user sustains >= 7 consecutive days
  const actualStreak = streakData?.currentStreakDays ?? calculateCurrentStreak(userNotes) ?? 0;
  const isHotStreak = actualStreak >= 7;

  // Helper for GitHub-style graduated intensity level
  const getIntensityLevel = (count) => {
    if (!count || count <= 0) return 0;
    if (count === 1) return 1;
    if (count === 2) return 2;
    return 3;
  };

  return (
    <div className="w-full h-full rounded-3xl bg-[#091d30]/70 border border-[#143552] p-4 sm:p-5 select-text shadow-xl flex flex-col justify-between">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
            isHotStreak
              ? 'bg-amber-950/70 border border-amber-500/50 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
              : 'bg-[#0c2338] border border-[#1d4b73] text-cyan-300'
          }`}>
            <Flame className={`w-4 h-4 ${
              isHotStreak ? 'fill-amber-400 text-amber-400 animate-pulse' : 'fill-cyan-300/30 text-cyan-300'
            }`} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="text-xs font-bold text-[#E8EEF0] uppercase tracking-wider">
                Auditory Habit Streak
              </h4>
              <span className={`text-xs font-extrabold font-mono ${
                isHotStreak ? 'text-amber-400' : 'text-cyan-300'
              }`}>
                {actualStreak} {actualStreak === 1 ? 'Day' : 'Days'}
              </span>
            </div>
            <p className="text-[10px] text-[#91B9C5]/70">
              {isHotStreak
                ? '✨ Starlight Resonance active (7+ consecutive days sustained)'
                : `${actualStreak}/7 days to ignite Starlight Resonance`}
            </p>
          </div>
        </div>

        {/* Month Navigator */}
        <div className="flex items-center gap-1 text-xs font-mono font-bold text-[#91B9C5]">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-1 rounded-lg hover:bg-[#122e47] text-[#91B9C5] hover:text-[#E8EEF0] transition-colors cursor-pointer"
            title="Previous Month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-1 text-xs">
            {monthNames[month - 1]} {year}
          </span>
          <button
            type="button"
            onClick={handleNextMonth}
            className="p-1 rounded-lg hover:bg-[#122e47] text-[#91B9C5] hover:text-[#E8EEF0] transition-colors cursor-pointer"
            title="Next Month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Weekday Labels */}
      <div className="grid grid-cols-7 gap-1.5 text-center text-[9px] font-mono font-bold text-[#91B9C5]/60 mb-2">
        <span>SUN</span>
        <span>MON</span>
        <span>TUE</span>
        <span>WED</span>
        <span>THU</span>
        <span>FRI</span>
        <span>SAT</span>
      </div>

      {/* Sonic Mosaic Days Grid (Album Cover Art + Graduated Intensity Aura) */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {/* Leading empty pads */}
        {Array.from({ length: firstDayIndex }).map((_, idx) => (
          <div key={`pad-${idx}`} className="aspect-square rounded-lg sm:rounded-xl opacity-0" />
        ))}

        {days.map((d) => {
          const dayItem = streakData?.days?.find(item => item.dayOfMonth === d);
          const dayNotes = notesByDay[d] || [];
          const hasNote = Boolean(dayItem?.hasNote || dayNotes.length > 0);
          const noteCount = dayNotes.length || dayItem?.noteCount || (hasNote ? 1 : 0);
          const level = getIntensityLevel(noteCount);

          // Best note representation for this day
          const primaryNote = dayNotes[0] || (hasNote ? {
            id: dayItem?.noteId,
            songTitle: dayItem?.songTitle,
            artistName: dayItem?.artistName,
            songImageUrl: dayItem?.songImageUrl,
            templateType: dayItem?.templateType,
            emotionTag: dayItem?.emotionTag,
          } : null);

          const coverUrl = primaryNote?.songImageUrl || dayItem?.songImageUrl;
          const isCurrentMonth = now.getFullYear() === year && (now.getMonth() + 1) === month;
          const isToday = isCurrentMonth && now.getDate() === d;
          const isTrackActive = activeNoteId && primaryNote?.id && String(activeNoteId) === String(primaryNote.id);

          // Tooltip description
          const songLabel = primaryNote?.songTitle ? ` • "${primaryNote.songTitle}"` : '';
          const tooltip = noteCount > 0
            ? `${noteCount} note${noteCount === 1 ? '' : 's'} on ${monthNames[month - 1]} ${d}${songLabel}`
            : `No notes on ${monthNames[month - 1]} ${d}, ${year}`;

          // Graduated Border & Aura styling matching SAY Audiophile Dark Petrol & Amber Palette
          let auraStyle = 'border border-[#0f283d] text-[#91B9C5]/40';
          if (level === 1) {
            auraStyle = isHotStreak
              ? 'border border-amber-600/50 hover:border-amber-400'
              : 'border border-cyan-500/40 hover:border-cyan-400 shadow-xs';
          } else if (level === 2) {
            auraStyle = isHotStreak
              ? 'border-2 border-amber-500/80 shadow-[0_0_8px_rgba(245,158,11,0.3)] hover:shadow-[0_0_12px_rgba(245,158,11,0.5)]'
              : 'border-2 border-cyan-400/80 shadow-[0_0_8px_rgba(34,211,238,0.3)] hover:shadow-[0_0_12px_rgba(34,211,238,0.5)]';
          } else if (level >= 3) {
            auraStyle = isHotStreak
              ? 'ring-2 ring-amber-300 border-2 border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.45)] hover:shadow-[0_0_16px_rgba(245,158,11,0.65)]'
              : 'ring-2 ring-cyan-300 border-2 border-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.45)] hover:shadow-[0_0_16px_rgba(34,211,238,0.65)]';
          }

          return (
            <div
              key={`day-${d}`}
              onClick={() => {
                if (primaryNote) {
                  if (onPlayNote) onPlayNote(primaryNote);
                  if (onSelectNote) onSelectNote(primaryNote);
                }
              }}
              title={tooltip}
              className={`relative aspect-square rounded-lg sm:rounded-xl overflow-hidden flex flex-col justify-between p-1 sm:p-1.5 transition-all duration-200 select-none group ${
                hasNote ? 'cursor-pointer hover:scale-[1.05] hover:z-20' : 'cursor-default'
              } ${auraStyle} ${isToday ? 'ring-2 ring-cyan-300 ring-offset-1 ring-offset-[#081724]' : ''}`}
            >
              {/* 1. Sonic Mosaic Album Cover Art Background */}
              {hasNote && coverUrl ? (
                <>
                  <img
                    src={coverUrl}
                    alt={primaryNote?.songTitle || 'Album Art'}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  {/* Audiophile Micro-Gradient Vignette: Day number and badges remain 100% crisp */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/30 pointer-events-none group-hover:from-black/70 transition-opacity" />
                </>
              ) : (
                <div className="absolute inset-0 bg-[#061421]/60" />
              )}

              {/* 2. Top Header Row: Day Number & Multi-Album Stack Badge */}
              <div className="relative z-10 flex items-center justify-between w-full">
                <span className={`text-[10px] sm:text-xs font-mono font-bold drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] ${
                  hasNote ? 'text-white' : 'text-[#91B9C5]/50'
                }`}>
                  {d}
                </span>

                {/* Stack Badge for Days with >= 2 Notes */}
                {noteCount > 1 && (
                  <span className={`text-[8px] sm:text-[9px] font-mono font-extrabold px-1.5 py-0.2 rounded-full shadow-md flex items-center gap-0.5 leading-none ${
                    isHotStreak
                      ? 'bg-amber-400 text-amber-950 shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                      : 'bg-cyan-400 text-[#081827] shadow-[0_0_8px_rgba(34,211,238,0.5)]'
                  }`}>
                    <span>✦</span>
                    <span>{noteCount}</span>
                  </span>
                )}
              </div>

              {/* 3. Bottom Row: Interactive Play Signal */}
              {hasNote && (
                <div className="relative z-10 flex items-center justify-between w-full mt-auto">
                  {isTrackActive ? (
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping ml-auto" />
                  ) : (
                    <Play className="w-2.5 h-2.5 text-white/80 opacity-0 group-hover:opacity-100 transition-opacity ml-auto drop-shadow" />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* GitHub-style Legend & Month Summary */}
      <div className="flex items-center justify-between pt-3 mt-3 border-t border-[#122e47] text-[10px] text-[#91B9C5]/70 font-mono">
        <span>
          {streakData?.totalNotesThisMonth || Object.values(notesByDay).reduce((a, b) => a + b.length, 0)} total memory notes this month
        </span>
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] text-[#91B9C5]/60">Less</span>
          <div className="w-2.5 h-2.5 rounded-[3px] bg-[#061421] border border-[#0f283d]" title="0 notes" />
          <div
            className={`w-2.5 h-2.5 rounded-[3px] ${isHotStreak ? 'bg-amber-950/40 border border-amber-600/50' : 'bg-cyan-950/50 border border-cyan-500/40'}`}
            title="1 note"
          />
          <div
            className={`w-2.5 h-2.5 rounded-[3px] ${isHotStreak ? 'bg-amber-900/50 border border-amber-500/80' : 'bg-cyan-800/45 border border-cyan-400/80'}`}
            title="2 notes"
          />
          <div
            className={`w-2.5 h-2.5 rounded-[3px] ${isHotStreak ? 'bg-amber-700/60 border border-amber-400' : 'bg-cyan-600/50 border border-cyan-300'}`}
            title="3+ notes"
          />
          <span className="text-[9px] text-[#91B9C5]/60">More</span>
        </div>
      </div>
    </div>
  );
}
