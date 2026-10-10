import { useEffect, useState } from 'react';
import { browser } from 'wxt/browser';
import { hostnameFromUrl } from '../../core/context/match';
import { SiteContextPanel } from './SiteContextPanel';

type SiteState =
  { status: 'loading' } | { status: 'unsupported' } | { status: 'ready'; hostname: string };

export function App() {
  const [site, setSite] = useState<SiteState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    browser.tabs
      .query({ active: true, currentWindow: true })
      .then(([tab]) => hostnameFromUrl(tab?.url))
      .catch(() => undefined)
      .then((hostname) => {
        if (cancelled) return;
        setSite(hostname ? { status: 'ready', hostname } : { status: 'unsupported' });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="popup">
      <header className="popup-header">
        <h1>AgentFence</h1>
        <p role="status">AgentFence is active</p>
      </header>
      {site.status === 'ready' && (
        <SiteContextPanel hostname={site.hostname} area={browser.storage.local} />
      )}
      {site.status === 'unsupported' && (
        <p className="muted">This page can't be assigned a context. Open a website to set one.</p>
      )}
      <footer className="popup-footer">
        <button type="button" onClick={() => void browser.runtime.openOptionsPage()}>
          Rules
        </button>
      </footer>
    </main>
  );
}
