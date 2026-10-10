import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { browser } from 'wxt/browser';
import { App } from './App';
import './style.css';

const currentSiteHostname = new URL(location.href).searchParams.get('site') ?? undefined;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App
      area={browser.storage.local}
      permissions={browser.permissions}
      currentSiteHostname={currentSiteHostname}
    />
  </StrictMode>,
);
