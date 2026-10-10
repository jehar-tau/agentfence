import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { App } from '../entrypoints/popup/App';

describe('popup', () => {
  it('shows the active status', () => {
    expect(renderToStaticMarkup(<App />)).toContain('AgentFence is active');
  });
});
