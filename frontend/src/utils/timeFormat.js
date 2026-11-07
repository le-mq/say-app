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

  // Calculate elapsed time
  const diffMs = now.getTime() - d.getTime();
  const diffSecs = Math.max(0, Math.floor(diffMs / 1000));
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const isToday = diffDays < 1;

  let relative = '';
  let compact = '';

  if (diffDays >= 1) {
    // If 1 or more days have elapsed: show date + time + relative days
    relative = diffDays === 1 ? 'Yesterday' : `${diffDays}d ago`;
    compact = `${date} • ${time} (${relative})`;
  } else if (diffHours >= 1) {
    // Within today, 1+ hours: show countdown hours
    relative = `${diffHours}h ago`;
    compact = `${diffHours}h ago`;
  } else if (diffMins >= 1) {
    // Within the hour: show countdown minutes
    relative = `${diffMins}m ago`;
    compact = `${diffMins}m ago`;
  } else {
    relative = 'Just now';
    compact = 'Just now';
  }

  return {
    date,
    time,
    relative,
    compact,
    full: compact,
    diffDays,
    diffHours,
    diffMins,
    isToday
  };
}

