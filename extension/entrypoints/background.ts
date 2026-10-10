import { defineBackground } from 'wxt/utils/define-background';
import { browser } from 'wxt/browser';
import { evaluatePaste } from '../core/enforcement/evaluate-paste';
import { handleAlwaysAllowMessage } from '../core/enforcement/handle-always-allow';
import { isAlwaysAllowMessage, isPasteCheckMessage } from '../core/enforcement/messages';
import {
  reconcileSiteWatchers,
  registerSiteWatchers,
  unregisterSiteWatchers,
} from '../core/enforcement/site-watcher-registration';
import { handleCopyMessage } from '../core/provenance/handle-copy-message';
import { isSingleHostOriginPattern } from '../core/provenance/site-protection';

export default defineBackground({
  type: 'module',
  main() {
    const localArea = browser.storage.local;
    const sessionArea = browser.storage.session;

    browser.runtime.onMessage.addListener((message, sender) => {
      if (isPasteCheckMessage(message)) return evaluatePaste(localArea, sessionArea, message);
      if (isAlwaysAllowMessage(message)) return handleAlwaysAllowMessage(localArea, message);
      return handleCopyMessage(localArea, sessionArea, message, sender.tab?.id);
    });

    const sync = () => void reconcileSiteWatchers(browser.permissions, browser.scripting);
    browser.runtime.onStartup.addListener(sync);
    browser.runtime.onInstalled.addListener(sync);

    // First-run onboarding — only on a fresh install, never on an update or a dev reload.
    browser.runtime.onInstalled.addListener((details) => {
      if (details.reason === 'install') {
        void browser.tabs.create({ url: browser.runtime.getURL('/onboarding.html') });
      }
    });

    // Keeps the watcher scripts in sync with the permission even when it changes outside
    // the popup, e.g. a site removed from chrome://extensions.
    browser.permissions.onAdded.addListener(({ origins = [] }) => {
      for (const origin of origins.filter(isSingleHostOriginPattern)) {
        void registerSiteWatchers(browser.scripting, origin);
      }
    });
    browser.permissions.onRemoved.addListener(({ origins = [] }) => {
      for (const origin of origins.filter(isSingleHostOriginPattern)) {
        void unregisterSiteWatchers(browser.scripting, origin);
      }
    });
  },
});
