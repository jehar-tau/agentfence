import type { FlowDecision } from '../../core/policy/types';

export type MapFilter = 'all' | FlowDecision | 'current-site';

interface Props {
  filter: MapFilter;
  onChange: (filter: MapFilter) => void;
  currentSiteHostname?: string;
  counts: Record<'all' | FlowDecision, number>;
}

const OPTIONS: Array<{ value: 'all' | FlowDecision; label: string }> = [
  { value: 'all', label: 'All flows' },
  { value: 'block', label: 'Blocked only' },
  { value: 'ask', label: 'Asked only' },
  { value: 'allow', label: 'Allowed only' },
];

export function FilterRail({ filter, onChange, currentSiteHostname, counts }: Props) {
  return (
    <nav className="filter-rail" aria-label="Filter flows">
      <h2>Filters</h2>
      <ul className="filter-list">
        {OPTIONS.map((option) => (
          <li key={option.value}>
            <button
              type="button"
              className={filter === option.value ? 'active' : ''}
              aria-pressed={filter === option.value}
              onClick={() => onChange(option.value)}
            >
              {option.label}
              {option.value !== 'all' && (
                <span className="filter-count"> ({counts[option.value]})</span>
              )}
            </button>
          </li>
        ))}
        {currentSiteHostname && (
          <li>
            <button
              type="button"
              className={filter === 'current-site' ? 'active' : ''}
              aria-pressed={filter === 'current-site'}
              onClick={() => onChange('current-site')}
            >
              Current site ({currentSiteHostname})
            </button>
          </li>
        )}
      </ul>

      <h2>Legend</h2>
      <ul className="legend">
        <li>
          <span className="swatch allow" /> Allowed
        </li>
        <li>
          <span className="swatch ask" /> Asked
        </li>
        <li>
          <span className="swatch block" /> Blocked
        </li>
      </ul>
    </nav>
  );
}
