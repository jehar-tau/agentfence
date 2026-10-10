import { upsertRule } from '../policy/repository';
import type { KeyValueArea } from '../storage/state-store';
import { isAlwaysAllowMessage } from './messages';

/** Creates (or updates) a user rule that always allows this exact source → destination flow. */
export async function handleAlwaysAllowMessage(
  localArea: KeyValueArea,
  message: unknown,
): Promise<{ ok: true } | undefined> {
  if (!isAlwaysAllowMessage(message)) return undefined;
  await upsertRule(localArea, {
    source: message.source,
    destination: message.destination,
    decision: 'allow',
  });
  return { ok: true };
}
