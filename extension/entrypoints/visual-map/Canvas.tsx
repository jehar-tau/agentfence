import { describeContextRef } from '../../core/context/context-ref';
import { CARD_HEIGHT, COLUMN_WIDTH, layoutEdges, layoutMap } from '../../core/map/layout';
import type { MapData, MapEdge, MapNode } from '../../core/map/types';

export type Selection =
  { kind: 'node'; node: MapNode } | { kind: 'edge'; edge: MapEdge } | undefined;

interface Props {
  map: MapData;
  selection: Selection;
  onSelectNode: (node: MapNode) => void;
  onSelectEdge: (edge: MapEdge) => void;
}

const DECISION_COLOR: Record<MapEdge['decision'], string> = {
  allow: '#1b7a3d',
  ask: '#8a5a00',
  block: '#b3261e',
};

function edgeLabel(edge: MapEdge): string {
  return `${describeContextRef(edge.source)} to ${describeContextRef(edge.destination)}, ${edge.decision}`;
}

export function Canvas({ map, selection, onSelectNode, onSelectEdge }: Props) {
  const layout = layoutMap(map);
  const edgeGeometry = layoutEdges(layout, map.edges);

  if (layout.columns.length === 0) {
    return (
      <div className="canvas-empty">
        <p>No protected sites yet.</p>
        <p className="muted">
          Open the AgentFence popup on a site and assign it a context to see it here.
        </p>
      </div>
    );
  }

  return (
    <div className="canvas-scroll">
      <svg
        className="canvas-svg"
        width={layout.width}
        height={layout.height}
        viewBox={`0 0 ${layout.width} ${layout.height}`}
        // "group", not "img" — the edges below are individually focusable and clickable;
        // role="img" would tell assistive tech to treat the whole thing as one opaque image
        // and hide them.
        role="group"
        aria-label="Flows between protected sites"
      >
        <defs>
          {(['allow', 'ask', 'block'] as const).map((decision) => (
            <marker
              key={decision}
              id={`arrow-${decision}`}
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M0,0 L10,5 L0,10 z" fill={DECISION_COLOR[decision]} />
            </marker>
          ))}
        </defs>

        {edgeGeometry.map(({ edge, kind, sourcePoint, destinationPoint, bow }) => {
          const selected = selection?.kind === 'edge' && selection.edge.id === edge.id;
          const color = DECISION_COLOR[edge.decision];
          const d =
            kind === 'loop'
              ? `M ${sourcePoint.x} ${sourcePoint.y} C ${sourcePoint.x + bow!} ${sourcePoint.y}, ${destinationPoint.x + bow!} ${destinationPoint.y}, ${destinationPoint.x} ${destinationPoint.y}`
              : `M ${sourcePoint.x} ${sourcePoint.y} L ${destinationPoint.x} ${destinationPoint.y}`;
          return (
            <path
              key={edge.id}
              d={d}
              fill="none"
              stroke={color}
              strokeWidth={selected ? 3 : 1.5}
              opacity={selection && !selected ? 0.35 : 1}
              markerEnd={`url(#arrow-${edge.decision})`}
              className="canvas-edge"
              role="button"
              tabIndex={0}
              aria-label={edgeLabel(edge)}
              onClick={() => onSelectEdge(edge)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') onSelectEdge(edge);
              }}
            />
          );
        })}
      </svg>

      <div className="canvas-nodes" style={{ width: layout.width, height: layout.height }}>
        {layout.columns.map((column) => (
          <div
            key={column.key}
            className="canvas-column-label"
            style={{ left: column.x - COLUMN_WIDTH / 2, width: COLUMN_WIDTH }}
          >
            {column.label}
          </div>
        ))}
        {layout.columns.flatMap((column) =>
          column.nodes.map((node) => {
            const selected =
              selection?.kind === 'node' && selection.node.hostname === node.hostname;
            return (
              <button
                key={node.hostname}
                type="button"
                className={`canvas-node${selected ? ' selected' : ''}${node.protected ? '' : ' unprotected'}`}
                style={{
                  left: node.x - COLUMN_WIDTH / 2,
                  top: node.y - CARD_HEIGHT / 2,
                  width: COLUMN_WIDTH,
                  height: CARD_HEIGHT,
                }}
                onClick={() => onSelectNode(node)}
              >
                <span className="canvas-node-hostname">{node.hostname}</span>
                {!node.protected && <span className="canvas-node-badge">not protected</span>}
              </button>
            );
          }),
        )}
      </div>
    </div>
  );
}
