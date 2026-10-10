// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  showInterventionDialog,
  showWarningToast,
  type DialogDetails,
} from '../core/enforcement/dialog';

afterEach(() => {
  document.body.innerHTML = '';
});

function askDetails(overrides: Partial<DialogDetails> = {}): DialogDetails {
  return {
    decision: 'ask',
    sourceContext: { type: 'finance' },
    destinationContext: { type: 'work' },
    sourceDomain: 'bank.demo.test',
    destinationDomain: 'work-chat.demo.test',
    reason: 'Finance → Work: matched the exact context rule “Finance → Work”: Ask.',
    ...overrides,
  };
}

function host() {
  return document.body.lastElementChild as HTMLElement;
}

function shadowCard() {
  return host().shadowRoot!.querySelector('[role="alertdialog"]') as HTMLElement;
}

function buttons() {
  return Array.from(shadowCard().querySelectorAll('button'));
}

describe('showInterventionDialog — ask', () => {
  it('is an accessible modal naming the flow, the source, the destination, and the rule', async () => {
    const promise = showInterventionDialog(document, askDetails());
    const card = shadowCard();

    expect(card.getAttribute('aria-modal')).toBe('true');
    const title = card.querySelector('#agentfence-dialog-title')!;
    const desc = card.querySelector('#agentfence-dialog-desc')!;
    expect(card.getAttribute('aria-labelledby')).toBe(title.id);
    expect(card.getAttribute('aria-describedby')).toBe(desc.id);
    expect(title.textContent).toBe('Context crossing');
    expect(desc.textContent).toContain('bank.demo.test');
    expect(desc.textContent).toContain('work-chat.demo.test');
    expect(desc.textContent).toContain('Ask.');
    expect(buttons().map((b) => b.textContent)).toEqual([
      'Block',
      'Allow once',
      'Always allow Finance → Work',
    ]);

    buttons()[0]!.click();
    expect(await promise).toBe('block');
  });

  it('says the source is unknown rather than guessing it', () => {
    showInterventionDialog(document, askDetails({ sourceDomain: undefined }));
    expect(shadowCard().querySelector('#agentfence-dialog-desc')!.textContent).toContain(
      'source of this text is unknown',
    );
  });

  it.each([
    ['Block', 0, 'block'],
    ['Allow once', 1, 'allow-once'],
    ['Always allow', 2, 'always-allow'],
  ] as const)('resolves %s to %s', async (_label, index, expected) => {
    const promise = showInterventionDialog(document, askDetails());
    buttons()[index]!.click();
    expect(await promise).toBe(expected);
  });

  it('removes itself from the page and restores focus after a choice', async () => {
    const trigger = document.createElement('button');
    document.body.appendChild(trigger);
    trigger.focus();
    expect(document.activeElement).toBe(trigger);

    const promise = showInterventionDialog(document, askDetails());
    expect(document.body.children.length).toBe(2);
    const dialogHost = host();

    buttons()[0]!.click();
    await promise;

    expect(document.body.contains(dialogHost)).toBe(false);
    expect(document.activeElement).toBe(trigger);
  });

  it('focuses the first button on open', () => {
    showInterventionDialog(document, askDetails());
    expect(
      shadowCard().shadowRoot?.activeElement ?? host().shadowRoot!.activeElement,
    ).toBeDefined();
  });

  it('cycles focus between buttons with Tab and wraps at the ends', () => {
    showInterventionDialog(document, askDetails());
    const card = shadowCard();
    const [first, second, third] = buttons();
    const focusSpies = buttons().map((b) => vi.spyOn(b, 'focus'));

    card.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }),
    );
    expect(focusSpies[1]).toHaveBeenCalled();
    card.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }),
    );
    expect(focusSpies[2]).toHaveBeenCalled();
    card.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }),
    );
    expect(focusSpies[0]).toHaveBeenCalled();
    card.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true, cancelable: true }),
    );
    expect(focusSpies[2]).toHaveBeenCalledTimes(2);
    void first;
    void second;
    void third;
  });

  it('treats Escape as Block for an ask dialog', async () => {
    const promise = showInterventionDialog(document, askDetails());
    shadowCard().dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
    );
    expect(await promise).toBe('block');
  });
});

describe('showInterventionDialog — block', () => {
  it('shows only a Dismiss action and labels the dialog as blocked', async () => {
    const promise = showInterventionDialog(
      document,
      askDetails({
        decision: 'block',
        reason: 'Finance → Public: matched “Finance → Public”: Block.',
      }),
    );
    const card = shadowCard();
    expect(card.querySelector('#agentfence-dialog-title')!.textContent).toBe(
      'Blocked by AgentFence',
    );
    expect(buttons().map((b) => b.textContent)).toEqual(['Dismiss']);

    buttons()[0]!.click();
    expect(await promise).toBe('dismiss');
  });

  it('treats Escape as Dismiss for a block dialog', async () => {
    const promise = showInterventionDialog(document, askDetails({ decision: 'block' }));
    shadowCard().dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
    );
    expect(await promise).toBe('dismiss');
  });
});

describe('showWarningToast', () => {
  it('shows an alert with the message and removes itself after the timeout', () => {
    vi.useFakeTimers();
    try {
      showWarningToast(document, 'Could not complete the paste.', 1000);
      const toastHost = document.body.firstElementChild as HTMLElement;
      const toast = toastHost.shadowRoot!.querySelector('[role="alert"]')!;
      expect(toast.textContent).toBe('Could not complete the paste.');

      vi.advanceTimersByTime(1000);
      expect(document.body.contains(toastHost)).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });
});
