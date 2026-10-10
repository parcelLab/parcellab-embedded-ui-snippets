import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import html from '../dev/index.html?raw';
import script from '../dev/main.js?raw';

describe('Promise demo data presets', () => {
  const init = vi.fn(() => ({ destroy: vi.fn() }));

  beforeEach(() => {
    window.history.replaceState(null, '', '/');
    document.body.innerHTML = new DOMParser().parseFromString(html, 'text/html').body.innerHTML;
    localStorage.clear();
    init.mockClear();
    Object.assign(window, { DeliveryPromise: { init } });
    new Function(script)();
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  function reloadDemo() {
    document.body.innerHTML = new DOMParser().parseFromString(html, 'text/html').body.innerHTML;
    init.mockClear();
    new Function(script)();
  }

  it('shares every control and restores the same configuration and embed mode', () => {
    const controls = document.querySelectorAll('input[id], select[id]');
    const settings = {
      'account-id': '18', country: 'USA', 'postal-code': '10038', 'location-mode': 'ip',
      'ip-address': '2001:4860:4860::8888', courier: 'dhl-germany', 'service-level': 'express', warehouse: 'EU-1',
      layout: 'card', 'date-mode': 'by', 'zip-picker': 'inline', 'country-picker': 'true', 'show-cutoff': 'never',
      locale: 'fr', icon: 'calendar', confidence: 'guaranteed', 'date-format': 'shortWithYear',
      'fallback-days': '2-3', 'show-carrier': 'inline', 'require-zip': 'true',
      'selection-reference-date': 'latest', 'selection-pick': 'latest',
    };
    expect(Object.keys(settings)).toHaveLength(controls.length);
    for (const node of controls) {
      node.value = settings[node.id];
      node.dispatchEvent(new Event(node.tagName === 'SELECT' ? 'change' : 'input'));
    }
    document.querySelector('[data-embed-mode="js"]').click();
    const values = Array.from(controls, (node) => [node.id, node.value]);
    const config = init.mock.lastCall[0];
    const query = new URL(window.location.href).searchParams;
    for (const [id, value] of values) {
      const key = id.replace(/-([a-z])/g, (_match, letter) => letter.toUpperCase());
      expect(query.get(key)).toBe(value);
    }
    expect(query.get('ipAddress')).toBe('2001:4860:4860::8888');
    expect(query.get('selectionReferenceDate')).toBe('latest');
    expect(query.get('fallbackDays')).toBe('2-3');
    expect(query.get('embedMode')).toBe('js');
    expect(query.has('dataPreset')).toBe(false);
    expect(query.has('presentationPreset')).toBe(false);
    reloadDemo();
    for (const [id, value] of values) expect(document.getElementById(id).value).toBe(value);
    expect(init.mock.lastCall[0]).toEqual({ ...config, target: document.querySelector('#promise-demo') });
    expect(document.querySelector('[data-embed-mode="js"]').getAttribute('aria-pressed')).toBe('true');
    expect(document.querySelector('#embed-code').textContent).toContain('ipAddress: "2001:4860:4860::8888"');
  });

  it('loads a shared IP configuration without losing unrelated URL parameters or the fragment', () => {
    window.history.replaceState(null, '', '/?country=USA&locationMode=ip&ipAddress=8.8.8.8&layout=text&dateMode=by&showCutoff=never&countryPicker=true&campaign=test#preview');
    reloadDemo();
    const config = init.mock.lastCall[0];
    expect(config).toMatchObject({ destinationCountry: 'USA', ipAddress: '8.8.8.8', ipFetch: true, dateMode: 'by', showCutoff: 'never', countryPicker: true });
    const request = new URL(document.querySelector('#sample-request').textContent.replace('GET ', ''), window.location.href);
    expect(request.searchParams.get('destination')).toBe('8.8.8.8');
    expect(request.searchParams.get('fallbackCountry')).toBe('USA');
    expect(document.querySelector('#sample-request-note').textContent).toContain('specified IP');
    expect(document.querySelector('#embed-code').textContent).toContain('data-ip-address="8.8.8.8"');
    expect(window.location.hash).toBe('#preview');
    expect(new URL(window.location.href).searchParams.get('campaign')).toBe('test');
  });

  it('restores presets, ignores invalid select values, and clears a manual IP when choosing a data preset', () => {
    window.history.replaceState(null, '', '/?dataPreset=ip-usa&presentationPreset=text-default&layout=invalid&ipAddress=8.8.8.8');
    reloadDemo();
    expect(init.mock.lastCall[0]).toMatchObject({ destinationCountry: 'USA', layout: 'text', zipPicker: 'none' });
    expect(document.querySelector('[data-preset="text-default"]').classList.contains('preset-active')).toBe(true);
    document.querySelector('[data-preset="ip-germany"]').click();
    expect(document.querySelector('#ip-address').value).toBe('');
    expect(new URL(window.location.href).searchParams.get('dataPreset')).toBe('ip-germany');
    expect(document.querySelector('#sample-request-note').textContent).toContain('preview uses your public IP');
  });

  it('uses a supplied IP in the API panel without looking up the public IP', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, statusText: 'OK', text: async () => '{"success":true}' });
    vi.stubGlobal('fetch', fetchMock);
    window.history.replaceState(null, '', '/?ipAddress=2001:4860:4860::8888&apiPanel=true');
    reloadDemo();
    await vi.waitFor(() => expect(document.querySelector('#api-response').textContent).toContain('success'));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const request = new URL(fetchMock.mock.calls[0][0]);
    expect(request.searchParams.get('destination')).toBe('2001:4860:4860::8888');
    expect(request.searchParams.get('fallbackCountry')).toBe('DEU');
    document.querySelector('#toggle-api-panel').click();
    expect(new URL(window.location.href).searchParams.get('apiPanel')).toBe('false');
    vi.unstubAllGlobals();
  });

  it('skips the API panel request when the widget rejects an invalid IP', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    vi.spyOn(console, 'error').mockImplementation(() => {});
    init.mockImplementationOnce(() => { throw new Error('Invalid ipAddress: bad'); });
    window.history.replaceState(null, '', '/?ipAddress=bad&apiPanel=true');
    reloadDemo();
    expect(document.querySelector('#api-response').textContent).toBe('Invalid ipAddress: bad');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('builds the embed URL from the current demo directory and uses the inline layout label', () => {
    window.history.replaceState(null, '', '/playground/promise-ui/pr-23/index.html?layout=text');
    reloadDemo();
    expect(document.querySelector('#embed-code').textContent).toContain(`${window.location.origin}/playground/promise-ui/pr-23/dist/promise.iife.js`);
    expect(document.querySelector('#layout option[value="text"]').textContent).toBe('Inline (PDP, cart)');
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
