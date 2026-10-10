import { useEffect, useMemo, useState } from 'react';
import { buildMap } from '../../core/map/build-map';
import type { MapData, MapEdge, MapNode } from '../../core/map/types';
import {
  listProtectedHostnames,
  type PermissionsArea,
} from '../../core/provenance/site-protection';
import { loadState } from '../../core/storage/state-store';
import type { KeyValueArea } from '../../core/storage/state-store';
import { Canvas, type Selection } from './Canvas';
import { DetailsPanel } from './DetailsPanel';
import { FilterRail, type MapFilter } from './FilterRail';

interface Props {
  area: KeyValueArea;
  permissions: PermissionsArea;
  /** The hostname the user was on when they opened the map, if any — powers "Current site". */
  currentSiteHostname?: string;
}

export function App({ area, permissions, currentSiteHostname }: Props) {
  const [map, setMap] = useState<MapData | undefined>();
  const [filter, setFilter] = useState<MapFilter>('all');
  const [selection, setSelection] = useState<Selection>(undefined);

  useEffect(() => {
    let cancelled = false;
    Promise.all([loadState(area), listProtectedHostnames(permissions)]).then(
      ([state, protectedHostnames]) => {
        if (cancelled) return;
        setMap(buildMap(state.domainContexts, state.flowRules, protectedHostnames));
      },
    );
    return () => {
      cancelled = true;
    };
  }, [area, permissions]);

  const counts = useMemo(() => {
    const base = { allow: 0, ask: 0, block: 0 } as const;
    const result = { ...base };
    for (const edge of map?.edges ?? []) result[edge.decision]++;
    return { all: map?.edges.length ?? 0, ...result };
  }, [map]);

  const visibleEdges = useMemo((): MapEdge[] => {
    if (!map) return [];
    if (filter === 'all') return map.edges;
    if (filter === 'current-site') {
      return map.edges.filter(
        (edge) =>
          edge.sourceSite.hostname === currentSiteHostname ||
          edge.destinationSite.hostname === currentSiteHostname,
      );
    }
    return map.edges.filter((edge) => edge.decision === filter);
  }, [map, filter, currentSiteHostname]);

  function edgesForNode(node: MapNode): MapEdge[] {
    return (map?.edges ?? []).filter(
      (edge) =>
        edge.sourceSite.hostname === node.hostname ||
        edge.destinationSite.hostname === node.hostname,
    );
  }

  if (!map) {
    return (
      <main className="visual-map">
        <p>Loading…</p>
      </main>
    );
  }

  return (
    <main className="visual-map">
      <header>
        <h1>🗺️ Visual Fence Map</h1>
        <p className="muted">
          Your protected sites, grouped by context, and the flows AgentFence's rules would decide
          between them. Read-only — edit rules and sites from AgentFence's settings.
        </p>
      </header>
      <div className="visual-map-layout">
        <FilterRail
          filter={filter}
          onChange={setFilter}
          currentSiteHostname={currentSiteHostname}
          counts={counts}
        />
        <Canvas
          map={{ nodes: map.nodes, edges: visibleEdges }}
          selection={selection}
          onSelectNode={(node) => setSelection({ kind: 'node', node })}
          onSelectEdge={(edge) => setSelection({ kind: 'edge', edge })}
        />
        <DetailsPanel selection={selection} edgesForNode={edgesForNode} />
      </div>
    </main>
  );
}
