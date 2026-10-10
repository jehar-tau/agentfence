import type { ContextRef } from '../context/types';
import type { FlowDecision, FlowRule } from '../policy/types';

export interface MapNode {
  hostname: string;
  context: ContextRef;
  /** Whether AgentFence currently has permission to watch copy/paste on this site. */
  protected: boolean;
}

export interface MapEdge {
  id: string;
  source: ContextRef;
  destination: ContextRef;
  decision: FlowDecision;
  rule?: FlowRule;
  reason: string;
  /** A representative site for each side, for display — picked, not the only site in that context. */
  sourceSite: MapNode;
  destinationSite: MapNode;
}

export interface MapData {
  nodes: MapNode[];
  edges: MapEdge[];
}
