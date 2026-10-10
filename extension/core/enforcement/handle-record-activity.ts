import { recordActivity } from '../activity/store';
import type { KeyValueArea } from '../storage/state-store';
import { isRecordActivityMessage } from './messages';

/** Records one completed paste decision into activity history. */
export async function handleRecordActivityMessage(
  localArea: KeyValueArea,
  message: unknown,
  now: number = Date.now(),
): Promise<{ ok: true } | undefined> {
  if (!isRecordActivityMessage(message)) return undefined;
  await recordActivity(
    localArea,
    {
      id: crypto.randomUUID(),
      timestamp: now,
      sourceContext: message.sourceContext,
      destinationContext: message.destinationContext,
      sourceDomain: message.sourceDomain,
      destinationDomain: message.destinationDomain,
      decision: message.decision,
      outcome: message.outcome,
      ruleId: message.ruleId,
    },
    now,
  );
  return { ok: true };
}
