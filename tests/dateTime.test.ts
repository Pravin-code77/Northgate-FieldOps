import { formatDate, formatDateTime, getRelativeTime, isOverdue } from '../src/utils/dateTime';

describe('DateTime Utility Rules', () => {
  test('isOverdue identifies past due dates for pending jobs', () => {
    // 2020-01-01 is definitely past
    expect(isOverdue('2020-01-01', 'pending')).toBe(true);
    expect(isOverdue('2020-01-01', 'in_progress')).toBe(true);
  });

  test('isOverdue returns false for completed or cancelled jobs even if date is past', () => {
    expect(isOverdue('2020-01-01', 'completed')).toBe(false);
    expect(isOverdue('2020-01-01', 'cancelled')).toBe(false);
  });

  test('isOverdue returns false for future due dates', () => {
    expect(isOverdue('2099-12-31', 'pending')).toBe(false);
  });

  test('formatDate formats ISO string properly', () => {
    const formatted = formatDate('2026-10-15T12:00:00.000Z');
    expect(formatted).toContain('2026');
    expect(formatted).toContain('15');
  });

  test('formatDate handles null or invalid inputs gracefully', () => {
    expect(formatDate(null)).toBe('—');
    expect(formatDate(undefined)).toBe('—');
  });

  test('getRelativeTime handles recent seconds', () => {
    const now = new Date();
    const tenSecsAgo = new Date(now.getTime() - 10000).toISOString();
    expect(getRelativeTime(tenSecsAgo)).toMatch(/s ago/);
  });
});
