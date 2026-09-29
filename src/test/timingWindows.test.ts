// Unit tests validating timing windows, on-time vs late cutoffs, and 24h-skip non-blocking behavior.
import { describe, it, expect } from 'vitest';
import {
  evaluate24hWindow,
  evaluate7dWindow,
  formatFriendlyDuration,
  getElapsedHours,
} from '../lib/timingWindows';

describe('Timing Windows Evaluation', () => {
  const baseTime = '2026-09-01T12:00:00.000Z';

  describe('24-Hour Window', () => {
    it('is early when elapsed < 22 hours', () => {
      const result = evaluate24hWindow(baseTime, 10);
      expect(result.status).toBe('early');
      expect(result.late).toBe(false);
      expect(result.hoursUntilOpen).toBe(12);
      expect(result.msUntilOpen).toBe(12 * 3600000);
    });

    it('is open and on-time when elapsed is between 22 and 48 hours', () => {
      const atOpen = evaluate24hWindow(baseTime, 22);
      expect(atOpen.status).toBe('open');
      expect(atOpen.late).toBe(false);

      const midWindow = evaluate24hWindow(baseTime, 35);
      expect(midWindow.status).toBe('open');
      expect(midWindow.late).toBe(false);

      const atBoundary = evaluate24hWindow(baseTime, 48);
      expect(atBoundary.status).toBe('open');
      expect(atBoundary.late).toBe(false);
    });

    it('is open but marked late when elapsed is between 48.01 and 72 hours', () => {
      const slightlyLate = evaluate24hWindow(baseTime, 48.5);
      expect(slightlyLate.status).toBe('open');
      expect(slightlyLate.late).toBe(true);

      const atClose = evaluate24hWindow(baseTime, 72);
      expect(atClose.status).toBe('open');
      expect(atClose.late).toBe(true);
    });

    it('is closed when elapsed > 72 hours', () => {
      const closed = evaluate24hWindow(baseTime, 72.1);
      expect(closed.status).toBe('closed');
    });
  });

  describe('7-Day Window', () => {
    it('is early when elapsed < 156 hours (6.5 days)', () => {
      const result = evaluate7dWindow(baseTime, 100);
      expect(result.status).toBe('early');
      expect(result.late).toBe(false);
      expect(result.hoursUntilOpen).toBe(56);
    });

    it('is open and on-time between 156 and 240 hours (6.5 to 10 days)', () => {
      const atOpen = evaluate7dWindow(baseTime, 156);
      expect(atOpen.status).toBe('open');
      expect(atOpen.late).toBe(false);

      const atBoundary = evaluate7dWindow(baseTime, 240);
      expect(atBoundary.status).toBe('open');
      expect(atBoundary.late).toBe(false);
    });

    it('is open and marked late between 240.01 and 336 hours (10 to 14 days)', () => {
      const lateResult = evaluate7dWindow(baseTime, 260);
      expect(lateResult.status).toBe('open');
      expect(lateResult.late).toBe(true);

      const atClose = evaluate7dWindow(baseTime, 336);
      expect(atClose.status).toBe('open');
      expect(atClose.late).toBe(true);
    });

    it('is closed when elapsed > 336 hours (14 days)', () => {
      const closed = evaluate7dWindow(baseTime, 336.5);
      expect(closed.status).toBe('closed');
    });

    it('allows 7d test even if 24h test was skipped or expired', () => {
      // At 160 hours (Day 6.67), 24h is closed, but 7d is open!
      const status24h = evaluate24hWindow(baseTime, 160);
      const status7d = evaluate7dWindow(baseTime, 160);

      expect(status24h.status).toBe('closed');
      expect(status7d.status).toBe('open');
      expect(status7d.late).toBe(false);
    });
  });

  describe('Friendly Countdown Formatting', () => {
    it('formats days and hours properly', () => {
      const ms = (2 * 24 + 5) * 3600000; // 2 days, 5 hours
      expect(formatFriendlyDuration(ms)).toBe('2 days, 5 hours');
    });

    it('formats hours and minutes properly', () => {
      const ms = (3 * 60 + 15) * 60000; // 3 hours, 15 minutes
      expect(formatFriendlyDuration(ms)).toBe('3 hours, 15 minutes');
    });

    it('handles ready state', () => {
      expect(formatFriendlyDuration(0)).toBe('Ready now');
      expect(formatFriendlyDuration(-100)).toBe('Ready now');
    });
  });

  describe('Dev Time Simulation Override', () => {
    it('overrides elapsed hours when simulatedHoursOverride is provided in DEV', () => {
      const simulatedHours = 24.5;
      const hours = getElapsedHours(baseTime, simulatedHours);
      expect(hours).toBe(24.5);
    });
  });
});
