import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { App } from '../entrypoints/popup/App';

describe('popup', () => {
  it('shows the active status', () => {
    expect(renderToStaticMarkup(<App />)).toContain('AgentFence is active');
  });

  it('has obvious Rules and Visual Map entry points', () => {
    const markup = renderToStaticMarkup(<App />);
    expect(markup).toContain('Rules');
    expect(markup).toContain('Visual Map');
  });

  it('links to the onboarding walkthrough', () => {
    expect(renderToStaticMarkup(<App />)).toContain('How AgentFence works');
  });
});
