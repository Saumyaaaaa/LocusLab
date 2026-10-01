// Authoritative study phase definitions and helper normalization for LocusLab.

export const PHASES = ['immediateTest', '24h', '7d'] as const;

export type Phase = (typeof PHASES)[number];

export const PHASE_LABELS: Record<Phase, string> = {
  immediateTest: 'Immediate',
  '24h': '24 Hours',
  '7d': '7 Days',
};

/**
 * Normalizes any legacy or inconsistent phase string to the canonical Phase union.
 * Maps 'immediate' / 'immediatetest' -> 'immediateTest', 'test24h' -> '24h', 'test7d' -> '7d'.
 */
export function normalizePhase(p: string | null | undefined): Phase | string {
  if (!p) return '';
  const lower = p.trim().toLowerCase();
  if (lower === 'immediate' || lower === 'immediatetest') return 'immediateTest';
  if (lower === '24h' || lower === 'test24h' || lower === '24hours') return '24h';
  if (lower === '7d' || lower === 'test7d' || lower === '7days') return '7d';
  return p;
}
