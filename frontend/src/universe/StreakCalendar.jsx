import React, { useState, useEffect } from 'react';
import { Flame, Calendar, Trophy, ChevronLeft, ChevronRight } from 'lucide-react';
import { authService } from '../services/authService';

export default function StreakCalendar({ userId, userStreak = 14 }) {
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(11); // November
  const [streakData, setStreakData] = useState(null);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  useEffect(() => {
    if (userId) {
      authService.getStreakCalendar(userId, year, month)
        .then((res) => {
          if (res?.data?.data) {
            setStreakData(res.data.data);
          }
        })
        .catch(() => {
          // Fallback gracefully without breaking UI
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

  // Generate 30/31 days for current month view
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDayIndex = new Date(year, month - 1, 1).getDay(); // 0 is Sunday
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <div className="w-full rounded-3xl bg-[#091d30]/70 border border-[#143552] p-5 select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-orange-950/60 border border-orange-600/40 flex items-center justify-center text-orange-400">
            <Flame className="w-4 h-4 fill-orange-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="text-xs font-bold text-[#E8EEF0] uppercase tracking-wider">
                Auditory Habit Streak
              </h4>
              <span className="text-xs font-extrabold text-orange-400 font-mono">
                {userStreak} Days
              </span>
            </div>
            <p className="text-[10px] text-[#91B9C5]/70">
              1 note posted per day sustains your cosmic stardust
            </p>
          </div>
        </div>

        {/* Month Navigator */}
        <div className="flex items-center gap-1 text-xs font-mono font-bold text-[#91B9C5]">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-1 rounded-lg hover:bg-[#122e47] text-[#91B9C5] hover:text-[#E8EEF0] cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-1 text-xs">
            {monthNames[month - 1]} {year}
          </span>
          <button
            type="button"
            onClick={handleNextMonth}
            className="p-1 rounded-lg hover:bg-[#122e47] text-[#91B9C5] hover:text-[#E8EEF0] cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Weekday Labels */}
      <div className="grid grid-cols-7 gap-1 text-center text-[9px] font-mono font-bold text-[#91B9C5]/60 mb-2">
        <span>SUN</span>
        <span>MON</span>
        <span>TUE</span>
        <span>WED</span>
        <span>THU</span>
        <span>FRI</span>
        <span>SAT</span>
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Leading empty pads */}
        {Array.from({ length: firstDayIndex }).map((_, idx) => (
          <div key={`pad-${idx}`} className="h-7 rounded-lg opacity-0" />
        ))}

        {days.map((d) => {
          // Check streak map or simulate recent active days
          const isActive = d >= 1 && d <= 14; // active days
          const isToday = d === 5 && month === 11;

          return (
            <div
              key={`day-${d}`}
              className={`h-7 rounded-lg flex items-center justify-center text-[10px] font-mono font-bold transition-all ${
                isToday
                  ? 'bg-cyan-400 text-[#081827] ring-2 ring-cyan-300 shadow-[0_0_8px_rgba(34,211,238,0.5)]'
                  : isActive
                  ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                  : 'bg-[#061421]/60 text-[#91B9C5]/40 border border-[#0f283d]'
              }`}
            >
              <span>{d}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
