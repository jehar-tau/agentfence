import { describe, expect, it } from 'vitest';
import { buildMap } from '../core/map/build-map';
import { COLUMN_WIDTH, layoutEdges, layoutMap } from '../core/map/layout';
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

describe('layoutMap', () => {
  it('gives each distinct context its own column, in context-type order', () => {
    const sites = [
      site('public.test', { context: { type: 'public' } }),
      site('bank.test', { context: { type: 'finance' } }),
      site('chat.test', { context: { type: 'work' } }),
    ];
    const { columns } = layoutMap(buildMap(sites, defaultFlowRules(), new Set()));
    expect(columns.map((c) => c.key)).toEqual(['work', 'finance', 'public']);
  });

  it('gives different client scopes separate columns, ordered alphabetically', () => {
    const sites = [
      site('b.test', { context: { type: 'client', scope: 'globex' } }),
      site('a.test', { context: { type: 'client', scope: 'acme' } }),
    ];
    const { columns } = layoutMap(buildMap(sites, defaultFlowRules(), new Set()));
    expect(columns.map((c) => c.key)).toEqual(['client/acme', 'client/globex']);
  });

  it('stacks nodes within a column without overlapping', () => {
    const sites = [site('a.test'), site('b.test'), site('c.test')];
    const { columns } = layoutMap(buildMap(sites, defaultFlowRules(), new Set()));
    const ys = columns[0]!.nodes.map((n) => n.y);
    expect(new Set(ys).size).toBe(3);
    expect(ys).toEqual([...ys].sort((a, b) => a - b));
  });

  it('is deterministic: the same input always produces the same layout', () => {
    const sites = [site('a.test', { context: { type: 'finance' } }), site('b.test')];
    const map = buildMap(sites, defaultFlowRules(), new Set());
    expect(layoutMap(map)).toEqual(layoutMap(map));
  });

  it('sizes the canvas to fit every column and the tallest column', () => {
    const sites = [site('a.test'), site('b.test', { context: { type: 'finance' } })];
    const { width, height } = layoutMap(buildMap(sites, defaultFlowRules(), new Set()));
    expect(width).toBeGreaterThan(COLUMN_WIDTH * 2);
    expect(height).toBeGreaterThan(0);
  });

  it('never produces a negative or zero canvas size, even with no sites', () => {
    const { width, height } = layoutMap(buildMap([], defaultFlowRules(), new Set()));
    expect(width).toBeGreaterThan(0);
    expect(height).toBeGreaterThan(0);
  });
});

describe('layoutEdges', () => {
  it('draws a line between two different columns', () => {
    const sites = [
      site('bank.test', { context: { type: 'finance' } }),
      site('chat.test', { context: { type: 'work' } }),
    ];
    const map = buildMap(sites, defaultFlowRules(), new Set());
    const geometry = layoutEdges(layoutMap(map), map.edges);

    expect(geometry).toHaveLength(map.edges.length);
    for (const g of geometry) {
      expect(g.kind).toBe('line');
      expect(g.sourcePoint.x).not.toBe(g.destinationPoint.x);
    }
  });

  it('draws a loop for a same-context edge, bowing out beside the column', () => {
    const sites = [site('a.test'), site('b.test')];
    const map = buildMap(sites, defaultFlowRules(), new Set());
    const [geometry] = layoutEdges(layoutMap(map), map.edges);

    expect(geometry!.kind).toBe('loop');
    expect(geometry!.sourcePoint.x).toBe(geometry!.destinationPoint.x);
    expect(geometry!.bow).toBeGreaterThan(0);
  });

  it('skips an edge whose site is missing from the layout rather than throwing', () => {
    const sites = [site('a.test', { context: { type: 'finance' } }), site('b.test')];
    const map = buildMap(sites, defaultFlowRules(), new Set());
    const layout = layoutMap(buildMap([sites[0]!], defaultFlowRules(), new Set()));
    expect(() => layoutEdges(layout, map.edges)).not.toThrow();
    expect(layoutEdges(layout, map.edges)).toEqual([]);
  });
});
