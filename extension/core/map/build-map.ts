import { contextRefEquals, formatContextRef } from '../context/context-ref';
import type { DomainContext } from '../context/types';
import { evaluateFlow } from '../policy/evaluate';
import type { FlowRule } from '../policy/types';
import type { MapData, MapEdge, MapNode } from './types';

/**
 * Turns the user's site assignments and rules into a map: one node per protected site, and
 * one representative edge per pair of distinct contexts actually present among those sites —
 * evaluated through the real rule engine, so the map is always a true picture of what
 * AgentFence would currently decide for that pair, not a fixed demo. There is no recorded
 * activity to draw from yet (that's Activity History, a later milestone), so edges show the
 * rule that *would* apply rather than something that actually happened.
 */
export function buildMap(
  domainContexts: readonly DomainContext[],
  rules: readonly FlowRule[],
  protectedHostnames: ReadonlySet<string>,
): MapData {
  const nodes: MapNode[] = domainContexts
    .filter((entry) => entry.enabled && entry.context.type !== 'unknown')
    .map((entry) => ({
      hostname: entry.pattern,
      context: entry.context,
      protected: protectedHostnames.has(entry.pattern),
    }));

  const edges: MapEdge[] = [];
  const seenPairs = new Set<string>();

  for (const sourceSite of nodes) {
    for (const destinationSite of nodes) {
      const sameContext = contextRefEquals(sourceSite.context, destinationSite.context);
      // A same-context pair needs two distinct sites; this also skips a site paired with itself.
      if (sameContext && sourceSite.hostname >= destinationSite.hostname) continue;

      const pairKey = sameContext
        ? `same:${formatContextRef(sourceSite.context)}`
        : `${formatContextRef(sourceSite.context)}>${formatContextRef(destinationSite.context)}`;
      if (seenPairs.has(pairKey)) continue;
      seenPairs.add(pairKey);

      const evaluation = evaluateFlow(sourceSite.context, destinationSite.context, rules);
      edges.push({
        id: pairKey,
        source: sourceSite.context,
        destination: destinationSite.context,
        decision: evaluation.decision,
        rule: evaluation.matchedRule,
        reason: evaluation.reason,
        sourceSite,
        destinationSite,
      });
    }
  }

  return { nodes, edges };
}
