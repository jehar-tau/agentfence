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
