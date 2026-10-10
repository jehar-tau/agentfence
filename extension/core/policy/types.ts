import type { ContextRef } from '../context/types';

export const FLOW_DECISIONS = ['allow', 'ask', 'block'] as const;
export type FlowDecision = (typeof FLOW_DECISIONS)[number];

/** A context, a whole context type (`{ type: 'client' }` = any client), or `*` for anything. */
export type RuleEndpoint = ContextRef | '*';

export interface FlowRule {
  id: string;
  source: RuleEndpoint;
  destination: RuleEndpoint;
  decision: FlowDecision;
  /** Tie-breaker between rules in the same tier. Higher wins. */
  priority: number;
  enabled: boolean;
  createdBy: 'default' | 'user';
  description?: string;
  /**
   * Marks the same-context rule: it matches when source and destination are the same known
   * context, and ignores `source` / `destination`.
   */
  sameContext?: boolean;
}

export const DECISION_LABELS: Record<FlowDecision, string> = {
  allow: 'Allow',
  ask: 'Ask',
  block: 'Block',
};

/** Decision used when no enabled rule matches. */
export const FALLBACK_DECISION: FlowDecision = 'ask';
