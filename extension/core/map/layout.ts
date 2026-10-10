import { formatContextRef } from '../context/context-ref';
import { CONTEXT_TYPES } from '../context/types';
import type { MapData, MapEdge, MapNode } from './types';

export const COLUMN_WIDTH = 170;
export const COLUMN_GAP = 48;
export const CARD_HEIGHT = 48;
export const CARD_GAP = 12;
export const TOP_PADDING = 56;
export const SIDE_PADDING = 24;
export const BOTTOM_PADDING = 24;

export interface NodeLayout extends MapNode {
  x: number;
  y: number;
}

export interface ColumnLayout {
  key: string;
  label: string;
  x: number;
  nodes: NodeLayout[];
}

export interface MapLayout {
  columns: ColumnLayout[];
  width: number;
  height: number;
  nodeByHostname: Map<string, NodeLayout>;
}

/** Column order: the context type enum order, then client scopes alphabetically. */
function columnSortKey(key: string): string {
  const [type, scope] = key.split('/');
  const typeIndex = CONTEXT_TYPES.indexOf(type as (typeof CONTEXT_TYPES)[number]);
  return `${String(typeIndex).padStart(2, '0')}/${scope ?? ''}`;
}

/**
 * A deterministic, fixed-geometry layout: one column per distinct context (client scopes get
 * their own column), nodes stacked within it. Positions are computed arithmetically from counts,
 * not measured from the DOM, so this is a pure function — easy to test, and identical in a test
 * environment and a real browser.
 */
export function layoutMap(map: MapData): MapLayout {
  const byColumn = new Map<string, { label: string; nodes: MapNode[] }>();
  for (const node of map.nodes) {
    const key = formatContextRef(node.context);
    const entry = byColumn.get(key);
    if (entry) entry.nodes.push(node);
    else byColumn.set(key, { label: key, nodes: [node] });
  }

  const orderedKeys = Array.from(byColumn.keys()).sort(
    (a, b) => columnSortKey(a).localeCompare(columnSortKey(b)) || a.localeCompare(b),
  );

  const nodeByHostname = new Map<string, NodeLayout>();
  const columns: ColumnLayout[] = orderedKeys.map((key, columnIndex) => {
    const x = SIDE_PADDING + COLUMN_WIDTH / 2 + columnIndex * (COLUMN_WIDTH + COLUMN_GAP);
    const nodes = byColumn.get(key)!.nodes.map((node, rowIndex) => {
      const laidOut: NodeLayout = {
        ...node,
        x,
        y: TOP_PADDING + CARD_HEIGHT / 2 + rowIndex * (CARD_HEIGHT + CARD_GAP),
      };
      nodeByHostname.set(node.hostname, laidOut);
      return laidOut;
    });
    return { key, label: key, x, nodes };
  });

  const maxRows = Math.max(1, ...columns.map((column) => column.nodes.length));
  const width =
    SIDE_PADDING * 2 + columns.length * COLUMN_WIDTH + Math.max(0, columns.length - 1) * COLUMN_GAP;
  const height =
    TOP_PADDING + maxRows * CARD_HEIGHT + Math.max(0, maxRows - 1) * CARD_GAP + BOTTOM_PADDING;

  return {
    columns,
    width: Math.max(width, COLUMN_WIDTH + SIDE_PADDING * 2),
    height,
    nodeByHostname,
  };
}

export interface EdgeGeometry {
  edge: MapEdge;
  /** A same-context edge is drawn as a loop beside its column; otherwise a line between columns. */
  kind: 'loop' | 'line';
  sourcePoint: { x: number; y: number };
  destinationPoint: { x: number; y: number };
  /** For a loop, how far it bows out to the side. */
  bow?: number;
}

export function layoutEdges(layout: MapLayout, edges: readonly MapEdge[]): EdgeGeometry[] {
  return edges.flatMap((edge) => {
    const source = layout.nodeByHostname.get(edge.sourceSite.hostname);
    const destination = layout.nodeByHostname.get(edge.destinationSite.hostname);
    if (!source || !destination) return [];
    const kind = source.x === destination.x ? 'loop' : 'line';
    return [
      {
        edge,
        kind,
        sourcePoint: { x: source.x, y: source.y },
        destinationPoint: { x: destination.x, y: destination.y },
        bow: kind === 'loop' ? COLUMN_WIDTH / 2 + 18 : undefined,
      },
    ];
  });
}
