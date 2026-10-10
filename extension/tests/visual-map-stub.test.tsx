import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { App } from '../entrypoints/visual-map/App';

describe('visual map stub', () => {
  it('says plainly that it is not built yet, rather than showing an empty or broken page', () => {
    const markup = renderToStaticMarkup(<App />);
    expect(markup).toContain('Visual Fence Map');
    expect(markup).toContain('Not built yet');
  });

  it('links to the Rules page as the current way to see and edit rules', () => {
    const markup = renderToStaticMarkup(<App />);
    expect(markup).toContain('href="/options.html#rules-heading"');
  });
});
