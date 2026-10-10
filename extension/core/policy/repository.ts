import { normalizeScope } from '../context/context-ref';
import { CONTEXT_TYPES } from '../context/types';
import { loadState, saveState, type KeyValueArea } from '../storage/state-store';
import { defaultFlowRules } from './defaults';
import { FLOW_DECISIONS, type FlowDecision, type FlowRule, type RuleEndpoint } from './types';

export class RuleError extends Error {}

function normalizeEndpoint(endpoint: RuleEndpoint): RuleEndpoint {
  if (endpoint === '*') return '*';
  if (!CONTEXT_TYPES.includes(endpoint.type)) throw new RuleError('Unknown context type.');
  if (endpoint.type !== 'client' || endpoint.scope === undefined || endpoint.scope.trim() === '') {
    return { type: endpoint.type };
  }
  const scope = normalizeScope(endpoint.scope);
  if (!scope) throw new RuleError('That client name has no usable letters or numbers.');
  return { type: 'client', scope };
}

function endpointKey(endpoint: RuleEndpoint): string {
  if (endpoint === '*') return '*';
  return endpoint.scope ? `${endpoint.type}/${endpoint.scope}` : endpoint.type;
}

function assertDecision(decision: FlowDecision): void {
  if (!FLOW_DECISIONS.includes(decision)) throw new RuleError('Unknown decision.');
}

async function update(
  area: KeyValueArea,
  change: (rules: FlowRule[]) => FlowRule[],
): Promise<FlowRule[]> {
  const state = await loadState(area);
  const flowRules = change(state.flowRules);
  await saveState(area, { ...state, flowRules });
  return flowRules;
}

function requireRule(rules: FlowRule[], id: string): FlowRule {
  const rule = rules.find((candidate) => candidate.id === id);
  if (!rule) throw new RuleError('That rule no longer exists.');
  return rule;
}

export async function listRules(area: KeyValueArea): Promise<FlowRule[]> {
  return (await loadState(area)).flowRules;
}

/**
 * Sets the decision for a source → destination pair. If a rule for that exact pair already
 * exists (default or user) it is updated and re-enabled; otherwise a user rule is created.
 */
export async function upsertRule(
  area: KeyValueArea,
  input: { source: RuleEndpoint; destination: RuleEndpoint; decision: FlowDecision },
): Promise<FlowRule[]> {
  assertDecision(input.decision);
  const source = normalizeEndpoint(input.source);
  const destination = normalizeEndpoint(input.destination);
  return update(area, (rules) => {
    const existing = rules.find(
      (rule) =>
        !rule.sameContext &&
        endpointKey(rule.source) === endpointKey(source) &&
        endpointKey(rule.destination) === endpointKey(destination),
    );
    if (existing) {
      return rules.map((rule) =>
        rule === existing ? { ...rule, decision: input.decision, enabled: true } : rule,
      );
    }
    return [
      ...rules,
      {
        id: crypto.randomUUID(),
        source,
        destination,
        decision: input.decision,
        priority: 0,
        enabled: true,
        createdBy: 'user',
      },
    ];
  });
}

export async function setRuleDecision(
  area: KeyValueArea,
  id: string,
  decision: FlowDecision,
): Promise<FlowRule[]> {
  assertDecision(decision);
  return update(area, (rules) => {
    const target = requireRule(rules, id);
    return rules.map((rule) => (rule === target ? { ...rule, decision } : rule));
  });
}

export async function setRuleEnabled(
  area: KeyValueArea,
  id: string,
  enabled: boolean,
): Promise<FlowRule[]> {
  return update(area, (rules) => {
    const target = requireRule(rules, id);
    return rules.map((rule) => (rule === target ? { ...rule, enabled } : rule));
  });
}

/** Deletes a user rule. Default rules can be disabled or changed, but not deleted. */
export async function deleteRule(area: KeyValueArea, id: string): Promise<FlowRule[]> {
  return update(area, (rules) => {
    const target = requireRule(rules, id);
    if (target.createdBy === 'default') {
      throw new RuleError('Default rules can be turned off, but not deleted.');
    }
    return rules.filter((rule) => rule !== target);
  });
}

/** Discards every rule change and user rule, restoring the defaults. */
export async function resetRules(area: KeyValueArea): Promise<FlowRule[]> {
  return update(area, () => defaultFlowRules());
}
