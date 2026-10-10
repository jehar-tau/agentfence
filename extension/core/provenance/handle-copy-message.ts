import { hostnameFromUrl } from '../context/match';
import type { KeyValueArea } from '../storage/state-store';
import { isCopyMessage } from './messages';
import { recordCopyEvent } from './record-copy';
import type { ProvenanceEntry } from './types';

/** The background's handler for a copy-watcher message. Returns undefined if there was nothing to record. */
export async function handleCopyMessage(
  localArea: KeyValueArea,
  sessionArea: KeyValueArea,
  message: unknown,
  tabId: number | undefined,
  now: number = Date.now(),
): Promise<ProvenanceEntry | undefined> {
  if (!isCopyMessage(message)) return undefined;
  const sourceDomain = hostnameFromUrl(message.href);
  if (!sourceDomain) return undefined;
  return recordCopyEvent(
    localArea,
    sessionArea,
    { text: message.text, sourceDomain, sourceTabId: tabId },
    now,
  );
}
