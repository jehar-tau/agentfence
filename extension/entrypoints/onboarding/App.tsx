import { useEffect, useState } from 'react';
import { describeRule } from '../../core/policy/describe';
import { defaultFlowRules } from '../../core/policy/defaults';
import { listRules } from '../../core/policy/repository';
import { DECISION_LABELS, type FlowRule } from '../../core/policy/types';
import { CONTEXT_LABELS, ASSIGNABLE_CONTEXT_TYPES } from '../../core/context/types';
import type { KeyValueArea } from '../../core/storage/state-store';

const DEMO_URL = 'http://localhost:5300/';

const CONTEXT_DESCRIPTIONS: Record<(typeof ASSIGNABLE_CONTEXT_TYPES)[number], string> = {
  work: 'Team tools, work chat, internal docs',
  personal: 'Personal email, social media, your own stuff',
  finance: 'Banking, payroll, invoices',
  health: 'Medical records, insurance, anything health-related',
  client: 'A specific client or customer — scoped, e.g. Client · acme',
  public: 'Public forms, forums, anything the world can see',
};

const EXAMPLE_FLOWS: Array<[string, string]> = [
  ['Finance → Work', 'Ask'],
  ['Finance → Public', 'Block'],
  ['Health → Public', 'Block'],
  ['Client A → Client B', 'Block'],
  ['Work → Personal', 'Ask'],
  ['Same context', 'Allow'],
];

interface Props {
  area: KeyValueArea;
}

export function App({ area }: Props) {
  const [rules, setRules] = useState<FlowRule[]>(defaultFlowRules());

  useEffect(() => {
    let cancelled = false;
    listRules(area).then((loaded) => {
      if (!cancelled) setRules(loaded);
    });
    return () => {
      cancelled = true;
    };
  }, [area]);

  return (
    <main className="onboarding">
      <header>
        <h1>🛡️ Welcome to AgentFence</h1>
        <p className="lede">
          AgentFence stops AI-assisted browser workflows from moving information where it doesn't
          belong — like a bank balance ending up in a work chat. This takes under a minute to read.
        </p>
      </header>

      <section>
        <h2>1. Context boundaries</h2>
        <p>
          Everything you browse belongs to a context. AgentFence watches for information moving from
          one context to another and decides, by your rules, whether that's fine.
        </p>
        <table className="example-table">
          <tbody>
            {EXAMPLE_FLOWS.map(([flow, decision]) => (
              <tr key={flow} className={`decision-${decision.toLowerCase()}`}>
                <td>{flow}</td>
                <td>{decision}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2>2. Six contexts</h2>
        <ul className="context-list">
          {ASSIGNABLE_CONTEXT_TYPES.map((type) => (
            <li key={type}>
              <strong>{CONTEXT_LABELS[type]}</strong> — {CONTEXT_DESCRIPTIONS[type]}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>3. Protect a site</h2>
        <p>
          Click the AgentFence icon in your toolbar on any site, and assign it a context. The first
          time, your browser will ask:
        </p>
        <blockquote>
          AgentFence needs access to this site to detect supported information transfers on it. Page
          content stays on your device.
        </blockquote>
        <p className="muted">
          Nothing is watched on a site until you do this. You can decline — the context is still
          saved, just without copy/paste detection on that site yet.
        </p>
      </section>

      <section>
        <h2>4. Default rules</h2>
        <p>These are the rules AgentFence starts with. All of them are yours to change.</p>
        <table className="rules-table">
          <tbody>
            {rules.map((rule) => (
              <tr key={rule.id} className={`decision-${rule.decision}`}>
                <td>{describeRule(rule)}</td>
                <td>{DECISION_LABELS[rule.decision]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2>5. Try it</h2>
        <p>
          AgentFence ships with a small demo: five fake sites (a bank, a work chat, two client
          portals, a public form) with synthetic data, for trying a real copy → paste without
          touching anything real. From a terminal in the project:
        </p>
        <pre>pnpm demo</pre>
        <p>Then open it:</p>
        <a className="button" href={DEMO_URL} target="_blank" rel="noreferrer">
          Open the demo playground
        </a>
        <p className="muted">
          (Needs <code>pnpm demo</code> running first — this link won't work on its own.)
        </p>
      </section>

      <footer>
        <button type="button" onClick={() => window.close()}>
          Got it — start browsing
        </button>
      </footer>
    </main>
  );
}
