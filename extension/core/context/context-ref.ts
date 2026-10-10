import { CONTEXT_LABELS, CONTEXT_TYPES, type ContextRef, type ContextType } from './types';

export class ContextRefError extends Error {}

function isContextType(value: string): value is ContextType {
  return (CONTEXT_TYPES as readonly string[]).includes(value);
}

/** Turns free text such as " ACME Corp " into a stable scope id such as `acme-corp`. */
export function normalizeScope(raw: string): string {
  return raw
    .normalize('NFKC')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/** Builds a valid ContextRef. Client contexts require a scope; other types never carry one. */
export function createContextRef(type: ContextType, scope?: string): ContextRef {
  if (type !== 'client') return { type };
  const normalized = normalizeScope(scope ?? '');
  if (!normalized) throw new ContextRefError('A client context needs a client name.');
  return { type, scope: normalized };
}

/** `{ type: 'client', scope: 'acme' }` → `client/acme`; `{ type: 'work' }` → `work`. */
export function formatContextRef(ref: ContextRef): string {
  return ref.scope ? `${ref.type}/${ref.scope}` : ref.type;
}

/** Inverse of formatContextRef. Returns undefined for anything that is not a valid ref. */
export function parseContextRef(text: string): ContextRef | undefined {
  const [type, scope, ...rest] = text.trim().toLowerCase().split('/');
  if (!type || !isContextType(type) || rest.length > 0) return undefined;
  if (type !== 'client' && scope !== undefined) return undefined;
  try {
    return createContextRef(type, scope);
  } catch {
    return undefined;
  }
}

export function contextRefEquals(a: ContextRef, b: ContextRef): boolean {
  return a.type === b.type && (a.scope ?? '') === (b.scope ?? '');
}

/** Human-readable label, e.g. `Client · acme`. */
export function describeContextRef(ref: ContextRef): string {
  return ref.scope ? `${CONTEXT_LABELS[ref.type]} · ${ref.scope}` : CONTEXT_LABELS[ref.type];
}
