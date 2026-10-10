import { describeContextRef } from '../context/context-ref';
import { CONTEXT_LABELS } from '../context/types';
import type { FlowRule, RuleEndpoint } from './types';

function isUnscopedClient(endpoint: RuleEndpoint): boolean {
  return endpoint !== '*' && endpoint.type === 'client' && !endpoint.scope;
}

export function describeEndpoint(endpoint: RuleEndpoint): string {
  if (endpoint === '*') return 'Any';
  if (endpoint.type === 'client' && !endpoint.scope) return `${CONTEXT_LABELS.client} (any)`;
  return describeContextRef(endpoint);
}

/** `Finance → Work`, or the rule's own wording for the special cases. */
export function describeRule(rule: FlowRule): string {
  if (rule.sameContext) return 'Same context → Same context';
  if (isUnscopedClient(rule.source) && isUnscopedClient(rule.destination)) {
    return `${CONTEXT_LABELS.client} → Different client`;
  }
  return `${describeEndpoint(rule.source)} → ${describeEndpoint(rule.destination)}`;
}
