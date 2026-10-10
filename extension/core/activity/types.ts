import type { ContextRef } from '../context/types';
import type { FlowDecision } from '../policy/types';

/** What actually happened, as opposed to `decision` (what the rule said). */
export type ActivityOutcome = 'allowed' | 'blocked' | 'allowed-once' | 'always-allowed';

/**
 * One completed paste decision. Metadata only — never the pasted text, matching the
 * provenance store's privacy posture (AGENTS.md #5, #6).
 */
export interface ActivityEntry {
  id: string;
  timestamp: number;
  sourceContext: ContextRef;
  destinationContext: ContextRef;
  /** Present only when the paste matched a recorded copy; honestly absent otherwise. */
  sourceDomain?: string;
  destinationDomain: string;
  decision: FlowDecision;
  outcome: ActivityOutcome;
  ruleId?: string;
}
