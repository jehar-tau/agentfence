import type { DomainContext } from '../context/types';

export const STORAGE_KEY = 'agentfence:state';

export interface StoredState {
  schemaVersion: number;
  domainContexts: DomainContext[];
}

type RawState = Record<string, unknown>;
export type Migration = (state: RawState) => RawState;

/**
 * MIGRATIONS[n] upgrades stored data from schema version n to n + 1.
 * Version 0 is "nothing stored yet". Never edit a released migration; append a new one.
 */
export const MIGRATIONS: readonly Migration[] = [
  // 0 → 1: initial schema with site context assignments.
  (state) => ({ ...state, domainContexts: [] }),
];

export const CURRENT_SCHEMA_VERSION = MIGRATIONS.length;

export class SchemaError extends Error {}

/** Upgrades whatever is in storage to the current schema. Does not touch storage itself. */
export function migrate(raw: unknown, migrations: readonly Migration[] = MIGRATIONS): StoredState {
  if (raw !== undefined && raw !== null && (typeof raw !== 'object' || Array.isArray(raw))) {
    throw new SchemaError('Stored AgentFence data is not an object.');
  }
  let state: RawState = { ...((raw as RawState | null | undefined) ?? {}) };
  const version = state.schemaVersion ?? 0;
  if (typeof version !== 'number' || !Number.isInteger(version) || version < 0) {
    throw new SchemaError('Stored AgentFence data has an invalid schema version.');
  }
  if (version > migrations.length) {
    throw new SchemaError(
      `Stored AgentFence data uses schema version ${version}, but this build only supports up to ${migrations.length}.`,
    );
  }
  for (let from = version; from < migrations.length; from++) {
    state = { ...migrations[from]!(state), schemaVersion: from + 1 };
  }
  return state as unknown as StoredState;
}
