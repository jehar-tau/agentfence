import type { ActivityEntry } from './types';

/** `Blocked`, `Allowed`, or the spec's `Asked · user <choice>` form for an ask that was resolved. */
export function describeOutcome(entry: Pick<ActivityEntry, 'decision' | 'outcome'>): string {
  if (entry.decision === 'allow') return 'Allowed';
  if (entry.decision === 'block') return 'Blocked';
  switch (entry.outcome) {
    case 'blocked':
      return 'Asked · user blocked';
    case 'allowed-once':
      return 'Asked · user allowed once';
    case 'always-allowed':
      return 'Asked · user chose always allow';
    default:
      return 'Asked';
  }
}
