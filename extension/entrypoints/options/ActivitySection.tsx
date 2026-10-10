import { useEffect, useState } from 'react';
import { clearActivity, listActivity } from '../../core/activity/store';
import { describeOutcome } from '../../core/activity/describe';
import type { ActivityEntry } from '../../core/activity/types';
import { describeContextRef } from '../../core/context/context-ref';
import type { KeyValueArea } from '../../core/storage/state-store';

interface Props {
  area: KeyValueArea;
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

function outcomeClass(entry: ActivityEntry): string {
  if (entry.decision === 'allow') return 'outcome-allow';
  if (entry.decision === 'block') return 'outcome-block';
  return entry.outcome === 'blocked' ? 'outcome-block' : 'outcome-allow';
}

export function ActivitySection({ area }: Props) {
  const [entries, setEntries] = useState<ActivityEntry[] | undefined>();

  useEffect(() => {
    let cancelled = false;
    listActivity(area).then((loaded) => {
      if (!cancelled) setEntries(loaded);
    });
    return () => {
      cancelled = true;
    };
  }, [area]);

  async function handleClear() {
    await clearActivity(area);
    setEntries(await listActivity(area));
  }

  return (
    <section aria-labelledby="activity-heading">
      <h2 id="activity-heading">Activity</h2>
      <p className="muted">
        A record of paste decisions, on sites you've protected — metadata only, never the pasted
        text. Kept for 7 days, then removed automatically.
      </p>

      {entries === undefined ? (
        <p>Loading…</p>
      ) : entries.length === 0 ? (
        <p className="muted">No activity yet.</p>
      ) : (
        <ul className="activity-list">
          {entries.map((entry) => (
            <li key={entry.id} data-testid="activity-row" className={outcomeClass(entry)}>
              <span className="activity-time">{formatTime(entry.timestamp)}</span>
              <span className="activity-flow">
                {describeContextRef(entry.sourceContext)} →{' '}
                {describeContextRef(entry.destinationContext)}
              </span>
              <span className="activity-domains">
                {entry.sourceDomain ?? 'unknown source'} → {entry.destinationDomain}
              </span>
              <span className="activity-outcome">{describeOutcome(entry)}</span>
            </li>
          ))}
        </ul>
      )}

      <button type="button" onClick={() => void handleClear()} disabled={!entries?.length}>
        Clear history
      </button>
    </section>
  );
}
