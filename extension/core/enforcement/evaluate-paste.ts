import { getSiteContext } from '../context/repository';
import { hostnameFromUrl } from '../context/match';
import { UNKNOWN_CONTEXT } from '../context/types';
import { evaluateFlow } from '../policy/evaluate';
import { listRules } from '../policy/repository';
import { sha256Hex } from '../provenance/hash';
import { normalizeForHash } from '../provenance/normalize';
import { findProvenanceByHash } from '../provenance/store';
import type { KeyValueArea } from '../storage/state-store';
import type { PasteCheckResponse } from './messages';

export interface PasteInput {
  text: string;
  href: string;
}

/**
 * The spec's paste evaluation, steps 1-6: normalize, hash, find an exact recent source,
 * resolve the destination, evaluate the flow rule, and return the decision. If no exact
 * source match is found, the source is `unknown` — never guessed. See docs/product-spec.md §14.
 */
export async function evaluatePaste(
  localArea: KeyValueArea,
  sessionArea: KeyValueArea,
  input: PasteInput,
  now: number = Date.now(),
): Promise<PasteCheckResponse | undefined> {
  const destinationDomain = hostnameFromUrl(input.href);
  if (!destinationDomain) return undefined;

  const normalized = normalizeForHash(input.text);
  const provenance = normalized
    ? await findProvenanceByHash(sessionArea, await sha256Hex(normalized), now)
    : undefined;

  const [destinationContext, rules] = await Promise.all([
    getSiteContext(localArea, destinationDomain),
    listRules(localArea),
  ]);
  const sourceContext = provenance?.sourceContext ?? UNKNOWN_CONTEXT;
  const evaluation = evaluateFlow(sourceContext, destinationContext, rules);

  return {
    decision: evaluation.decision,
    reason: evaluation.reason,
    sourceContext,
    destinationContext,
    sourceDomain: provenance?.sourceDomain,
    // Milestone 3 only ever records 'exact' matches; 'inferred' heuristics are a later milestone.
    confidence: provenance ? 'exact' : 'unknown',
  };
}
