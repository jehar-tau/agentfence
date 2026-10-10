import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { browser } from 'wxt/browser';
import { ActivitySection } from './ActivitySection';
import { RulesSection } from './RulesSection';
import './style.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <main className="options">
      <h1>AgentFence settings</h1>
      <RulesSection area={browser.storage.local} />
      <ActivitySection area={browser.storage.local} />
    </main>
  </StrictMode>,
);
