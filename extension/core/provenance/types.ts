import type { ContextRef } from '../context/types';

export type ProvenanceConfidence = 'exact' | 'inferred' | 'unknown';

/**
 * Metadata about a copy event. Never holds the copied text itself — only a hash of it,
 * so a later paste can be matched against it without AgentFence ever storing content.
 */
export interface ProvenanceEntry {
  id: string;
  contentHash: string;
  contentLength: number;
  sourceDomain: string;
  sourceContext: ContextRef;
  sourceTabId?: number;
  capturedAt: number;
  confidence: ProvenanceConfidence;
}
