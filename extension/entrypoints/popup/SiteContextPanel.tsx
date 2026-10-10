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
import {
  isOriginProtected,
  originPatternFromUrl,
  requestSiteProtection,
  revokeSiteProtection,
  type PermissionsArea,
} from '../../core/provenance/site-protection';
import type { KeyValueArea } from '../../core/storage/state-store';

interface Props {
  hostname: string;
  url: string;
  area: KeyValueArea;
  permissions: PermissionsArea;
}

type Protection = 'on' | 'off';

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong.';
}

export function SiteContextPanel({ hostname, url, area, permissions }: Props) {
  const originPattern = originPatternFromUrl(url);

  const [current, setCurrent] = useState<ContextRef | undefined>();
  const [type, setType] = useState<ContextType>('work');
  const [scope, setScope] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [protection, setProtection] = useState<Protection>('off');
  const [protectionNote, setProtectionNote] = useState<string | undefined>();

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

  useEffect(() => {
    if (!originPattern) return;
    let cancelled = false;
    isOriginProtected(permissions, originPattern).then(
      (on) => {
        if (!cancelled) setProtection(on ? 'on' : 'off');
      },
      () => {
        if (!cancelled) setProtection('off');
      },
    );
    return () => {
      cancelled = true;
    };
  }, [permissions, originPattern]);

  async function enableProtection() {
    if (!originPattern) return;
    setProtectionNote(undefined);
    try {
      const granted = await requestSiteProtection(permissions, originPattern);
      setProtection(granted ? 'on' : 'off');
      if (!granted) {
        setProtectionNote(
          "Site access was not granted, so AgentFence can't watch for transfers on this site yet.",
        );
      }
    } catch (grantError) {
      setProtection('off');
      setProtectionNote(errorMessage(grantError));
    }
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    setError(undefined);
    try {
      const entry = await assignSiteContext(area, hostname, createContextRef(type, scope));
      show(entry.context);
      if (protection !== 'on') await enableProtection();
    } catch (saveError) {
      setError(errorMessage(saveError));
    }
  }

  async function remove() {
    setError(undefined);
    try {
      if (originPattern) {
        await revokeSiteProtection(permissions, originPattern);
        setProtection('off');
        setProtectionNote(undefined);
      }
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

      {assigned && originPattern && (
        <div className="protection" data-testid="protection">
          <p>
            Protection:{' '}
            <strong data-testid="protection-status">{protection === 'on' ? 'On' : 'Off'}</strong>
          </p>
          {protection !== 'on' && (
            <>
              <p className="muted">
                AgentFence needs access to this site to detect supported information transfers on
                it. Page content stays on your device.
              </p>
              <button type="button" onClick={() => void enableProtection()}>
                Turn on protection
              </button>
            </>
          )}
          {protectionNote && (
            <p role="alert" className="error">
              {protectionNote}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
