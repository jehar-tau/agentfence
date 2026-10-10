import type { ActivityOutcome } from '../activity/types';
import type { ContextRef } from '../context/types';
import type { FlowDecision } from '../policy/types';

export const PASTE_CHECK_MESSAGE_TYPE = 'agentfence:paste-check' as const;

export interface PasteCheckMessage {
  type: typeof PASTE_CHECK_MESSAGE_TYPE;
  text: string;
  href: string;
}

export function isPasteCheckMessage(message: unknown): message is PasteCheckMessage {
  if (!message || typeof message !== 'object') return false;
  const candidate = message as Record<string, unknown>;
  return (
    candidate.type === PASTE_CHECK_MESSAGE_TYPE &&
    typeof candidate.text === 'string' &&
    typeof candidate.href === 'string'
  );
}

/** The background's answer to a paste-check: what to do, and what to show the user if anything. */
export interface PasteCheckResponse {
  decision: FlowDecision;
  reason: string;
  sourceContext: ContextRef;
  destinationContext: ContextRef;
  /** Present only when the paste matched a recent, exact copy from a protected site. */
  sourceDomain?: string;
  confidence: 'exact' | 'unknown';
  /** The rule that produced this decision, if any matched rather than the fallback. */
  ruleId?: string;
}

export const ALWAYS_ALLOW_MESSAGE_TYPE = 'agentfence:always-allow' as const;

export interface AlwaysAllowMessage {
  type: typeof ALWAYS_ALLOW_MESSAGE_TYPE;
  source: ContextRef;
  destination: ContextRef;
}

export function isAlwaysAllowMessage(message: unknown): message is AlwaysAllowMessage {
  if (!message || typeof message !== 'object') return false;
  const candidate = message as Record<string, unknown>;
  return (
    candidate.type === ALWAYS_ALLOW_MESSAGE_TYPE &&
    typeof candidate.source === 'object' &&
    candidate.source !== null &&
    typeof candidate.destination === 'object' &&
    candidate.destination !== null
  );
}

export const RECORD_ACTIVITY_MESSAGE_TYPE = 'agentfence:record-activity' as const;

export interface RecordActivityMessage {
  type: typeof RECORD_ACTIVITY_MESSAGE_TYPE;
  sourceContext: ContextRef;
  destinationContext: ContextRef;
  sourceDomain?: string;
  destinationDomain: string;
  decision: FlowDecision;
  outcome: ActivityOutcome;
  ruleId?: string;
}

export function isRecordActivityMessage(message: unknown): message is RecordActivityMessage {
  if (!message || typeof message !== 'object') return false;
  const candidate = message as Record<string, unknown>;
  return (
    candidate.type === RECORD_ACTIVITY_MESSAGE_TYPE &&
    typeof candidate.sourceContext === 'object' &&
    candidate.sourceContext !== null &&
    typeof candidate.destinationContext === 'object' &&
    candidate.destinationContext !== null &&
    typeof candidate.destinationDomain === 'string' &&
    typeof candidate.decision === 'string' &&
    typeof candidate.outcome === 'string'
  );
}
