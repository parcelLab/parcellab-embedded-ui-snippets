import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import html from '../dev/index.html?raw';
import script from '../dev/main.js?raw';

describe('Promise demo data presets', () => {
  const init = vi.fn(() => ({ destroy: vi.fn() }));

  beforeEach(() => {
    document.body.innerHTML = new DOMParser().parseFromString(html, 'text/html').body.innerHTML;
    localStorage.clear();
    init.mockClear();
    Object.assign(window, { DeliveryPromise: { init } });
    new Function(script)();
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it.each([
    ['minimal', 'PDP', 'DEU', null],
    ['usa-no-zip', 'PDP', 'USA', null],
    ['pdp-range', 'Checkout', '81371_DEU', null],
    ['pdp-inline-zip', 'Checkout', '10038_USA', null],
    ['ip-germany', 'PDP', '8.8.8.8', 'DEU'],
    ['ip-usa', 'PDP', '8.8.8.8', 'USA'],
  ])('shows the request and use case for %s', (preset, useCase, destination, fallback) => {
    const button = document.querySelector(`[data-preset="${preset}"]`);
    expect(button.textContent).toContain(useCase);
    expect(button.title).toContain(useCase === 'PDP' ? 'product pages' : 'checkout');
    expect(button.getAttribute('aria-description')).toBe(button.title);
    button.click();
    const sample = document.querySelector('#sample-request').textContent.replace('GET ', '');
    const request = new URL(sample, 'https://api.parcellab.com');
    expect(request.pathname).toBe('/v2/prediction');
    expect(request.searchParams.get('destination')).toBe(destination);
    expect(request.searchParams.get('fallbackCountry')).toBe(fallback);
    const config = init.mock.lastCall[0];
    expect(config.destinationCountry).toBe(fallback ?? destination.split('_').pop());
    expect(config).not.toHaveProperty('fallbackCountry');
  });

  it('uses one country field for the IP request and both embed formats', () => {
    expect(document.querySelector('#fallback-country')).toBeNull();
    const country = document.querySelector('#country');
    country.value = 'USA';
    country.dispatchEvent(new Event('input'));
    const sample = document.querySelector('#sample-request').textContent;
    expect(sample).toContain('fallbackCountry=USA');
    expect(document.querySelector('#sample-request-note').textContent).toContain('preview uses your public IP');
    expect(document.querySelector('#embed-code').textContent).toContain('data-country="USA"');
    expect(document.querySelector('#embed-code').textContent).not.toContain('data-fallback-country');
    document.querySelector('[data-embed-mode="js"]').click();
    expect(document.querySelector('#embed-code').textContent).toContain('destinationCountry: "USA"');
    expect(document.querySelector('#embed-code').textContent).not.toContain('fallbackCountry:');
  });
});
