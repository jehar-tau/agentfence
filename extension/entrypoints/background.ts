import { defineBackground } from 'wxt/utils/define-background';
import { browser } from 'wxt/browser';
import {
  reconcileCopyWatchers,
  registerCopyWatcher,
  unregisterCopyWatcher,
} from '../core/provenance/copy-watcher-registration';
import { handleCopyMessage } from '../core/provenance/handle-copy-message';
import { isSingleHostOriginPattern } from '../core/provenance/site-protection';

export default defineBackground({
  type: 'module',
  main() {
    browser.runtime.onMessage.addListener((message, sender) =>
      handleCopyMessage(browser.storage.local, browser.storage.session, message, sender.tab?.id),
    );

    const sync = () => void reconcileCopyWatchers(browser.permissions, browser.scripting);
    browser.runtime.onStartup.addListener(sync);
    browser.runtime.onInstalled.addListener(sync);

    // Keeps the copy watcher in sync with the permission even when it changes outside
    // the popup, e.g. a site removed from chrome://extensions.
    browser.permissions.onAdded.addListener(({ origins = [] }) => {
      for (const origin of origins.filter(isSingleHostOriginPattern)) {
        void registerCopyWatcher(browser.scripting, origin);
      }
    });
    browser.permissions.onRemoved.addListener(({ origins = [] }) => {
      for (const origin of origins.filter(isSingleHostOriginPattern)) {
        void unregisterCopyWatcher(browser.scripting, origin);
      }
    });
  },
});
