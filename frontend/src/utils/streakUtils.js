/**
 * Calculates the user's real daily streak count based on actual note creation timestamps.
 * - A streak increments for consecutive calendar days with at least one published note.
 * - If the user published today, the streak counts consecutively backwards from today.
 * - If the user has not published yet today, but published yesterday, the streak is preserved from yesterday.
 * - If neither today nor yesterday has any published note, the current streak is 0.
 */
export function calculateCurrentStreak(notes) {
  if (!Array.isArray(notes) || notes.length === 0) return 0;

  const activeDateSet = new Set();
  notes.forEach((n) => {
    const raw = n?.createdAt;
    if (!raw) return;
    const d = new Date(raw);
    if (!isNaN(d.getTime())) {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      activeDateSet.add(`${year}-${month}-${day}`);
    }
  });

  if (activeDateSet.size === 0) return 0;

  const formatYMD = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const now = new Date();
  const todayStr = formatYMD(now);

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = formatYMD(yesterday);

  let startDate;
  if (activeDateSet.has(todayStr)) {
    startDate = new Date(now);
  } else if (activeDateSet.has(yesterdayStr)) {
    startDate = new Date(yesterday);
  } else {
    // Streak is broken
    return 0;
  }

  let streak = 0;
  const cursor = new Date(startDate);
  // Cap at 3650 days (10 years) to prevent any infinite loop edge-case
  for (let i = 0; i < 3650; i++) {
    const key = formatYMD(cursor);
    if (activeDateSet.has(key)) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}
