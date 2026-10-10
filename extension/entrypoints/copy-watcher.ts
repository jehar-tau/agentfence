import { defineUnlistedScript } from 'wxt/utils/define-unlisted-script';
import { browser } from 'wxt/browser';
import { attachCopyListener } from '../core/provenance/copy-listener';
import { COPY_MESSAGE_TYPE, type CopyMessage } from '../core/provenance/messages';

/**
 * Registered dynamically (never declared in the manifest) only for sites the user has
 * granted AgentFence access to. See core/provenance/copy-watcher-registration.ts.
 */
export default defineUnlistedScript(() => {
  attachCopyListener(
    window,
    () => window.getSelection()?.toString() ?? '',
    (text) => {
      const message: CopyMessage = { type: COPY_MESSAGE_TYPE, text, href: location.href };
      void browser.runtime.sendMessage(message).catch(() => {
        // The background service worker may be briefly asleep; the next copy will retry.
      });
    },
  );
});
