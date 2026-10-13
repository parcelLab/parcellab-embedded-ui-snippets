import { afterEach, describe, expect, it, vi } from 'vitest';
import { resolveConfig } from '../src/config';
import { fetchPrediction } from '../src/api';
import { init } from '../src/index';
import html from '../dev/index.html?raw';
import css from '../dev/styles.css?raw';

afterEach(() => vi.unstubAllGlobals());

describe('parcelLab network boundary', () => {
  it.each([
    'https://example.com', 'http://api.parcellab.com',
    'https://notparcellab.com', 'https://api.parcellab.com.example.com',
    'https://api.parcellab.com@example.com', 'https://token@api.parcellab.com',
  ])('rejects %s before a request', (apiBaseUrl) => {
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    expect(() => init({ target: document.createElement('div'), accountId: 18, destinationCountry: 'DEU', apiBaseUrl })).toThrow();
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each(['https://api.parcellab.com', 'https://api.staging.parcellab.dev'])('uses %s and rejects redirects', async (apiBaseUrl) => {
    const fetch = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ success: true, prediction: [] }) });
    vi.stubGlobal('fetch', fetch);
    const config = resolveConfig({ target: document.createElement('div'), accountId: 18, destinationCountry: 'DEU', ipFetch: true, apiBaseUrl });
    await fetchPrediction(config, new AbortController().signal, 'self');
    expect(new URL(fetch.mock.calls[0][0]).origin).toBe(apiBaseUrl);
    expect(fetch.mock.calls[0][1]).toMatchObject({ redirect: 'error' });
  });

  it('loads demo scripts and styles locally without external CSS requests', () => {
    const page = new DOMParser().parseFromString(html, 'text/html');
    for (const resource of page.querySelectorAll('script[src], link[rel="stylesheet"]')) {
      expect(resource.getAttribute('src') ?? resource.getAttribute('href')).toMatch(/^\.\//);
    }
    expect(page.querySelector('link[href="./dev/styles.css"]')).not.toBeNull();
    expect(css).not.toMatch(/@import|url\(\s*["']?(?:https?:|\/\/)/i);
  });
});
