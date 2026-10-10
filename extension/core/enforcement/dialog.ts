import { describeContextRef } from '../context/context-ref';
import type { ContextRef } from '../context/types';

export type DialogChoice = 'block' | 'allow-once' | 'always-allow' | 'dismiss';

export interface DialogDetails {
  decision: 'ask' | 'block';
  sourceContext: ContextRef;
  destinationContext: ContextRef;
  /** Present only when the source is known exactly; otherwise the text says so honestly. */
  sourceDomain?: string;
  destinationDomain: string;
  reason: string;
}

const STYLES = `
  :host { all: initial; }
  .backdrop {
    position: fixed; inset: 0; z-index: 2147483647;
    background: rgba(0, 0, 0, 0.45);
    display: flex; align-items: center; justify-content: center;
    font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
  }
  .card {
    background: #fff; color: #1a1a1a; width: 340px; max-width: calc(100vw - 32px);
    border-radius: 10px; padding: 20px; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.35);
  }
  h2 { margin: 0 0 10px; font-size: 16px; }
  p { margin: 0 0 8px; font-size: 13px; line-height: 1.45; }
  .flow { font-weight: 600; font-size: 14px; }
  .actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 16px; }
  button {
    font: inherit; font-size: 13px; padding: 8px 12px; border-radius: 6px;
    border: 1px solid #ccc; background: #f5f5f5; cursor: pointer; color: #1a1a1a;
  }
  button.primary { background: #1a1a1a; color: #fff; border-color: #1a1a1a; }
  button:focus-visible { outline: 2px solid #1a56db; outline-offset: 2px; }
`;

/**
 * Shows AgentFence's in-page intervention dialog and resolves with the user's choice. Built
 * with the DOM directly (not React) to keep what's injected into every protected page small,
 * and in a Shadow DOM so the host page's styles cannot bleed into it or vice versa.
 */
export function showInterventionDialog(
  doc: Document,
  details: DialogDetails,
): Promise<DialogChoice> {
  return new Promise((resolve) => {
    const previouslyFocused = doc.activeElement as HTMLElement | null;
    const host = doc.createElement('div');
    const shadow = host.attachShadow({ mode: 'open' });
    const style = doc.createElement('style');
    style.textContent = STYLES;

    const backdrop = doc.createElement('div');
    backdrop.className = 'backdrop';

    const card = doc.createElement('div');
    card.className = 'card';
    card.setAttribute('role', 'alertdialog');
    card.setAttribute('aria-modal', 'true');
    card.setAttribute('aria-labelledby', 'agentfence-dialog-title');
    card.setAttribute('aria-describedby', 'agentfence-dialog-desc');

    const title = doc.createElement('h2');
    title.id = 'agentfence-dialog-title';
    title.textContent = details.decision === 'block' ? 'Blocked by AgentFence' : 'Context crossing';

    const flow = doc.createElement('p');
    flow.className = 'flow';
    flow.textContent = `${describeContextRef(details.sourceContext)} → ${describeContextRef(details.destinationContext)}`;

    const desc = doc.createElement('p');
    desc.id = 'agentfence-dialog-desc';
    desc.textContent = details.sourceDomain
      ? `Copied from ${details.sourceDomain}. Pasted into ${details.destinationDomain}. ${details.reason}`
      : `The source of this text is unknown. Pasted into ${details.destinationDomain}. ${details.reason}`;

    const actions = doc.createElement('div');
    actions.className = 'actions';

    function close(choice: DialogChoice) {
      host.remove();
      previouslyFocused?.focus?.();
      resolve(choice);
    }

    function button(label: string, choice: DialogChoice, primary = false): HTMLButtonElement {
      const element = doc.createElement('button');
      element.type = 'button';
      element.textContent = label;
      if (primary) element.className = 'primary';
      element.addEventListener('click', () => close(choice));
      return element;
    }

    if (details.decision === 'block') {
      actions.appendChild(button('Dismiss', 'dismiss', true));
    } else {
      actions.appendChild(button('Block', 'block', true));
      actions.appendChild(button('Allow once', 'allow-once'));
      actions.appendChild(
        button(
          `Always allow ${describeContextRef(details.sourceContext)} → ${describeContextRef(details.destinationContext)}`,
          'always-allow',
        ),
      );
    }

    card.append(title, flow, desc, actions);
    backdrop.appendChild(card);
    shadow.append(style, backdrop);
    doc.body.appendChild(host);

    const focusable = Array.from(card.querySelectorAll('button'));
    let focusIndex = 0;
    focusable.forEach((element, index) => {
      element.addEventListener('focus', () => {
        focusIndex = index;
      });
    });
    focusable[0]?.focus();

    card.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close(details.decision === 'block' ? 'dismiss' : 'block');
        return;
      }
      if (event.key !== 'Tab' || focusable.length === 0) return;
      event.preventDefault();
      focusIndex = event.shiftKey
        ? (focusIndex - 1 + focusable.length) % focusable.length
        : (focusIndex + 1) % focusable.length;
      focusable[focusIndex]?.focus();
    });
  });
}

/** A brief, dismissing-itself notice for when AgentFence could not do what it was supposed to. */
export function showWarningToast(doc: Document, message: string, durationMs = 6000): void {
  const host = doc.createElement('div');
  const shadow = host.attachShadow({ mode: 'open' });
  const style = doc.createElement('style');
  style.textContent = `
    :host { all: initial; }
    .toast {
      position: fixed; bottom: 16px; right: 16px; z-index: 2147483647; max-width: 320px;
      background: #3a2a00; color: #fff; border-left: 4px solid #f5a623;
      padding: 10px 14px; border-radius: 6px; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
      font: 13px/1.45 system-ui, -apple-system, 'Segoe UI', sans-serif;
    }
  `;
  const toast = doc.createElement('div');
  toast.className = 'toast';
  toast.setAttribute('role', 'alert');
  toast.textContent = message;
  shadow.append(style, toast);
  doc.body.appendChild(host);
  setTimeout(() => host.remove(), durationMs);
}
