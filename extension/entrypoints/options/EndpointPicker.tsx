import { CONTEXT_LABELS, CONTEXT_TYPES, type ContextType } from '../../core/context/types';
import type { RuleEndpoint } from '../../core/policy/types';

export interface EndpointDraft {
  type: ContextType | '*';
  scope: string;
}

export function toEndpoint(draft: EndpointDraft): RuleEndpoint {
  if (draft.type === '*') return '*';
  if (draft.type === 'client' && draft.scope.trim()) return { type: 'client', scope: draft.scope };
  return { type: draft.type };
}

interface Props {
  /** Used for element ids and accessible names, e.g. "Source". */
  label: string;
  idPrefix: string;
  value: EndpointDraft;
  onChange: (value: EndpointDraft) => void;
  /** Whether "Any" and "any client" are offered. Off when picking one concrete context. */
  allowWildcards: boolean;
}

export function EndpointPicker({ label, idPrefix, value, onChange, allowWildcards }: Props) {
  return (
    <div className="endpoint">
      <label htmlFor={`${idPrefix}-type`}>{label}</label>
      <select
        id={`${idPrefix}-type`}
        value={value.type}
        onChange={(event) =>
          onChange({ ...value, type: event.target.value as EndpointDraft['type'] })
        }
      >
        {allowWildcards && <option value="*">Any</option>}
        {CONTEXT_TYPES.map((type) => (
          <option key={type} value={type}>
            {CONTEXT_LABELS[type]}
          </option>
        ))}
      </select>
      {value.type === 'client' && (
        <>
          <label htmlFor={`${idPrefix}-scope`}>
            {label} client name{allowWildcards ? ' (blank = any client)' : ''}
          </label>
          <input
            id={`${idPrefix}-scope`}
            type="text"
            value={value.scope}
            placeholder="e.g. acme"
            autoComplete="off"
            onChange={(event) => onChange({ ...value, scope: event.target.value })}
          />
        </>
      )}
    </div>
  );
}
