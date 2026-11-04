/**
 * Get the current timestamp in ISO 8601 format.
 */
export function getNowIso(): string {
  return new Date().toISOString();
}

/**
 * Format an ISO timestamp to human-readable date (e.g., Nov 02, 2026).
 */
export function formatDate(isoString: string | null | undefined): string {
  if (!isoString) return '—';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return isoString || '—';
  }
}

/**
 * Format an ISO timestamp to human-readable date and time (e.g., Nov 02, 2026, 14:30).
 */
export function formatDateTime(isoString: string | null | undefined): string {
  if (!isoString) return '—';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString || '—';
  }
}

/**
 * Check if a work order is overdue:
 * dueDate is earlier than start of today AND status is not 'completed' or 'cancelled'.
 */
export function isOverdue(dueDateIso: string | null | undefined, status: string): boolean {
  if (!dueDateIso) return false;
  if (status === 'completed' || status === 'cancelled') return false;

  try {
    const dueDate = new Date(dueDateIso);
    if (isNaN(dueDate.getTime())) return false;
    
    // Compare date parts only
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const dueTime = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate()).getTime();

    return dueTime < todayStart;
  } catch {
    return false;
  }
}

/**
 * Check if an ISO timestamp occurred today (local calendar day).
 */
export function isToday(isoString: string | null | undefined): boolean {
  if (!isoString) return false;
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return false;
    const now = new Date();
    return (
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()
    );
  } catch {
    return false;
  }
}

/**
 * Get human-readable relative time string (e.g., "5m ago", "2h ago", "yesterday").
 */
export function getRelativeTime(isoString: string | null | undefined): string {
  if (!isoString) return '—';
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    if (diffMs < 0) return 'in the future';

    const diffSecs = Math.floor(diffMs / 1000);
    if (diffSecs < 60) return `${diffSecs}s ago`;

    const diffMins = Math.floor(diffSecs / 60);
    if (diffMins < 60) return `${diffMins}m ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 30) return `${diffDays}d ago`;

    return formatDate(isoString);
  } catch {
    return isoString || '—';
  }
}
