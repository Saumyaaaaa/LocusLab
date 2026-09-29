// Pure timing window calculation helper for 24h and 7d memory return tests with dev-only simulation support.
export interface WindowEvaluation {
  phase: '24h' | '7d';
  status: 'early' | 'open' | 'closed';
  late: boolean;
  hoursUntilOpen: number;
  msUntilOpen: number;
  openDate: Date;
  closeDate: Date;
}

export const TIMING_CONSTRAINTS = {
  // 24-hour test window (measured from session_completed_at)
  TEST_24H_OPEN_HOURS: 22,
  TEST_24H_ONTIME_HOURS: 48,
  TEST_24H_CLOSE_HOURS: 72,

  // 7-day test window (measured from session_completed_at)
  TEST_7D_OPEN_HOURS: 156, // 6.5 days
  TEST_7D_ONTIME_HOURS: 240, // 10 days
  TEST_7D_CLOSE_HOURS: 336, // 14 days
} as const;

/**
 * Calculates elapsed hours from session completion.
 * Includes dev-only simulation override stripped from production builds.
 */
export function getElapsedHours(
  sessionCompletedAt: string | Date,
  simulatedHoursOverride?: number | null
): number {
  const completedMs = new Date(sessionCompletedAt).getTime();

  if (import.meta.env.DEV) {
    if (typeof simulatedHoursOverride === 'number' && !isNaN(simulatedHoursOverride)) {
      return simulatedHoursOverride;
    }
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const sim = params.get('simElapsedHours');
      if (sim !== null) {
        const parsed = parseFloat(sim);
        if (!isNaN(parsed)) {
          return parsed;
        }
      }
    }
  }

  const elapsedMs = Math.max(0, Date.now() - completedMs);
  return elapsedMs / (1000 * 60 * 60);
}

/**
 * Evaluates the 24-hour test window status.
 */
export function evaluate24hWindow(
  sessionCompletedAt: string | Date,
  elapsedHours?: number
): WindowEvaluation {
  const completedMs = new Date(sessionCompletedAt).getTime();
  const elapsed = elapsedHours ?? getElapsedHours(sessionCompletedAt);

  const openMs = completedMs + TIMING_CONSTRAINTS.TEST_24H_OPEN_HOURS * 3600000;
  const closeMs = completedMs + TIMING_CONSTRAINTS.TEST_24H_CLOSE_HOURS * 3600000;

  if (elapsed < TIMING_CONSTRAINTS.TEST_24H_OPEN_HOURS) {
    const diffHours = TIMING_CONSTRAINTS.TEST_24H_OPEN_HOURS - elapsed;
    return {
      phase: '24h',
      status: 'early',
      late: false,
      hoursUntilOpen: diffHours,
      msUntilOpen: diffHours * 3600000,
      openDate: new Date(openMs),
      closeDate: new Date(closeMs),
    };
  }

  if (elapsed <= TIMING_CONSTRAINTS.TEST_24H_CLOSE_HOURS) {
    const isLate = elapsed > TIMING_CONSTRAINTS.TEST_24H_ONTIME_HOURS;
    return {
      phase: '24h',
      status: 'open',
      late: isLate,
      hoursUntilOpen: 0,
      msUntilOpen: 0,
      openDate: new Date(openMs),
      closeDate: new Date(closeMs),
    };
  }

  return {
    phase: '24h',
    status: 'closed',
    late: true,
    hoursUntilOpen: 0,
    msUntilOpen: 0,
    openDate: new Date(openMs),
    closeDate: new Date(closeMs),
  };
}

/**
 * Evaluates the 7-day test window status.
 */
export function evaluate7dWindow(
  sessionCompletedAt: string | Date,
  elapsedHours?: number
): WindowEvaluation {
  const completedMs = new Date(sessionCompletedAt).getTime();
  const elapsed = elapsedHours ?? getElapsedHours(sessionCompletedAt);

  const openMs = completedMs + TIMING_CONSTRAINTS.TEST_7D_OPEN_HOURS * 3600000;
  const closeMs = completedMs + TIMING_CONSTRAINTS.TEST_7D_CLOSE_HOURS * 3600000;

  if (elapsed < TIMING_CONSTRAINTS.TEST_7D_OPEN_HOURS) {
    const diffHours = TIMING_CONSTRAINTS.TEST_7D_OPEN_HOURS - elapsed;
    return {
      phase: '7d',
      status: 'early',
      late: false,
      hoursUntilOpen: diffHours,
      msUntilOpen: diffHours * 3600000,
      openDate: new Date(openMs),
      closeDate: new Date(closeMs),
    };
  }

  if (elapsed <= TIMING_CONSTRAINTS.TEST_7D_CLOSE_HOURS) {
    const isLate = elapsed > TIMING_CONSTRAINTS.TEST_7D_ONTIME_HOURS;
    return {
      phase: '7d',
      status: 'open',
      late: isLate,
      hoursUntilOpen: 0,
      msUntilOpen: 0,
      openDate: new Date(openMs),
      closeDate: new Date(closeMs),
    };
  }

  return {
    phase: '7d',
    status: 'closed',
    late: true,
    hoursUntilOpen: 0,
    msUntilOpen: 0,
    openDate: new Date(openMs),
    closeDate: new Date(closeMs),
  };
}

/**
 * Formats a duration in milliseconds into a friendly countdown string.
 */
export function formatFriendlyDuration(ms: number): string {
  if (ms <= 0) return 'Ready now';

  const totalMinutes = Math.floor(ms / (1000 * 60));
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''}, ${hours} hour${hours > 1 ? 's' : ''}`;
  }
  if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''}, ${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }
  return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
}
