import { useEffect, useState, type FormEvent } from 'react';
import { createContextRef, describeContextRef } from '../../core/context/context-ref';
import {
  assignSiteContext,
  getSiteContext,
  removeSiteContext,
} from '../../core/context/repository';
import {
  ASSIGNABLE_CONTEXT_TYPES,
  CONTEXT_LABELS,
  UNKNOWN_CONTEXT,
  type ContextRef,
  type ContextType,
} from '../../core/context/types';
import type { KeyValueArea } from '../../core/storage/state-store';

interface Props {
  hostname: string;
  area: KeyValueArea;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong.';
}

export function SiteContextPanel({ hostname, area }: Props) {
  const [current, setCurrent] = useState<ContextRef | undefined>();
  const [type, setType] = useState<ContextType>('work');
  const [scope, setScope] = useState('');
  const [error, setError] = useState<string | undefined>();

  function show(context: ContextRef) {
    setCurrent(context);
    if (context.type !== 'unknown') {
      setType(context.type);
      setScope(context.scope ?? '');
    }
  }

  useEffect(() => {
    let cancelled = false;
    getSiteContext(area, hostname).then(
      (context) => {
        if (!cancelled) show(context);
      },
      (loadError) => {
        if (!cancelled) setError(errorMessage(loadError));
      },
    );
    return () => {
      cancelled = true;
    };
  }, [area, hostname]);

  async function save(event: FormEvent) {
    event.preventDefault();
    setError(undefined);
    try {
      const entry = await assignSiteContext(area, hostname, createContextRef(type, scope));
      show(entry.context);
    } catch (saveError) {
      setError(errorMessage(saveError));
    }
  }

  async function remove() {
    setError(undefined);
    try {
      await removeSiteContext(area, hostname);
      setCurrent(await getSiteContext(area, hostname));
    } catch (removeError) {
      setError(errorMessage(removeError));
    }
  }

  const assigned = current !== undefined && current.type !== 'unknown';

  return (
    <section aria-label="Current site">
      <dl className="site-summary">
        <dt>Current site</dt>
        <dd data-testid="site-hostname">{hostname}</dd>
        <dt>Context</dt>
        <dd data-testid="site-context">
          {current === undefined
            ? '…'
            : assigned
              ? describeContextRef(current)
              : `Not assigned (${CONTEXT_LABELS[UNKNOWN_CONTEXT.type]})`}
        </dd>
      </dl>

      <form onSubmit={save}>
        <label htmlFor="context-type">Set context</label>
        <select
          id="context-type"
          value={type}
          onChange={(event) => setType(event.target.value as ContextType)}
        >
          {ASSIGNABLE_CONTEXT_TYPES.map((option) => (
            <option key={option} value={option}>
              {CONTEXT_LABELS[option]}
            </option>
          ))}
        </select>

        {type === 'client' && (
          <>
            <label htmlFor="context-scope">Client name</label>
            <input
              id="context-scope"
              type="text"
              value={scope}
              placeholder="e.g. acme"
              autoComplete="off"
              onChange={(event) => setScope(event.target.value)}
            />
          </>
        )}

        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}

        <div className="actions">
          <button type="submit">Save context</button>
          {assigned && (
            <button type="button" className="secondary" onClick={remove}>
              Remove
            </button>
          )}
        </div>
      </form>
    </section>
  );
}
