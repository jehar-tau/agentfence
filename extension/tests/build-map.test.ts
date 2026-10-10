import { describe, expect, it } from 'vitest';
import { buildMap } from '../core/map/build-map';
import { defaultFlowRules } from '../core/policy/defaults';
import type { DomainContext } from '../core/context/types';

function site(pattern: string, overrides: Partial<DomainContext> = {}): DomainContext {
  return {
    id: pattern,
    pattern,
    context: { type: 'work' },
    enabled: true,
    source: 'user',
    createdAt: 0,
    updatedAt: 0,
    ...overrides,
  };
}

describe('buildMap', () => {
  it('includes one node per enabled site with its protection status', () => {
    const sites = [
      site('bank.demo.test', { context: { type: 'finance' } }),
      site('work-chat.demo.test', { context: { type: 'work' } }),
    ];
    const { nodes } = buildMap(sites, defaultFlowRules(), new Set(['bank.demo.test']));

    expect(nodes).toEqual([
      { hostname: 'bank.demo.test', context: { type: 'finance' }, protected: true },
      { hostname: 'work-chat.demo.test', context: { type: 'work' }, protected: false },
    ]);
  });

  it('excludes disabled sites and sites with no assigned context', () => {
    const sites = [
      site('off.test', { enabled: false }),
      site('unassigned.test', { context: { type: 'unknown' } }),
    ];
    expect(buildMap(sites, defaultFlowRules(), new Set()).nodes).toEqual([]);
  });

  it('creates one edge per ordered pair of distinct contexts, evaluated through the real rules', () => {
    const sites = [
      site('bank.demo.test', { context: { type: 'finance' } }),
      site('work-chat.demo.test', { context: { type: 'work' } }),
    ];
    const { edges } = buildMap(sites, defaultFlowRules(), new Set());

    expect(edges).toHaveLength(2);
    const financeToWork = edges.find(
      (e) => e.source.type === 'finance' && e.destination.type === 'work',
    )!;
    expect(financeToWork).toMatchObject({
      decision: 'ask',
      rule: { id: 'default-finance-to-work' },
    });
    expect(financeToWork.sourceSite.hostname).toBe('bank.demo.test');
    expect(financeToWork.destinationSite.hostname).toBe('work-chat.demo.test');

    const workToFinance = edges.find(
      (e) => e.source.type === 'work' && e.destination.type === 'finance',
    )!;
    expect(workToFinance.decision).toBe('ask'); // no default rule either way -> fallback
    expect(workToFinance.rule).toBeUndefined();
  });

  it('creates exactly one same-context edge for two or more sites sharing a context', () => {
    const sites = [
      site('chat.demo.test', { context: { type: 'work' } }),
      site('docs.demo.test', { context: { type: 'work' } }),
      site('wiki.demo.test', { context: { type: 'work' } }),
    ];
    const { edges } = buildMap(sites, defaultFlowRules(), new Set());

    expect(edges).toHaveLength(1);
    expect(edges[0]).toMatchObject({
      decision: 'allow',
      source: { type: 'work' },
      destination: { type: 'work' },
    });
  });

  it('does not create a same-context edge for a single site in that context', () => {
    const sites = [site('chat.demo.test', { context: { type: 'work' } })];
    expect(buildMap(sites, defaultFlowRules(), new Set()).edges).toEqual([]);
  });

  it('treats different client scopes as different contexts', () => {
    const sites = [
      site('client-a.demo.test', { context: { type: 'client', scope: 'acme' } }),
      site('client-b.demo.test', { context: { type: 'client', scope: 'globex' } }),
    ];
    const { edges } = buildMap(sites, defaultFlowRules(), new Set());

    expect(edges).toHaveLength(2);
    expect(edges.every((e) => e.decision === 'block')).toBe(true);
  });

  it('blocks client A to client B using the demo playground data, matching the spec demo', () => {
    const sites = [
      site('bank.localhost', { context: { type: 'finance' } }),
      site('work-chat.localhost', { context: { type: 'work' } }),
      site('client-a.localhost', { context: { type: 'client', scope: 'acme' } }),
      site('client-b.localhost', { context: { type: 'client', scope: 'globex' } }),
      site('public-form.localhost', { context: { type: 'public' } }),
    ];
    const { edges } = buildMap(sites, defaultFlowRules(), new Set());

    function decisionOf(sourceType: string, destType: string) {
      return edges.find((e) => e.source.type === sourceType && e.destination.type === destType)
        ?.decision;
    }
    expect(decisionOf('finance', 'work')).toBe('ask');
    expect(decisionOf('finance', 'public')).toBe('block');
    expect(decisionOf('client', 'client')).toBe('block');
  });
});
