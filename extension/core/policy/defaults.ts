import type { ContextType } from '../context/types';
import type { FlowDecision, FlowRule, RuleEndpoint } from './types';

function endpoint(value: ContextType | '*'): RuleEndpoint {
  return value === '*' ? '*' : { type: value };
}

function rule(
  source: ContextType | '*',
  destination: ContextType | '*',
  decision: FlowDecision,
  description?: string,
): FlowRule {
  return {
    id: `default-${source === '*' ? 'any' : source}-to-${destination === '*' ? 'any' : destination}`,
    source: endpoint(source),
    destination: endpoint(destination),
    decision,
    priority: 0,
    enabled: true,
    createdBy: 'default',
    ...(description ? { description } : {}),
  };
}

export const SAME_CONTEXT_RULE_ID = 'default-same-context';

/** The rules every install starts with. Returns fresh objects so callers can edit them. */
export function defaultFlowRules(): FlowRule[] {
  return [
    {
      id: SAME_CONTEXT_RULE_ID,
      source: '*',
      destination: '*',
      decision: 'allow',
      priority: 0,
      enabled: true,
      createdBy: 'default',
      description: 'Within the same context',
      sameContext: true,
    },
    rule('finance', 'public', 'block'),
    rule('health', 'public', 'block'),
    rule('finance', 'work', 'ask'),
    rule('health', 'work', 'ask'),
    rule('personal', 'work', 'ask'),
    rule('work', 'personal', 'ask'),
    rule('client', 'client', 'block'),
    rule('client', 'public', 'ask'),
    rule('unknown', '*', 'ask', 'From an unassigned site'),
    rule('*', 'unknown', 'ask', 'To an unassigned site'),
  ];
}
