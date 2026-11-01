import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { authService } from '../services/authService';
import { noteService } from '../services/noteService';
import MusicCard from '../components/MusicCard';
import { Flame, Disc, Award, Calendar, Sparkles } from 'lucide-react';

export default function Profile() {
  const { user } = useAuthStore();
  const [streakData, setStreakData] = useState(null);
  const [userNotes, setUserNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(false);
      try {
        const streak = await authService.getStreakCalendar(user.id);
        setStreakData(streak);
      } catch (err) {
        // Fallback simulated streak
        const mockDays = Array.from({ length: 30 }, (_, i) => ({
          dayOfMonth: i + 1,
          hasNote: [2, 3, 4, 7, 8, 9, 10, 14, 15, 20, 21, 22, 23].includes(i + 1),
          songImageUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=200",
          songTitle: `Track on Day ${i + 1}`,
          artistName: "Audiophile",
          emotionTag: "🌙 Melancholy"
        }));
        setStreakData({
          totalNotesThisMonth: 13,
          currentStreakDays: 4,
          days: mockDays,
        });
      }

      try {
        const notes = await noteService.getUserNotes(user.id);
        setUserNotes(notes || []);
      } catch (err) {
        setUserNotes([]);
      }
    }
    loadData();
  }, [user.id]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 pb-32 space-y-8">
      
      {/* Profile Card Header */}
      <div className="bg-[#142C40] border border-[#31566A]/40 rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
        <div className="relative">
          <img
            src={user.avatarUrl}
            alt={user.displayName}
            className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover ring-4 ring-[#91B9C5]/40 shadow-xl"
          />
          <div className="absolute -bottom-1 -right-1 bg-[#91B9C5] text-[#081724] p-1.5 rounded-full shadow">
            <Disc className="w-5 h-5 animate-spin-slow" />
          </div>
        </div>

        <div className="flex-1">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mb-2">
            <h1 className="text-2xl font-extrabold text-[#E8EEF0]">{user.displayName}</h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#31566A]/50 border border-[#91B9C5]/30 text-xs font-mono text-[#91B9C5]">
              <Award className="w-3.5 h-3.5 text-[#B39DDB]" />
              {user.audiophileRank}
            </span>
          </div>

          <p className="text-xs sm:text-sm text-[#91B9C5]/80 max-w-lg mb-4 leading-relaxed">
            {user.bio}
          </p>

          <div className="flex items-center justify-center sm:justify-start gap-6 text-xs text-[#91B9C5]/90 border-t border-[#31566A]/30 pt-3">
            <div>
              <span className="font-extrabold text-base text-[#E8EEF0] block leading-none">
                {streakData?.totalNotesThisMonth || 0}
              </span>
              <span className="text-[10px] uppercase font-mono">Monthly Notes</span>
            </div>
            <div>
              <span className="font-extrabold text-base text-[#E8EEF0] block leading-none flex items-center gap-1">
                <Flame className="w-4 h-4 text-orange-400 fill-orange-400" />
                {streakData?.currentStreakDays || 0} Days
              </span>
              <span className="text-[10px] uppercase font-mono">Current Streak</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sonic Aura 31-Day Streak Calendar */}
      <section className="bg-[#142C40]/80 border border-[#31566A]/40 rounded-3xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#91B9C5]" />
            <h2 className="text-lg font-bold text-[#E8EEF0]">Sonic Aura Streak Calendar</h2>
          </div>
          <span className="text-xs font-mono text-[#B39DDB] flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> 31-Day Sonic Habit
          </span>
        </div>
        <p className="text-xs text-[#91B9C5]/70 mb-6">
          Every day you share a 30s song note, your calendar lights up with that day's album artwork.
        </p>

        {/* 31-Day Grid */}
        <div className="grid grid-cols-7 sm:grid-cols-10 md:grid-cols-11 gap-2.5">
          {streakData?.days?.map(d => (
            <div
              key={d.dayOfMonth}
              className={`relative aspect-square rounded-2xl flex flex-col items-center justify-center border transition-all overflow-hidden group ${
                d.hasNote
                  ? 'border-[#91B9C5] shadow-lg ring-1 ring-[#91B9C5]/40 hover:scale-105'
                  : 'border-[#31566A]/30 bg-[#081724]/40 text-[#91B9C5]/40'
              }`}
            >
              {d.hasNote ? (
                <>
                  <img
                    src={d.songImageUrl}
                    alt={d.songTitle}
                    className="absolute inset-0 w-full h-full object-cover opacity-85 group-hover:opacity-100 transition-opacity"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#081724]/90 via-transparent to-transparent" />
                  <span className="absolute bottom-1 right-1.5 text-[9px] font-mono font-bold text-white z-10">
                    {d.dayOfMonth}
                  </span>
                </>
              ) : (
                <span className="text-xs font-mono">{d.dayOfMonth}</span>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* User Notes Collection */}
      <section>
        <h2 className="text-lg font-bold text-[#E8EEF0] mb-4">Your Dropped Notes</h2>
        {userNotes.length === 0 ? (
          <p className="text-xs text-[#91B9C5]/70 italic">No notes created yet. Use the "+ Drop Note" button to share one!</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {userNotes.map(n => (
              <MusicCard key={n.id} note={n} />
            ))}
          </div>
        )}
      </section>

    </div>
  );
}
