import { defineUnlistedScript } from 'wxt/utils/define-unlisted-script';
import { browser } from 'wxt/browser';
import { showInterventionDialog, showWarningToast } from '../core/enforcement/dialog';
import { insertPastedText } from '../core/enforcement/insert-text';
import {
  ALWAYS_ALLOW_MESSAGE_TYPE,
  PASTE_CHECK_MESSAGE_TYPE,
  type AlwaysAllowMessage,
  type PasteCheckMessage,
  type PasteCheckResponse,
} from '../core/enforcement/messages';
import { attachPasteListener } from '../core/enforcement/paste-listener';

/**
 * Registered dynamically alongside copy-watcher.ts, only for sites the user has granted
 * AgentFence access to. See core/enforcement/site-watcher-registration.ts.
 */
export default defineUnlistedScript(() => {
  attachPasteListener(window, (text) => {
    void handlePaste(text);
  });
});

async function handlePaste(text: string): Promise<void> {
  const message: PasteCheckMessage = { type: PASTE_CHECK_MESSAGE_TYPE, text, href: location.href };
  let response: PasteCheckResponse | undefined;
  try {
    response = (await browser.runtime.sendMessage(message)) as PasteCheckResponse | undefined;
  } catch {
    response = undefined;
  }

  if (!response) {
    // Could not reach the background to evaluate this paste. Never silently drop it or
    // silently let it through unexamined without saying so (AGENTS.md #13, #14).
    showWarningToast(document, "AgentFence couldn't check this paste, so it was not evaluated.");
    completePaste(text);
    return;
  }

  if (response.decision === 'allow') {
    completePaste(text);
    return;
  }

  const choice = await showInterventionDialog(document, {
    decision: response.decision === 'block' ? 'block' : 'ask',
    sourceContext: response.sourceContext,
    destinationContext: response.destinationContext,
    sourceDomain: response.sourceDomain,
    destinationDomain: location.hostname,
    reason: response.reason,
  });

  if (choice === 'block' || choice === 'dismiss') return;

  if (choice === 'always-allow') {
    const allowMessage: AlwaysAllowMessage = {
      type: ALWAYS_ALLOW_MESSAGE_TYPE,
      source: response.sourceContext,
      destination: response.destinationContext,
    };
    void browser.runtime.sendMessage(allowMessage).catch(() => {});
  }
  completePaste(text);
}

function completePaste(text: string): void {
  if (!insertPastedText(document, text)) {
    showWarningToast(
      document,
      "AgentFence couldn't complete this paste automatically. Please paste again.",
    );
  }
}
