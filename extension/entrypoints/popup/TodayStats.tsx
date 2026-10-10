import { useEffect, useState } from 'react';
import { listActivity } from '../../core/activity/store';
import type { KeyValueArea } from '../../core/storage/state-store';

interface Props {
  area: KeyValueArea;
}

function isToday(timestamp: number, now: Date): boolean {
  const entryDate = new Date(timestamp);
  return (
    entryDate.getFullYear() === now.getFullYear() &&
    entryDate.getMonth() === now.getMonth() &&
    entryDate.getDate() === now.getDate()
  );
}

/** The spec's popup mockup: "Today: N blocked, N asked". Omitted entirely once there's nothing to show. */
export function TodayStats({ area }: Props) {
  const [counts, setCounts] = useState<{ blocked: number; asked: number } | undefined>();

  useEffect(() => {
    let cancelled = false;
    listActivity(area).then((entries) => {
      if (cancelled) return;
      const now = new Date();
      const today = entries.filter((entry) => isToday(entry.timestamp, now));
      setCounts({
        blocked: today.filter((entry) => entry.decision === 'block').length,
        asked: today.filter((entry) => entry.decision === 'ask').length,
      });
    });
    return () => {
      cancelled = true;
    };
  }, [area]);

  if (!counts || (counts.blocked === 0 && counts.asked === 0)) return null;

  return (
    <p className="today-stats">
      Today: {counts.blocked} blocked, {counts.asked} asked
    </p>
  );
}
