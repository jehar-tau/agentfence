import { describe, expect, it } from 'vitest';
import { assignSiteContext, getSiteContext, removeSiteContext } from '../core/context/repository';
import { CURRENT_SCHEMA_VERSION, STORAGE_KEY, type StoredState } from '../core/storage/schema';
import { createMemoryArea } from './memory-area';

function stored(area: ReturnType<typeof createMemoryArea>): StoredState {
  return area.data[STORAGE_KEY] as StoredState;
}

describe('site context assignment', () => {
  it('reports unknown for a site with no assignment', async () => {
    expect(await getSiteContext(createMemoryArea(), 'bank.example.com')).toEqual({
      type: 'unknown',
    });
  });

  it('persists an assignment and resolves it again', async () => {
    const area = createMemoryArea();
    const entry = await assignSiteContext(area, 'Bank.Example.com', { type: 'finance' }, 1000);

    expect(entry).toMatchObject({
      pattern: 'bank.example.com',
      context: { type: 'finance' },
      enabled: true,
      source: 'user',
      createdAt: 1000,
      updatedAt: 1000,
    });
    expect(stored(area).schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    expect(stored(area).domainContexts).toEqual([entry]);
    expect(await getSiteContext(area, 'bank.example.com')).toEqual({ type: 'finance' });
  });

  it('keeps scoped clients separate', async () => {
    const area = createMemoryArea();
    await assignSiteContext(area, 'acme.example.com', { type: 'client', scope: 'ACME' });
    await assignSiteContext(area, 'globex.example.com', { type: 'client', scope: 'globex' });

    expect(await getSiteContext(area, 'acme.example.com')).toEqual({
      type: 'client',
      scope: 'acme',
    });
    expect(await getSiteContext(area, 'globex.example.com')).toEqual({
      type: 'client',
      scope: 'globex',
    });
  });

  it('updates an existing assignment in place', async () => {
    const area = createMemoryArea();
    const first = await assignSiteContext(area, 'chat.example.com', { type: 'personal' }, 1000);
    const second = await assignSiteContext(area, 'chat.example.com', { type: 'work' }, 2000);

    expect(second.id).toBe(first.id);
    expect(second.createdAt).toBe(1000);
    expect(second.updatedAt).toBe(2000);
    expect(stored(area).domainContexts).toHaveLength(1);
    expect(await getSiteContext(area, 'chat.example.com')).toEqual({ type: 'work' });
  });

  it('rejects invalid assignments without writing them', async () => {
    const area = createMemoryArea();
    await expect(assignSiteContext(area, 'x.test', { type: 'unknown' })).rejects.toThrow();
    await expect(assignSiteContext(area, 'x.test', { type: 'client' })).rejects.toThrow();
    await expect(assignSiteContext(area, '  ', { type: 'work' })).rejects.toThrow();
    expect(area.data[STORAGE_KEY]).toBeUndefined();
  });

  it('removes only the named site', async () => {
    const area = createMemoryArea();
    await assignSiteContext(area, 'bank.example.com', { type: 'finance' });
    await assignSiteContext(area, 'chat.example.com', { type: 'work' });
    await removeSiteContext(area, 'bank.example.com');

    expect(await getSiteContext(area, 'bank.example.com')).toEqual({ type: 'unknown' });
    expect(await getSiteContext(area, 'chat.example.com')).toEqual({ type: 'work' });
  });
});
