import { useEffect, useState } from 'react';
import { browser } from 'wxt/browser';
import { hostnameFromUrl } from '../../core/context/match';
import { SiteContextPanel } from './SiteContextPanel';

type SiteState =
  | { status: 'loading' }
  | { status: 'unsupported' }
  | { status: 'ready'; hostname: string; url: string };

function openVisualMap() {
  void browser.tabs.create({ url: browser.runtime.getURL('/visual-map.html') });
}

function openOnboarding() {
  void browser.tabs.create({ url: browser.runtime.getURL('/onboarding.html') });
}

export function App() {
  const [site, setSite] = useState<SiteState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    browser.tabs
      .query({ active: true, currentWindow: true })
      .then(([tab]) => tab?.url)
      .catch(() => undefined)
      .then((url) => {
        if (cancelled) return;
        const hostname = hostnameFromUrl(url);
        setSite(hostname && url ? { status: 'ready', hostname, url } : { status: 'unsupported' });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="popup">
      <header className="popup-header">
        <h1>AgentFence</h1>
        <p role="status" className="status-badge">
          AgentFence is active
        </p>
      </header>
      {site.status === 'ready' && (
        <SiteContextPanel
          hostname={site.hostname}
          url={site.url}
          area={browser.storage.local}
          permissions={browser.permissions}
        />
      )}
      {site.status === 'unsupported' && (
        <p className="muted">This page can't be assigned a context. Open a website to set one.</p>
      )}
      <nav className="popup-footer" aria-label="AgentFence">
        <button type="button" onClick={() => void browser.runtime.openOptionsPage()}>
          Rules
        </button>
        <button type="button" onClick={openVisualMap}>
          Visual Map
        </button>
      </nav>
      <p className="popup-help">
        <button type="button" className="link" onClick={openOnboarding}>
          How AgentFence works
        </button>
      </p>
    </main>
  );
}
