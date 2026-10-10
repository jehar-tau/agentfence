import { describe, expect, it } from 'vitest';
import type { ContextRef } from '../core/context/types';
import { defaultFlowRules } from '../core/policy/defaults';
import { evaluateFlow, tierOf } from '../core/policy/evaluate';
import type { FlowDecision, FlowRule, RuleEndpoint } from '../core/policy/types';

const work: ContextRef = { type: 'work' };
const personal: ContextRef = { type: 'personal' };
const finance: ContextRef = { type: 'finance' };
const health: ContextRef = { type: 'health' };
const pub: ContextRef = { type: 'public' };
const unknown: ContextRef = { type: 'unknown' };
const acme: ContextRef = { type: 'client', scope: 'acme' };
const globex: ContextRef = { type: 'client', scope: 'globex' };

let nextId = 0;
function rule(
  source: RuleEndpoint,
  destination: RuleEndpoint,
  decision: FlowDecision,
  extra: Partial<FlowRule> = {},
): FlowRule {
  return {
    id: `r${nextId++}`,
    source,
    destination,
    decision,
    priority: 0,
    enabled: true,
    createdBy: 'user',
    ...extra,
  };
}

describe('evaluateFlow with the default rules', () => {
  const rules = defaultFlowRules();

  it.each<[string, ContextRef, ContextRef, FlowDecision, string]>([
    ['finance → work', finance, work, 'ask', 'context'],
    ['finance → public', finance, pub, 'block', 'context'],
    ['health → public', health, pub, 'block', 'context'],
    ['health → work', health, work, 'ask', 'context'],
    ['personal → work', personal, work, 'ask', 'context'],
    ['work → personal', work, personal, 'ask', 'context'],
    ['work → work', work, work, 'allow', 'same-context'],
    ['finance → finance', finance, finance, 'allow', 'same-context'],
    ['client A → client B', acme, globex, 'block', 'context'],
    ['client B → client A', globex, acme, 'block', 'context'],
    ['client A → client A', acme, acme, 'allow', 'same-context'],
    ['client A → public', acme, pub, 'ask', 'context'],
    ['unknown → work', unknown, work, 'ask', 'wildcard'],
    ['work → unknown', work, unknown, 'ask', 'wildcard'],
    ['unknown → unknown', unknown, unknown, 'ask', 'wildcard'],
    ['work → finance (no rule)', work, finance, 'ask', 'fallback'],
    ['work → public (no rule)', work, pub, 'ask', 'fallback'],
  ])('%s', (_name, source, destination, decision, tier) => {
    const result = evaluateFlow(source, destination, rules);
    expect(result.decision).toBe(decision);
    expect(result.tier).toBe(tier);
    expect(result.reason).toBeTruthy();
    expect(result.matchedRule === undefined).toBe(tier === 'fallback');
  });

  it('explains the decision in plain language', () => {
    expect(evaluateFlow(finance, work, rules).reason).toBe(
      'Finance → Work: matched the exact context rule “Finance → Work”: Ask.',
    );
    expect(evaluateFlow(work, finance, rules).reason).toBe(
      'Work → Finance: no rule matched, so the fallback applies: Ask.',
    );
  });
});

describe('rule priority', () => {
  it('classifies rules into tiers', () => {
    expect(tierOf(rule(acme, globex, 'allow'))).toBe('scoped');
    expect(tierOf(rule(acme, pub, 'allow'))).toBe('scoped');
    expect(tierOf(rule(finance, work, 'allow'))).toBe('context');
    expect(tierOf(rule({ type: 'client' }, pub, 'allow'))).toBe('context');
    expect(tierOf(rule('*', work, 'allow'))).toBe('wildcard');
    expect(tierOf(rule(acme, '*', 'allow'))).toBe('wildcard');
    expect(tierOf(rule('*', '*', 'allow', { sameContext: true }))).toBe('same-context');
  });

  it('1. an exact scoped rule beats an exact context rule', () => {
    const rules = [...defaultFlowRules(), rule(acme, globex, 'allow')];
    expect(evaluateFlow(acme, globex, rules)).toMatchObject({ decision: 'allow', tier: 'scoped' });
    // Only that direction and those scopes are affected.
    expect(evaluateFlow(globex, acme, rules).decision).toBe('block');
    expect(evaluateFlow(acme, { type: 'client', scope: 'initech' }, rules).decision).toBe('block');
  });

  it('2. an exact context rule beats the same-context rule', () => {
    const rules = [...defaultFlowRules(), rule(work, work, 'block')];
    expect(evaluateFlow(work, work, rules)).toMatchObject({ decision: 'block', tier: 'context' });
    expect(evaluateFlow(finance, finance, rules).decision).toBe('allow');
  });

  it('3. the same-context rule beats wildcard rules', () => {
    const rules = [...defaultFlowRules(), rule('*', work, 'block')];
    expect(evaluateFlow(work, work, rules)).toMatchObject({
      decision: 'allow',
      tier: 'same-context',
    });
    expect(evaluateFlow(pub, work, rules)).toMatchObject({ decision: 'block', tier: 'wildcard' });
  });

  it('4. a wildcard rule beats the fallback', () => {
    expect(evaluateFlow(work, pub, [rule('*', pub, 'allow')])).toMatchObject({
      decision: 'allow',
      tier: 'wildcard',
    });
  });

  it('5. falls back to ask with no rules at all', () => {
    expect(evaluateFlow(work, work, [])).toMatchObject({ decision: 'ask', tier: 'fallback' });
  });

  it('prefers the more specific rule within a tier', () => {
    const rules = [rule('*', '*', 'allow'), rule(finance, '*', 'block')];
    expect(evaluateFlow(finance, work, rules).decision).toBe('block');
    expect(evaluateFlow(work, finance, rules).decision).toBe('allow');
  });

  it('then prefers higher priority', () => {
    const rules = [rule(finance, work, 'block'), rule(finance, work, 'allow', { priority: 5 })];
    expect(evaluateFlow(finance, work, rules).decision).toBe('allow');
  });

  it('then prefers user rules over defaults', () => {
    const rules = [
      rule(finance, work, 'block', { createdBy: 'default' }),
      rule(finance, work, 'allow', { createdBy: 'user' }),
    ];
    expect(evaluateFlow(finance, work, rules).decision).toBe('allow');
  });

  it('then prefers the more restrictive decision', () => {
    const rules = [rule(finance, work, 'allow'), rule(finance, work, 'block')];
    expect(evaluateFlow(finance, work, rules).decision).toBe('block');
  });

  it('is deterministic regardless of rule order', () => {
    const rules = [...defaultFlowRules(), rule(acme, globex, 'allow'), rule('*', pub, 'allow')];
    const reversed = [...rules].reverse();
    for (const source of [work, finance, acme, globex, unknown, pub]) {
      for (const destination of [work, finance, acme, globex, unknown, pub]) {
        expect(evaluateFlow(source, destination, reversed)).toEqual(
          evaluateFlow(source, destination, rules),
        );
      }
    }
  });

  it('ignores disabled rules', () => {
    const rules = defaultFlowRules().map((r) =>
      r.id === 'default-finance-to-public' ? { ...r, enabled: false } : r,
    );
    expect(evaluateFlow(finance, pub, rules)).toMatchObject({ decision: 'ask', tier: 'fallback' });
  });

  it('does not mutate the rules it is given', () => {
    const rules = Object.freeze(defaultFlowRules().map((r) => Object.freeze(r)));
    expect(() => evaluateFlow(finance, work, rules)).not.toThrow();
  });
});
