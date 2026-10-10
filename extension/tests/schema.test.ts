import { describe, expect, it } from 'vitest';
import { defaultFlowRules } from '../core/policy/defaults';
import {
  CURRENT_SCHEMA_VERSION,
  STORAGE_KEY,
  SchemaError,
  migrate,
  type Migration,
} from '../core/storage/schema';
import { loadState } from '../core/storage/state-store';
import { createMemoryArea } from './memory-area';

describe('migrate', () => {
  it('creates the initial state when nothing is stored', () => {
    expect(migrate(undefined)).toEqual({
      schemaVersion: CURRENT_SCHEMA_VERSION,
      domainContexts: [],
      flowRules: defaultFlowRules(),
    });
  });

  it('leaves current-version data untouched', () => {
    const stored = {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      domainContexts: [
        {
          id: '1',
          pattern: 'bank.example.com',
          context: { type: 'finance' },
          enabled: true,
          source: 'user',
          createdAt: 1,
          updatedAt: 1,
        },
      ],
      flowRules: [],
    };
    expect(migrate(stored)).toEqual(stored);
  });

  it('runs only the migrations newer than the stored version, in order', () => {
    const migrations: Migration[] = [
      (state) => ({ ...state, steps: ['0→1'] }),
      (state) => ({ ...state, steps: [...(state.steps as string[]), '1→2'] }),
      (state) => ({ ...state, steps: [...(state.steps as string[]), '2→3'] }),
    ];
    expect(migrate(undefined, migrations)).toEqual({
      schemaVersion: 3,
      steps: ['0→1', '1→2', '2→3'],
    });
    expect(migrate({ schemaVersion: 1, steps: ['kept'] }, migrations)).toEqual({
      schemaVersion: 3,
      steps: ['kept', '1→2', '2→3'],
    });
  });

  it('does not mutate its input', () => {
    const stored = Object.freeze({ schemaVersion: 0 });
    expect(() => migrate(stored)).not.toThrow();
  });

  it('refuses data from a newer schema instead of downgrading it', () => {
    expect(() => migrate({ schemaVersion: CURRENT_SCHEMA_VERSION + 1 })).toThrow(SchemaError);
  });

  it('rejects malformed data', () => {
    expect(() => migrate('nope')).toThrow(SchemaError);
    expect(() => migrate([])).toThrow(SchemaError);
    expect(() => migrate({ schemaVersion: '1' })).toThrow(SchemaError);
    expect(() => migrate({ schemaVersion: -1 })).toThrow(SchemaError);
  });
});

describe('loadState', () => {
  it('initializes empty storage and persists the migrated state', async () => {
    const area = createMemoryArea();
    const state = await loadState(area);
    expect(state).toEqual({
      schemaVersion: CURRENT_SCHEMA_VERSION,
      domainContexts: [],
      flowRules: defaultFlowRules(),
    });
    expect(area.data[STORAGE_KEY]).toEqual(state);
  });

  it('does not rewrite storage that is already current', async () => {
    const area = createMemoryArea({
      [STORAGE_KEY]: { schemaVersion: CURRENT_SCHEMA_VERSION, domainContexts: [], flowRules: [] },
    });
    await loadState(area);
    expect(area.writes).toBe(0);
  });
});
