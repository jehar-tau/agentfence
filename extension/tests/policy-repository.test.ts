import { describe, expect, it } from 'vitest';
import { defaultFlowRules } from '../core/policy/defaults';
import { evaluateFlow } from '../core/policy/evaluate';
import {
  RuleError,
  deleteRule,
  listRules,
  resetRules,
  setRuleDecision,
  setRuleEnabled,
  upsertRule,
} from '../core/policy/repository';
import { CURRENT_SCHEMA_VERSION, STORAGE_KEY } from '../core/storage/schema';
import { createMemoryArea } from './memory-area';

describe('rule storage', () => {
  it('seeds a fresh install with the default rules', async () => {
    expect(await listRules(createMemoryArea())).toEqual(defaultFlowRules());
  });

  it('adds the default rules when upgrading from schema version 1', async () => {
    const site = {
      id: '1',
      pattern: 'bank.example.com',
      context: { type: 'finance' },
      enabled: true,
      source: 'user',
      createdAt: 1,
      updatedAt: 1,
    };
    const area = createMemoryArea({ [STORAGE_KEY]: { schemaVersion: 1, domainContexts: [site] } });

    expect(await listRules(area)).toEqual(defaultFlowRules());
    expect(area.data[STORAGE_KEY]).toMatchObject({
      schemaVersion: CURRENT_SCHEMA_VERSION,
      domainContexts: [site],
    });
  });

  it('changes a default rule in place and persists it', async () => {
    const area = createMemoryArea();
    await setRuleDecision(area, 'default-finance-to-work', 'allow');

    const rules = await listRules(area);
    expect(rules).toHaveLength(defaultFlowRules().length);
    expect(evaluateFlow({ type: 'finance' }, { type: 'work' }, rules).decision).toBe('allow');
  });

  it('upserting an existing pair updates that rule instead of adding a duplicate', async () => {
    const area = createMemoryArea();
    await setRuleEnabled(area, 'default-finance-to-work', false);
    const rules = await upsertRule(area, {
      source: { type: 'finance' },
      destination: { type: 'work' },
      decision: 'allow',
    });

    expect(rules).toHaveLength(defaultFlowRules().length);
    expect(rules.find((r) => r.id === 'default-finance-to-work')).toMatchObject({
      decision: 'allow',
      enabled: true,
      createdBy: 'default',
    });
  });

  it('creates a user rule for a new pair, normalizing client names', async () => {
    const area = createMemoryArea();
    const rules = await upsertRule(area, {
      source: { type: 'client', scope: ' ACME ' },
      destination: { type: 'client', scope: 'Globex' },
      decision: 'allow',
    });

    expect(rules.at(-1)).toMatchObject({
      source: { type: 'client', scope: 'acme' },
      destination: { type: 'client', scope: 'globex' },
      decision: 'allow',
      createdBy: 'user',
      enabled: true,
    });
    const acme = { type: 'client', scope: 'acme' } as const;
    const globex = { type: 'client', scope: 'globex' } as const;
    expect(evaluateFlow(acme, globex, rules).decision).toBe('allow');
    expect(evaluateFlow(globex, acme, rules).decision).toBe('block');
  });

  it('treats a blank client name as "any client"', async () => {
    const rules = await upsertRule(createMemoryArea(), {
      source: { type: 'client', scope: '  ' },
      destination: { type: 'work' },
      decision: 'block',
    });
    expect(rules.at(-1)).toMatchObject({ source: { type: 'client' } });
  });

  it('rejects invalid input without writing', async () => {
    const area = createMemoryArea();
    await expect(
      upsertRule(area, {
        source: { type: 'client', scope: '!!!' },
        destination: '*',
        decision: 'ask',
      }),
    ).rejects.toThrow(RuleError);
    await expect(
      upsertRule(area, { source: '*', destination: '*', decision: 'maybe' as never }),
    ).rejects.toThrow(RuleError);
    await expect(setRuleDecision(area, 'missing', 'allow')).rejects.toThrow(RuleError);
    expect(await listRules(area)).toEqual(defaultFlowRules());
  });

  it('disables and re-enables a rule', async () => {
    const area = createMemoryArea();
    await setRuleEnabled(area, 'default-finance-to-public', false);
    expect(evaluateFlow({ type: 'finance' }, { type: 'public' }, await listRules(area)).tier).toBe(
      'fallback',
    );
    await setRuleEnabled(area, 'default-finance-to-public', true);
    expect(
      evaluateFlow({ type: 'finance' }, { type: 'public' }, await listRules(area)).decision,
    ).toBe('block');
  });

  it('deletes user rules but not default rules', async () => {
    const area = createMemoryArea();
    const added = await upsertRule(area, {
      source: { type: 'work' },
      destination: { type: 'public' },
      decision: 'block',
    });
    const userRule = added.at(-1)!;

    await expect(deleteRule(area, 'default-finance-to-work')).rejects.toThrow(RuleError);
    expect(await deleteRule(area, userRule.id)).toEqual(defaultFlowRules());
  });

  it('resets to defaults without touching site assignments', async () => {
    const area = createMemoryArea();
    await setRuleDecision(area, 'default-finance-to-public', 'allow');
    await upsertRule(area, { source: '*', destination: '*', decision: 'allow' });
    const before = structuredClone(area.data[STORAGE_KEY]) as { domainContexts: unknown };

    expect(await resetRules(area)).toEqual(defaultFlowRules());
    expect(area.data[STORAGE_KEY]).toMatchObject({ domainContexts: before.domainContexts });
  });
});
