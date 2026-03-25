/**
 * Shared utility helpers used across both Bold and Safe variants.
 */

/** Human-readable relative time string from an ISO timestamp. */
export const formatRelativeTime = (timestamp: string): string => {
  const ms = Date.now() - new Date(timestamp).getTime();
  const seconds = Math.floor(Math.abs(ms) / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 30) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
};

/** Format a duration in seconds to e.g. "1m 34s" or "42s". */
export const formatDuration = (seconds?: number): string => {
  if (seconds == null) return '\u2014'; // em-dash
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
};
