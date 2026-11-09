/**
 * Format timestamp details for SAY Audiophile memories:
 * Returns:
 * - date: e.g. "Nov 5, 2026"
 * - time: e.g. "02:15 AM"
 * - relative: e.g. "Just now", "25m ago", "3h ago", "Yesterday", "2d ago"
 * - full: e.g. "Nov 5, 2026 • 02:15 AM (2d ago)"
 */
export function formatTimeDetails(dateStr) {
  if (!dateStr) {
    return {
      date: 'Starlight',
      time: '',
      relative: '',
      compact: 'Starlight',
      full: 'Starlight',
      diffDays: 0,
      diffHours: 0,
      diffMins: 0,
      isToday: true
    };
  }

  const d = new Date(dateStr);
  const now = new Date();

  // If invalid date fallback
  if (isNaN(d.getTime())) {
    return {
      date: 'Starlight',
      time: '',
      relative: '',
      compact: 'Starlight',
      full: 'Starlight',
      diffDays: 0,
      diffHours: 0,
      diffMins: 0,
      isToday: true
    };
  }

  // Exact 12-hour time with AM/PM
  const time = d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  // Clean date
  const date = d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  // Calculate calendar day difference using local midnight
  const nowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const dMidnight = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const calendarDiffDays = Math.max(0, Math.round((nowMidnight - dMidnight) / (1000 * 60 * 60 * 24)));

  // Calculate elapsed time
  const diffMs = now.getTime() - d.getTime();
  const diffSecs = Math.max(0, Math.floor(diffMs / 1000));
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const isToday = calendarDiffDays === 0;

  let relative = '';
  let compact = '';

  if (calendarDiffDays === 0) {
    if (diffHours >= 1) {
      relative = `${diffHours}h ago`;
    } else if (diffMins >= 1) {
      relative = `${diffMins}m ago`;
    } else {
      relative = 'Just now';
    }
    compact = `${relative} • ${time}`;
  } else if (calendarDiffDays === 1) {
    relative = 'Yesterday';
    compact = `Yesterday • ${time}`;
  } else {
    relative = `${calendarDiffDays}d ago`;
    compact = `${date} • ${time}`;
  }

  return {
    date,
    time,
    relative,
    compact,
    full: `${date} • ${time} (${relative})`,
    diffDays: calendarDiffDays,
    diffHours,
    diffMins,
    isToday
  };
}

