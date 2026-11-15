/**
 * Extract snippet start time and duration (in seconds) from a music note.
 * Supports explicit snippetDuration, templateType suffix (e.g. "CASSETTE:45"),
 * URL fragment/query ("#snippetDur=45"), or audioSnippetEnd - audioSnippetStart.
 */
export function extractSnippetTiming(note) {
  if (!note) {
    return { snippetStart: 0, snippetDuration: 30 };
  }

  const rawTemplate = (note.templateType || 'RECEIPTIFY').toUpperCase();
  const urlDurMatch = note.externalSongUrl?.match(/[#&?]snippetDur=(\d+)/);
  const start = Number(note.audioSnippetStart) || 0;

  const computedEndDiff =
    note.audioSnippetEnd != null && note.audioSnippetStart !== undefined
      ? Number(note.audioSnippetEnd) - start
      : null;

  const snippetDuration = Number(
    note.snippetDuration ||
      (rawTemplate.includes(':') ? rawTemplate.split(':')[1] : null) ||
      (urlDurMatch ? urlDurMatch[1] : null) ||
      (computedEndDiff && computedEndDiff > 0 ? computedEndDiff : null) ||
      30
  );

  return {
    snippetStart: start,
    snippetDuration: snippetDuration > 0 ? snippetDuration : 30,
  };
}

/**
 * Build a normalized track payload and playback options for playerStore.playTrack.
 */
export function buildPlayableTrack(note) {
  const { snippetStart, snippetDuration } = extractSnippetTiming(note);
  return {
    track: {
      id: note.id,
      songTitle: note.songTitle,
      artistName: note.artistName,
      externalSongUrl: note.externalSongUrl,
      songImageUrl: note.songImageUrl,
      audioSnippetStart: snippetStart,
      audioSnippetEnd: snippetStart + snippetDuration,
      snippetDuration,
      templateType: note.templateType,
      emotionTag: note.emotionTag,
    },
    options: {
      snippetStart,
      snippetDuration,
      loop: true,
    },
  };
}
