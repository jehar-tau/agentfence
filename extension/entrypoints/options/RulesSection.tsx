import { useEffect, useState, type FormEvent } from 'react';
import { createContextRef } from '../../core/context/context-ref';
import { describeRule } from '../../core/policy/describe';
import { evaluateFlow, type FlowEvaluation } from '../../core/policy/evaluate';
import {
  deleteRule,
  listRules,
  resetRules,
  setRuleDecision,
  setRuleEnabled,
  upsertRule,
} from '../../core/policy/repository';
import {
  DECISION_LABELS,
  FLOW_DECISIONS,
  type FlowDecision,
  type FlowRule,
} from '../../core/policy/types';
import type { KeyValueArea } from '../../core/storage/state-store';
import { EndpointPicker, toEndpoint, type EndpointDraft } from './EndpointPicker';

interface Props {
  area: KeyValueArea;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong.';
}

function DecisionSelect(props: {
  id?: string;
  label: string;
  value: FlowDecision;
  onChange: (decision: FlowDecision) => void;
}) {
  return (
    <select
      id={props.id}
      aria-label={props.id ? undefined : props.label}
      value={props.value}
      onChange={(event) => props.onChange(event.target.value as FlowDecision)}
    >
      {FLOW_DECISIONS.map((decision) => (
        <option key={decision} value={decision}>
          {DECISION_LABELS[decision]}
        </option>
      ))}
    </select>
  );
}

export function RulesSection({ area }: Props) {
  const [rules, setRules] = useState<FlowRule[] | undefined>();
  const [error, setError] = useState<string | undefined>();

  const [newSource, setNewSource] = useState<EndpointDraft>({ type: 'work', scope: '' });
  const [newDestination, setNewDestination] = useState<EndpointDraft>({
    type: 'public',
    scope: '',
  });
  const [newDecision, setNewDecision] = useState<FlowDecision>('ask');

  const [checkSource, setCheckSource] = useState<EndpointDraft>({ type: 'finance', scope: '' });
  const [checkDestination, setCheckDestination] = useState<EndpointDraft>({
    type: 'work',
    scope: '',
  });
  const [checkResult, setCheckResult] = useState<FlowEvaluation | undefined>();

  useEffect(() => {
    let cancelled = false;
    listRules(area).then(
      (loaded) => {
        if (!cancelled) setRules(loaded);
      },
      (loadError) => {
        if (!cancelled) setError(errorMessage(loadError));
      },
    );
    return () => {
      cancelled = true;
    };
  }, [area]);

  async function apply(change: () => Promise<FlowRule[]>) {
    setError(undefined);
    setCheckResult(undefined);
    try {
      setRules(await change());
    } catch (changeError) {
      setError(errorMessage(changeError));
    }
  }

  function addRule(event: FormEvent) {
    event.preventDefault();
    void apply(() =>
      upsertRule(area, {
        source: toEndpoint(newSource),
        destination: toEndpoint(newDestination),
        decision: newDecision,
      }),
    );
  }

  function checkFlow(event: FormEvent) {
    event.preventDefault();
    setError(undefined);
    try {
      setCheckResult(
        evaluateFlow(
          createContextRef(
            checkSource.type as Exclude<EndpointDraft['type'], '*'>,
            checkSource.scope,
          ),
          createContextRef(
            checkDestination.type as Exclude<EndpointDraft['type'], '*'>,
            checkDestination.scope,
          ),
          rules ?? [],
        ),
      );
    } catch (checkError) {
      setCheckResult(undefined);
      setError(errorMessage(checkError));
    }
  }

  return (
    <section aria-labelledby="rules-heading">
      <h2 id="rules-heading">Rules</h2>
      <p className="muted">
        Rules decide what happens when information moves from one context to another. The most
        specific matching rule wins; if none matches, AgentFence asks.
      </p>

      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}

      {rules === undefined ? (
        <p>Loading…</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th scope="col">Flow</th>
              <th scope="col">Decision</th>
              <th scope="col">On</th>
              <th scope="col">
                <span className="visually-hidden">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rules.map((rule) => {
              const name = describeRule(rule);
              return (
                <tr key={rule.id} data-testid="rule-row" className={rule.enabled ? '' : 'off'}>
                  <th scope="row">
                    {name}
                    {rule.description && <span className="muted"> · {rule.description}</span>}
                    {rule.createdBy === 'user' && <span className="tag">Yours</span>}
                  </th>
                  <td>
                    <DecisionSelect
                      label={`Decision for ${name}`}
                      value={rule.decision}
                      onChange={(decision) =>
                        void apply(() => setRuleDecision(area, rule.id, decision))
                      }
                    />
                  </td>
                  <td>
                    <input
                      type="checkbox"
                      aria-label={`Enable ${name}`}
                      checked={rule.enabled}
                      onChange={(event) =>
                        void apply(() => setRuleEnabled(area, rule.id, event.target.checked))
                      }
                    />
                  </td>
                  <td>
                    {rule.createdBy === 'user' && (
                      <button
                        type="button"
                        aria-label={`Delete ${name}`}
                        onClick={() => void apply(() => deleteRule(area, rule.id))}
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      <button type="button" onClick={() => void apply(() => resetRules(area))}>
        Reset rules to defaults
      </button>

      <h3>Add or change a rule</h3>
      <form className="row" onSubmit={addRule}>
        <EndpointPicker
          label="Source"
          idPrefix="new-source"
          value={newSource}
          onChange={setNewSource}
          allowWildcards
        />
        <EndpointPicker
          label="Destination"
          idPrefix="new-destination"
          value={newDestination}
          onChange={setNewDestination}
          allowWildcards
        />
        <div className="endpoint">
          <label htmlFor="new-decision">Decision</label>
          <DecisionSelect
            id="new-decision"
            label="Decision"
            value={newDecision}
            onChange={setNewDecision}
          />
        </div>
        <button type="submit">Save rule</button>
      </form>

      <h3>Check a flow</h3>
      <p className="muted">See which rule would decide a given flow. Nothing is saved.</p>
      <form className="row" onSubmit={checkFlow}>
        <EndpointPicker
          label="From"
          idPrefix="check-source"
          value={checkSource}
          onChange={setCheckSource}
          allowWildcards={false}
        />
        <EndpointPicker
          label="To"
          idPrefix="check-destination"
          value={checkDestination}
          onChange={setCheckDestination}
          allowWildcards={false}
        />
        <button type="submit">Check</button>
      </form>
      {checkResult && (
        <p role="status" data-testid="check-result" className={`result ${checkResult.decision}`}>
          <strong>{DECISION_LABELS[checkResult.decision]}.</strong> {checkResult.reason}
        </p>
      )}
    </section>
  );
}
