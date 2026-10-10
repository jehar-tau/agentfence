import { contextRefEquals, describeContextRef } from '../context/context-ref';
import type { ContextRef } from '../context/types';
import { describeRule } from './describe';
import {
  DECISION_LABELS,
  FALLBACK_DECISION,
  type FlowDecision,
  type FlowRule,
  type RuleEndpoint,
} from './types';

/** Rule tiers in the order they are tried. */
export const RULE_TIERS = ['scoped', 'context', 'same-context', 'wildcard'] as const;
export type RuleTier = (typeof RULE_TIERS)[number] | 'fallback';

export interface FlowEvaluation {
  decision: FlowDecision;
  matchedRule?: FlowRule;
  tier: RuleTier;
  reason: string;
}

const TIER_LABELS: Record<RuleTier, string> = {
  scoped: 'exact scoped rule',
  context: 'exact context rule',
  'same-context': 'same-context rule',
  wildcard: 'wildcard rule',
  fallback: 'fallback',
};

const RESTRICTIVENESS: Record<FlowDecision, number> = { allow: 0, ask: 1, block: 2 };

function isUnscopedClient(endpoint: RuleEndpoint): boolean {
  return endpoint !== '*' && endpoint.type === 'client' && !endpoint.scope;
}

function endpointMatches(endpoint: RuleEndpoint, context: ContextRef): boolean {
  if (endpoint === '*') return true;
  if (endpoint.type !== context.type) return false;
  return !endpoint.scope || endpoint.scope === context.scope;
}

/** Two unassigned sites are not known to share a context, so `unknown` is never "the same". */
export function isSameContext(source: ContextRef, destination: ContextRef): boolean {
  return source.type !== 'unknown' && contextRefEquals(source, destination);
}

export function ruleMatches(rule: FlowRule, source: ContextRef, destination: ContextRef): boolean {
  if (rule.sameContext) return isSameContext(source, destination);
  if (!endpointMatches(rule.source, source) || !endpointMatches(rule.destination, destination)) {
    return false;
  }
  // `client → client` without scopes means "one client to a different client".
  if (isUnscopedClient(rule.source) && isUnscopedClient(rule.destination)) {
    return !contextRefEquals(source, destination);
  }
  return true;
}

export function tierOf(rule: FlowRule): Exclude<RuleTier, 'fallback'> {
  if (rule.sameContext) return 'same-context';
  if (rule.source === '*' || rule.destination === '*') return 'wildcard';
  if (rule.source.scope || rule.destination.scope) return 'scoped';
  return 'context';
}

function specificity(endpoint: RuleEndpoint): number {
  if (endpoint === '*') return 0;
  return endpoint.scope ? 2 : 1;
}

/** Orders matching rules so that the first one is the rule that decides. Fully deterministic. */
function compareRules(a: FlowRule, b: FlowRule): number {
  return (
    RULE_TIERS.indexOf(tierOf(a)) - RULE_TIERS.indexOf(tierOf(b)) ||
    specificity(b.source) +
      specificity(b.destination) -
      (specificity(a.source) + specificity(a.destination)) ||
    b.priority - a.priority ||
    Number(b.createdBy === 'user') - Number(a.createdBy === 'user') ||
    RESTRICTIVENESS[b.decision] - RESTRICTIVENESS[a.decision] ||
    (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)
  );
}

/**
 * Decides whether information may flow from one context to another.
 *
 * Tiers, first match wins: exact scoped rule → exact context rule → same-context rule →
 * wildcard rule → fallback (ask). Within a tier: more specific endpoints, then higher
 * priority, then user rules over defaults, then the more restrictive decision, then id.
 */
export function evaluateFlow(
  source: ContextRef,
  destination: ContextRef,
  rules: readonly FlowRule[],
): FlowEvaluation {
  const flow = `${describeContextRef(source)} → ${describeContextRef(destination)}`;
  const [matchedRule] = rules
    .filter((rule) => rule.enabled && ruleMatches(rule, source, destination))
    .sort(compareRules);

  if (!matchedRule) {
    return {
      decision: FALLBACK_DECISION,
      tier: 'fallback',
      reason: `${flow}: no rule matched, so the fallback applies: ${DECISION_LABELS[FALLBACK_DECISION]}.`,
    };
  }
  const tier = tierOf(matchedRule);
  return {
    decision: matchedRule.decision,
    matchedRule,
    tier,
    reason: `${flow}: matched the ${TIER_LABELS[tier]} “${describeRule(matchedRule)}”: ${DECISION_LABELS[matchedRule.decision]}.`,
  };
}
