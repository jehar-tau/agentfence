import { describeContextRef } from '../../core/context/context-ref';
import { describeRule } from '../../core/policy/describe';
import { DECISION_LABELS } from '../../core/policy/types';
import type { MapEdge, MapNode } from '../../core/map/types';
import type { Selection } from './Canvas';

interface Props {
  selection: Selection;
  edgesForNode: (node: MapNode) => MapEdge[];
}

function openOptions() {
  window.open('/options.html#rules-heading', '_blank');
}

export function DetailsPanel({ selection, edgesForNode }: Props) {
  if (!selection) {
    return (
      <aside className="details-panel" aria-label="Details">
        <p className="muted">Select a site or a flow to see details here.</p>
      </aside>
    );
  }

  if (selection.kind === 'node') {
    const { node } = selection;
    const edges = edgesForNode(node);
    return (
      <aside className="details-panel" aria-label="Site details">
        <h2>{node.hostname}</h2>
        <dl>
          <dt>Context</dt>
          <dd>{describeContextRef(node.context)}</dd>
          <dt>Protected</dt>
          <dd>{node.protected ? 'Yes' : 'No — open the popup on this site to turn it on'}</dd>
        </dl>
        <h3>Flows involving this site</h3>
        {edges.length === 0 ? (
          <p className="muted">None yet — protect another site to see flows here.</p>
        ) : (
          <ul className="edge-list">
            {edges.map((edge) => (
              <li key={edge.id} className={`decision-${edge.decision}`}>
                {describeContextRef(edge.source)} → {describeContextRef(edge.destination)}:{' '}
                {DECISION_LABELS[edge.decision]}
              </li>
            ))}
          </ul>
        )}
        <button type="button" onClick={openOptions}>
          Open AgentFence settings
        </button>
      </aside>
    );
  }

  const { edge } = selection;
  return (
    <aside className="details-panel" aria-label="Flow details">
      <h2>
        {describeContextRef(edge.source)} → {describeContextRef(edge.destination)}
      </h2>
      <dl>
        <dt>Decision</dt>
        <dd className={`decision-${edge.decision}`}>{DECISION_LABELS[edge.decision]}</dd>
        <dt>Rule</dt>
        <dd>{edge.rule ? describeRule(edge.rule) : 'Fallback (no rule matched)'}</dd>
        <dt>Confidence</dt>
        <dd>Not available yet — this is what the rule says, not a recorded event.</dd>
        <dt>Between</dt>
        <dd>
          {edge.sourceSite.hostname} → {edge.destinationSite.hostname}
        </dd>
      </dl>
      <button type="button" onClick={openOptions}>
        Edit this rule
      </button>
    </aside>
  );
}
