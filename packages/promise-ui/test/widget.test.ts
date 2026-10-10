import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

function mockFetchResponse(body: unknown, status = 200) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  });
}

function makePrediction(overrides: Record<string, unknown> = {}) {
  return {
    id: 'DHL Standard',
    warehouse: 'EU-1',
    courier: 'dhl-germany',
    courierName: 'DHL',
    courierAlias: [],
    courierServiceLevel: ['home-delivery'],
    prediction: {
      min: 1,
      max: 3,
      likely: 2,
      send_date: '2026-04-12',
      earliest: '2026-04-13',
      latest: '2026-04-15',
      mostLikely: '2026-04-14',
      earliestLocale: 'Monday, Apr 13',
      latestLocale: 'Wednesday, Apr 15',
      mostLikelyLocale: 'Tuesday, Apr 14',
      cutoff: 120,
      cutoffLocale: '2 hours',
    },
    ...overrides,
  };
}

function expressPrediction() {
  return makePrediction({
    id: 'DHL Express',
    courier: 'dhl-express',
    courierName: 'DHL',
    courierServiceLevel: ['express'],
    prediction: {
      min: 1,
      max: 1,
      likely: 1,
      send_date: '2026-04-12',
      earliest: '2026-04-13',
      latest: '2026-04-13',
      mostLikely: '2026-04-13',
      earliestLocale: 'Monday, Apr 13',
      latestLocale: 'Monday, Apr 13',
      mostLikelyLocale: 'Monday, Apr 13',
      cutoff: 45,
      cutoffLocale: '45 minutes',
    },
  });
}

function successResponse(predictions = [makePrediction()]) {
  return {
    requestId: 'test-123',
    success: true,
    prediction: predictions,
  };
}

describe('DeliveryPromise Widget', () => {
  let container: HTMLElement;

  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
    container = document.createElement('div');
    container.id = 'test-target';
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('renders text layout by default with dateMode=from', async () => {
    globalThis.fetch = mockFetchResponse(successResponse());
    const { init } = await import('../src/index');
    const widget = init({
      target: container,
      accountId: 18,
      destinationCountry: 'DEU',
    });

    await vi.waitFor(() => {
      expect(container.textContent).toContain('Estimated delivery as early as');
      expect(container.textContent).toContain('Monday, Apr 13');
    });
    widget.destroy();
  });

  it('renders dateMode=range with both dates', async () => {
    globalThis.fetch = mockFetchResponse(successResponse());
    const { init } = await import('../src/index');
    const widget = init({
      target: container,
      accountId: 18,
      destinationCountry: 'DEU',
      dateMode: 'range',
    });

    await vi.waitFor(() => {
      expect(container.textContent).toContain('Estimated delivery');
      expect(container.textContent).toContain('Monday, Apr 13');
      expect(container.textContent).toContain('Wednesday, Apr 15');
    });
    widget.destroy();
  });

  it('collapses dateMode=range to a single date when earliest equals latest', async () => {
    globalThis.fetch = mockFetchResponse(successResponse([expressPrediction()]));
    const { init } = await import('../src/index');
    const widget = init({
      target: container,
      accountId: 18,
      destinationCountry: 'DEU',
      dateMode: 'range',
    });

    await vi.waitFor(() => {
      // Falls back to the "on" template — single date, no duplicated span.
      expect(container.textContent).toContain('Guaranteed delivery on');
      expect(container.textContent).toContain('Monday, Apr 13');
      expect(container.textContent).not.toMatch(/Monday, Apr 13\s*–/);
    });
    widget.destroy();
  });

  it('does not collapse range when ISO dates differ but format identically', async () => {
    // With relative format, two distinct past ISO dates can both render as
    // "Today". The collapse must look at ISO dates, not display strings.
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const twoDaysAgo = new Date(now);
    twoDaysAgo.setDate(now.getDate() - 2);
    const iso = (d: Date) => d.toISOString().slice(0, 10);

    const prediction = makePrediction({
      prediction: {
        min: 1, max: 3, likely: 2,
        send_date: iso(twoDaysAgo),
        earliest: iso(twoDaysAgo),
        latest: iso(yesterday),
        mostLikely: iso(yesterday),
        earliestLocale: 'two days ago',
        latestLocale: 'yesterday',
        mostLikelyLocale: 'yesterday',
        cutoff: 120,
        cutoffLocale: '2 hours',
      },
    });

    globalThis.fetch = mockFetchResponse(successResponse([prediction]));
    const { init } = await import('../src/index');
    const widget = init({
      target: container,
      accountId: 18,
      destinationCountry: 'DEU',
      dateMode: 'range',
      dateFormat: 'relative',
    });

    await vi.waitFor(() => {
      // Both dates fall back to short format ("relative" only kicks in for
      // 0–7 days in the future), but they remain distinct strings — the key
      // assertion is that we don't collapse to the "on" template.
      expect(container.textContent).not.toContain('delivery on');
      expect(container.textContent).toContain('Estimated delivery');
    });
    widget.destroy();
  });

  it('collapses card heading when range dates are equal', async () => {
    globalThis.fetch = mockFetchResponse(successResponse([expressPrediction()]));
    const { init } = await import('../src/index');
    const widget = init({
      target: container,
      accountId: 18,
      destinationCountry: 'DEU',
      dateMode: 'range',
      layout: 'card',
    });

    await vi.waitFor(() => {
      const heading = container.querySelector('.pl-promise__card-heading');
      const date = container.querySelector('.pl-promise__card-date');
      expect(heading?.textContent).toBe('Guaranteed arrival');
      expect(date?.textContent).toBe('Monday, Apr 13');
    });
    widget.destroy();
  });

  it('renders dateMode=on with most-likely date', async () => {
    globalThis.fetch = mockFetchResponse(successResponse());
    const { init } = await import('../src/index');
    const widget = init({
      target: container,
      accountId: 18,
      destinationCountry: 'DEU',
      dateMode: 'on',
    });

    await vi.waitFor(() => {
      expect(container.textContent).toContain('Estimated delivery on');
      expect(container.textContent).toContain('Tuesday, Apr 14');
    });
    widget.destroy();
  });

  it('renders deliver-to line for zip with dateMode=from', async () => {
    globalThis.fetch = mockFetchResponse(successResponse());
    const { init } = await import('../src/index');
    const widget = init({
      target: container,
      accountId: 18,
      destinationCountry: 'DEU',
      postalCode: '10038',
      zipPicker: 'inline',
      dateMode: 'from',
    });

    await vi.waitFor(() => {
      expect(container.textContent).toContain('Estimated delivery as early as');
      expect(container.textContent).toContain('Deliver to');
      expect(container.textContent).toContain('10038');
    });
    widget.destroy();
  });

  it('renders card layout with bold date and heading', async () => {
    globalThis.fetch = mockFetchResponse(successResponse());
    const { init } = await import('../src/index');
    const widget = init({
      target: container,
      accountId: 18,
      destinationCountry: 'DEU',
      layout: 'card',
      dateMode: 'on',
    });

    await vi.waitFor(() => {
      expect(container.querySelector('.pl-promise--layout-card')).not.toBeNull();
      expect(container.querySelector('.pl-promise__card')).not.toBeNull();
      expect(container.textContent).toContain('Tuesday, Apr 14');
      expect(container.textContent).toContain('Estimated');
    });
    widget.destroy();
  });

  it('renders badge layout as a compact pill', async () => {
    globalThis.fetch = mockFetchResponse(successResponse());
    const { init } = await import('../src/index');
    const widget = init({
      target: container,
      accountId: 18,
      destinationCountry: 'DEU',
      layout: 'badge',
      dateMode: 'on',
    });

    await vi.waitFor(() => {
      expect(container.querySelector('.pl-promise--layout-badge')).not.toBeNull();
      expect(container.querySelector('.pl-promise__badge')).not.toBeNull();
      expect(container.textContent).toContain('Tuesday, Apr 14');
    });
    widget.destroy();
  });

  it('requireZip without zip short-circuits to CTA without calling API', async () => {
    globalThis.fetch = mockFetchResponse(successResponse());
    const { init } = await import('../src/index');
    const widget = init({
      target: container,
      accountId: 18,
      destinationCountry: 'DEU',
      requireZip: true,
      zipPicker: 'inline',
    });

    await vi.waitFor(() => {
      expect(container.querySelector('.pl-promise__zip-inline')).not.toBeNull();
      expect(container.textContent).toContain('Add ZIP');
    });
    expect((globalThis.fetch as ReturnType<typeof vi.fn>)).not.toHaveBeenCalled();
    widget.destroy();
  });

  it('showCutoff=express-only hides cutoff on standard service', async () => {
    globalThis.fetch = mockFetchResponse(successResponse());
    const { init } = await import('../src/index');
    const widget = init({
      target: container,
      accountId: 18,
      destinationCountry: 'DEU',
      layout: 'card',
      showCutoff: 'express-only',
    });

    await vi.waitFor(() => {
      expect(container.querySelector('.pl-promise__card')).not.toBeNull();
    });
    expect(container.querySelector('.pl-promise__card-cutoff')).toBeNull();
    widget.destroy();
  });

  it('showCutoff=express-only shows cutoff on express service', async () => {
    globalThis.fetch = mockFetchResponse(
      successResponse([expressPrediction()]),
    );
    const { init } = await import('../src/index');
    const widget = init({
      target: container,
      accountId: 18,
      destinationCountry: 'DEU',
      layout: 'card',
      showCutoff: 'express-only',
    });

    await vi.waitFor(() => {
      expect(container.querySelector('.pl-promise__card-cutoff')).not.toBeNull();
      expect(container.textContent).toContain('Order within');
      expect(container.textContent).toContain('45 minutes');
    });
    widget.destroy();
  });

  it('selectionPick=earliest selects earliest most-likely date for primary', async () => {
    const predictions = [
      makePrediction({
        id: 'DHL Slow',
        courierName: 'DHL',
        prediction: {
          ...makePrediction().prediction,
          mostLikely: '2026-04-18',
          mostLikelyLocale: 'Saturday, Apr 18',
          earliest: '2026-04-16',
          earliestLocale: 'Thursday, Apr 16',
        },
      }),
      expressPrediction(),
    ];
    globalThis.fetch = mockFetchResponse(successResponse(predictions));
    const { init } = await import('../src/index');
    const widget = init({
      target: container,
      accountId: 18,
      destinationCountry: 'DEU',
      selectionPick: 'earliest',
    });

    await vi.waitFor(() => {
      expect(container.textContent).toContain('Monday, Apr 13');
    });
    widget.destroy();
  });

  it('zipPicker=inline with zip shows an editable button', async () => {
    globalThis.fetch = mockFetchResponse(successResponse());
    const { init } = await import('../src/index');
    const widget = init({
      target: container,
      accountId: 18,
      destinationCountry: 'DEU',
      postalCode: '10038',
      zipPicker: 'inline',
      dateMode: 'from',
    });

    await vi.waitFor(() => {
      expect(container.querySelector('.pl-promise__zip-inline')).not.toBeNull();
    });
    widget.destroy();
  });

  it('renders truck icon when icon=truck', async () => {
    globalThis.fetch = mockFetchResponse(successResponse());
    const { init } = await import('../src/index');
    const widget = init({
      target: container,
      accountId: 18,
      destinationCountry: 'DEU',
      icon: 'truck',
    });

    await vi.waitFor(() => {
      expect(container.querySelector('.pl-promise__summary-icon')).not.toBeNull();
    });
    widget.destroy();
  });

  it('hides icon when icon=none (default)', async () => {
    globalThis.fetch = mockFetchResponse(successResponse());
    const { init } = await import('../src/index');
    const widget = init({
      target: container,
      accountId: 18,
      destinationCountry: 'DEU',
    });

    await vi.waitFor(() => {
      expect(container.querySelector('.pl-promise__summary')).not.toBeNull();
    });
    expect(container.querySelector('.pl-promise__summary-icon')).toBeNull();
    widget.destroy();
  });

  it('renders carrier annotation when showCarrier=inline', async () => {
    globalThis.fetch = mockFetchResponse(successResponse());
    const { init } = await import('../src/index');
    const widget = init({
      target: container,
      accountId: 18,
      destinationCountry: 'DEU',
      showCarrier: 'inline',
    });

    await vi.waitFor(() => {
      expect(container.querySelector('.pl-promise__via')).not.toBeNull();
      expect(container.textContent).toContain('via DHL');
    });
    widget.destroy();
  });

  it('uses "Guaranteed" verb when confidence=guaranteed', async () => {
    globalThis.fetch = mockFetchResponse(successResponse());
    const { init } = await import('../src/index');
    const widget = init({
      target: container,
      accountId: 18,
      destinationCountry: 'DEU',
      confidence: 'guaranteed',
    });

    await vi.waitFor(() => {
      expect(container.textContent).toContain('Guaranteed delivery as early as');
    });
    widget.destroy();
  });

  it('confidence=auto uses Guaranteed for express services', async () => {
    globalThis.fetch = mockFetchResponse(successResponse([expressPrediction()]));
    const { init } = await import('../src/index');
    const widget = init({
      target: container,
      accountId: 18,
      destinationCountry: 'DEU',
    });

    await vi.waitFor(() => {
      expect(container.textContent).toContain('Guaranteed delivery as early as');
    });
    widget.destroy();
  });

  it('relative date format renders Today/Tomorrow/In N days', async () => {
    vi.setSystemTime(new Date('2026-04-12T08:00:00Z'));
    globalThis.fetch = mockFetchResponse(successResponse());
    const { init } = await import('../src/index');
    const widget = init({
      target: container,
      accountId: 18,
      destinationCountry: 'DEU',
      dateMode: 'from',
      dateFormat: 'relative',
    });

    await vi.waitFor(() => {
      // earliest is 2026-04-13 → tomorrow from 2026-04-12
      expect(container.textContent).toContain('Tomorrow');
    });
    widget.destroy();
    vi.useRealTimers();
  });

  it('dateFormat=longWithYear includes the year', async () => {
    globalThis.fetch = mockFetchResponse(successResponse());
    const { init } = await import('../src/index');
    const widget = init({
      target: container,
      accountId: 18,
      destinationCountry: 'DEU',
      dateFormat: 'longWithYear',
    });

    await vi.waitFor(() => {
      expect(container.textContent).toMatch(/2026/);
    });
    widget.destroy();
  });

  it('default dateFormat=long hides the year', async () => {
    globalThis.fetch = mockFetchResponse(successResponse());
    const { init } = await import('../src/index');
    const widget = init({
      target: container,
      accountId: 18,
      destinationCountry: 'DEU',
    });

    await vi.waitFor(() => {
      expect(container.textContent).toContain('Monday, Apr 13');
    });
    expect(container.textContent).not.toMatch(/2026/);
    widget.destroy();
  });

  it('shows static fallback when API errors and fallbackDays is configured', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
    const { init } = await import('../src/index');
    const widget = init({
      target: container,
      accountId: 18,
      destinationCountry: 'DEU',
      fallbackDays: [2, 3],
    });

    await vi.waitFor(() => {
      expect(container.textContent).toContain('Delivery in 2');
      expect(container.textContent).toContain('business days');
    });
    expect(container.textContent).not.toContain('Something went wrong');
    widget.destroy();
  });

  it('shows static fallback when API returns empty predictions', async () => {
    globalThis.fetch = mockFetchResponse({
      requestId: 't',
      success: true,
      prediction: [],
    });
    const { init } = await import('../src/index');
    const widget = init({
      target: container,
      accountId: 18,
      destinationCountry: 'DEU',
      fallbackDays: 3,
    });

    await vi.waitFor(() => {
      expect(container.textContent).toContain('Delivery in 3');
      expect(container.textContent).toContain('business days');
    });
    widget.destroy();
  });

  it('renders empty state on 404', async () => {
    globalThis.fetch = mockFetchResponse({}, 404);
    const { init } = await import('../src/index');
    const widget = init({
      target: container,
      accountId: 18,
      destinationCountry: 'DEU',
    });

    await vi.waitFor(() => {
      expect(container.textContent).toContain('Delivery estimate unavailable');
    });
    widget.destroy();
  });

  it('renders error state on network failure', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
    const { init } = await import('../src/index');
    const widget = init({
      target: container,
      accountId: 18,
      destinationCountry: 'DEU',
    });

    await vi.waitFor(() => {
      expect(container.textContent).toContain('Something went wrong');
    });
    widget.destroy();
  });

  it('auto-initializes from data attributes', async () => {
    container.setAttribute('data-promise', '');
    container.dataset.accountId = '18';
    container.dataset.country = 'DEU';
    container.dataset.postalCode = '80469';
    container.dataset.dateMode = 'by';
    globalThis.fetch = mockFetchResponse(successResponse());

    const { autoInit } = await import('../src/index');
    const widgets = autoInit(document.body);
    expect(widgets.length).toBe(1);
    await vi.waitFor(() => {
      expect(container.textContent).toContain('Estimated delivery by');
    });
    widgets[0]!.destroy();
  });

  it('updates widget on update()', async () => {
    globalThis.fetch = mockFetchResponse(successResponse());
    const { init } = await import('../src/index');
    const widget = init({
      target: container,
      accountId: 18,
      destinationCountry: 'DEU',
      locale: 'en',
    });

    await vi.waitFor(() => {
      expect(container.textContent).toContain('Estimated delivery as early as');
    });

    globalThis.fetch = mockFetchResponse(successResponse());
    await widget.update({ locale: 'de' });

    await vi.waitFor(() => {
      expect(container.textContent).toContain('Voraussichtliche Lieferung');
    });
    widget.destroy();
  });

  it('cleans up on destroy()', async () => {
    globalThis.fetch = mockFetchResponse(successResponse());
    const { init } = await import('../src/index');
    const widget = init({
      target: container,
      accountId: 18,
      destinationCountry: 'DEU',
    });

    await vi.waitFor(() => {
      expect(container.querySelector('.pl-promise')).not.toBeNull();
    });

    widget.destroy();
    expect(container.querySelector('.pl-promise')).toBeNull();
  });

  describe('location picker', () => {
    it.each([
      ['text', '81549', false], ['card', '81549', true], ['badge', '81549', false],
      ['text', '', true], ['card', '', false], ['badge', '', true],
    ] as const)('shows a ZIP picker in %s for ZIP=%s and countryPicker=%s', async (layout, postalCode, countryPicker) => {
      globalThis.fetch = mockFetchResponse(successResponse());
      const { init } = await import('../src/index');
      const widget = init({ target: container, accountId: 18, destinationCountry: 'DEU', postalCode, layout, zipPicker: 'inline', countryPicker });
      await vi.waitFor(() => expect(container.textContent).toContain('Monday, Apr 13'));
      expect(container.querySelector('.pl-promise__zip-inline')?.textContent).toBe(postalCode || 'Add ZIP');
      expect(!!container.querySelector('.pl-promise__country-select')).toBe(countryPicker);
      expect(container.querySelector<HTMLSelectElement>('.pl-promise__country-select')?.value).toBe(countryPicker ? 'DEU' : undefined);
      expect(container.querySelector('.pl-promise__country-inline > span')?.textContent).toBe(countryPicker ? 'Germany' : undefined);
      const request = new URL(vi.mocked(globalThis.fetch).mock.calls[0]![0] as string);
      expect(request.searchParams.get('destination')).toBe(postalCode ? '81549_DEU' : 'DEU');
      expect(request.searchParams.has('fallbackCountry')).toBe(false);
      (container.querySelector('.pl-promise__zip-inline') as HTMLButtonElement).click();
      expect(container.querySelector<HTMLInputElement>('.pl-promise__zip-input')?.value).toBe(postalCode);
      widget.destroy();
    });
  });

  describe('IP Fetch', () => {
    it.each(['8.8.8.8', '2001:4860:4860::8888'])('uses a specified IP %s without fetching the public IP', async (ipAddress) => {
      globalThis.fetch = mockFetchResponse({ ...successResponse(), location: { country: 'USA', region: 'US-NY', zip: '10038' } });
      const { init } = await import('../src/index');
      const widget = init({ target: container, accountId: 18, destinationCountry: 'DEU', ipFetch: true, ipAddress, zipPicker: 'inline' });
      await vi.waitFor(() => expect(container.textContent).toContain('10038'));
      expect(globalThis.fetch).toHaveBeenCalledTimes(1);
      const query = new URL(vi.mocked(globalThis.fetch).mock.calls[0]![0] as string).searchParams;
      expect(query.get('destination')).toBe(ipAddress);
      expect(query.get('fallbackCountry')).toBe('DEU');
      widget.destroy();
    });

    it.each(['disabled', 'zip'])('ignores a specified IP when %s takes priority', async (mode) => {
      globalThis.fetch = mockFetchResponse(successResponse());
      const { init } = await import('../src/index');
      const widget = init({ target: container, accountId: 18, destinationCountry: 'DEU', ipFetch: mode !== 'disabled', ipAddress: '8.8.8.8', postalCode: mode === 'zip' ? '81549' : '' });
      await vi.waitFor(() => expect(container.textContent).toContain('Estimated delivery'));
      expect(globalThis.fetch).toHaveBeenCalledTimes(1);
      const query = new URL(vi.mocked(globalThis.fetch).mock.calls[0]![0] as string).searchParams;
      expect(query.get('destination')).toBe(mode === 'zip' ? '81549_DEU' : 'DEU');
      expect(query.has('fallbackCountry')).toBe(false);
      widget.destroy();
    });

    it.each(['999.8.8.8', '01.2.3.4', '2001:::8888', 'example.com'])('rejects an invalid specified IP %s before making a request', async (ipAddress) => {
      globalThis.fetch = vi.fn();
      const { init } = await import('../src/index');
      expect(() => init({ target: container, accountId: 18, destinationCountry: 'DEU', ipFetch: true, ipAddress })).toThrow('Invalid ipAddress');
      expect(globalThis.fetch).not.toHaveBeenCalled();
    });

    it.each([false, true])('resolves a changed IP after a manual country selection=%s', async (manualCountry) => {
      const fetchMock = mockFetchResponse({ ...successResponse(), location: { country: 'USA', region: 'US-NY', zip: '10038' } });
      globalThis.fetch = fetchMock;
      const { init } = await import('../src/index');
      const widget = init({ target: container, accountId: 18, destinationCountry: 'DEU', ipFetch: true, ipAddress: '8.8.8.8', zipPicker: 'inline' });
      await vi.waitFor(() => expect(container.textContent).toContain('10038'));
      if (manualCountry) await widget.update({ destinationCountry: 'DEU', postalCode: '' });
      fetchMock.mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ ...successResponse(), location: { country: 'DEU', region: 'DE-BY', zip: '81371' } }) });
      await widget.update({ ipAddress: '1.1.1.1' });
      expect(container.textContent).toContain('81371');
      expect(new URL(fetchMock.mock.lastCall![0]).searchParams.get('destination')).toBe('1.1.1.1');
      widget.destroy();
    });

    it('reads a specified IP from HTML attributes', async () => {
      globalThis.fetch = mockFetchResponse({ ...successResponse(), location: { country: 'USA', region: 'US-NY', zip: '10038' } });
      Object.assign(container.dataset, { promise: '', accountId: '18', country: 'DEU', ipFetch: 'true', ipAddress: '8.8.8.8', zipPicker: 'inline' });
      const { autoInit } = await import('../src/index');
      const [widget] = autoInit(document.body);
      await vi.waitFor(() => expect(container.textContent).toContain('10038'));
      expect(globalThis.fetch).toHaveBeenCalledTimes(1);
      expect(new URL(vi.mocked(globalThis.fetch).mock.calls[0]![0] as string).searchParams.get('destination')).toBe('8.8.8.8');
      widget!.destroy();
    });

    const location = { country: 'USA', region: 'US-NY', zip: '10038' };

    function mockIpFetch(resolvedLocation: unknown = location) {
      return vi.fn().mockImplementation(async (url: string) => ({
        ok: true,
        status: 200,
        json: async () => url.includes('ipify.org')
          ? { ip: '2001:4860:4860::8888' }
          : { ...successResponse(), location: resolvedLocation },
      }));
    }

    it.each(['ready', 'required', 'empty', 'error'])('keeps the country and empty ZIP action separate in the %s state', async (state) => {
      const resolvedLocation = { country: 'USA', region: 'US', zip: null };
      const fetchMock = mockIpFetch(resolvedLocation);
      fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ ip: '8.8.8.8' }) });
      fetchMock.mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({
        ...successResponse(state === 'empty' ? [] : undefined),
        ...(state === 'error' ? { success: false, error: 'Prediction failed', prediction: [] } : {}),
        location: resolvedLocation,
      }) });
      globalThis.fetch = fetchMock;
      const { init } = await import('../src/index');
      const widget = init({ target: container, accountId: 18, destinationCountry: 'USA', ipFetch: true, zipPicker: 'inline', countryPicker: true, requireZip: state === 'required' });
      await vi.waitFor(() => expect(container.querySelector('.pl-promise__location-estimated')).not.toBeNull());
      const line = container.querySelector('.pl-promise__deliver-to')!.cloneNode(true) as HTMLElement;
      line.querySelector('select')!.remove();
      expect(line.textContent).toBe('Deliver to United States · Add ZIP');
      (container.querySelector('.pl-promise__zip-inline') as HTMLButtonElement).click();
      const input = container.querySelector<HTMLInputElement>('.pl-promise__zip-input')!;
      expect(input.value).toBe('');
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      const restored = container.querySelector('.pl-promise__deliver-to')!.cloneNode(true) as HTMLElement;
      restored.querySelector('select')!.remove();
      expect(restored.textContent).toBe('Deliver to United States · Add ZIP');
      widget.destroy();
    });

    it('uses the configured country as the IP fallback', async () => {
      globalThis.fetch = mockIpFetch();
      const { resolveConfig } = await import('../src/config');
      const { fetchPrediction } = await import('../src/api');
      const config = resolveConfig({ target: container, accountId: 18, destinationCountry: ' deu ', ipFetch: true });
      await fetchPrediction(config, new AbortController().signal, '8.8.8.8');
      const request = new URL(vi.mocked(globalThis.fetch).mock.calls[0]![0] as string);
      expect(request.searchParams.get('destination')).toBe('8.8.8.8');
      expect(request.searchParams.get('fallbackCountry')).toBe('DEU');
    });

    it.each(['postal', 'country', 'ip'])('hides the whole location picker for a %s request while keeping its destination', async (mode) => {
      const fetchMock = mockIpFetch();
      globalThis.fetch = fetchMock;
      const { init } = await import('../src/index');
      const widget = init({
        target: container, accountId: 18, destinationCountry: 'DEU',
        postalCode: mode === 'postal' ? '81549' : '', ipFetch: mode === 'ip',
        zipPicker: 'none', countryPicker: true, requireZip: true,
      });
      await vi.waitFor(() => expect(container.textContent).toContain('Estimated delivery'));
      expect(container.querySelector('.pl-promise__deliver-to')).toBeNull();
      expect(container.querySelector('.pl-promise__zip-inline')).toBeNull();
      expect(container.querySelector('.pl-promise__country-select')).toBeNull();
      expect(container.querySelector('.pl-promise__location-estimated')).toBeNull();
      const request = new URL(fetchMock.mock.calls[mode === 'ip' ? 1 : 0]![0]);
      expect(request.searchParams.get('destination')).toBe(mode === 'postal' ? '81549_DEU' : mode === 'ip' ? '2001:4860:4860::8888' : 'DEU');
      expect(request.searchParams.get('fallbackCountry')).toBe(mode === 'ip' ? 'DEU' : null);
      await widget.refresh();
      if (mode === 'ip') expect(new URL(fetchMock.mock.calls[2]![0]).searchParams.get('destination')).toBe('10038_USA');
      widget.destroy();
    });

    it('keeps the response location when prediction generation fails', async () => {
      const fetchMock = mockIpFetch();
      fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ ip: '8.8.8.8' }) });
      fetchMock.mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ success: false, error: 'Prediction failed', location, prediction: [] }) });
      globalThis.fetch = fetchMock;
      const { init } = await import('../src/index');
      const widget = init({ target: container, accountId: 18, destinationCountry: 'DEU', ipFetch: true, zipPicker: 'inline', countryPicker: true });
      await vi.waitFor(() => expect(container.textContent).toContain('Something went wrong'));
      expect(container.querySelector('.pl-promise__zip-inline')?.textContent).toBe('10038');
      expect(container.querySelector<HTMLSelectElement>('.pl-promise__country-select')?.value).toBe('USA');
      expect(container.querySelector('.pl-promise__location-estimated')).not.toBeNull();
      widget.destroy();
    });

    it.each(['8.8.8.8', '2001:4860:4860::8888'])('sends the configured country as fallback with IP destination %s', async (ip) => {
      const fetchMock = mockIpFetch();
      globalThis.fetch = fetchMock;
      const { resolveConfig } = await import('../src/config');
      const { fetchPrediction } = await import('../src/api');
      const config = resolveConfig({ target: container, accountId: 18, destinationCountry: ' usa ', ipFetch: true });
      await fetchPrediction(config, new AbortController().signal, ip);
      const request = new URL(fetchMock.mock.calls[0]![0]);
      expect(request.searchParams.get('destination')).toBe(ip);
      expect(request.searchParams.get('fallbackCountry')).toBe('USA');
    });

    it.each(['postal', 'country', 'disabled'])('omits fallbackCountry for a %s request', async (kind) => {
      const fetchMock = mockIpFetch();
      globalThis.fetch = fetchMock;
      const { resolveConfig } = await import('../src/config');
      const { fetchPrediction } = await import('../src/api');
      const config = resolveConfig({
        target: container, accountId: 18, destinationCountry: 'DEU', ipFetch: kind !== 'disabled',
        ...(kind === 'postal' ? { postalCode: '81549' } : {}),
      });
      await fetchPrediction(config, new AbortController().signal, kind === 'country' ? '' : '8.8.8.8');
      const request = new URL(fetchMock.mock.calls[0]![0]);
      expect(request.searchParams.has('fallbackCountry')).toBe(false);
    });

    it.each([false, true])('shows the Backend-selected country with empty predictions=%s', async (empty) => {
      const fetchMock = mockIpFetch({ country: 'USA', region: 'US', zip: null });
      if (empty) {
        fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ ip: '8.8.8.8' }) });
        fetchMock.mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ ...successResponse([]), location: { country: 'USA', region: 'US', zip: null } }) });
      }
      globalThis.fetch = fetchMock;
      const { init } = await import('../src/index');
      const widget = init({ target: container, accountId: 18, destinationCountry: 'USA', ipFetch: true, zipPicker: 'inline', countryPicker: true });
      await vi.waitFor(() => expect(container.querySelector('.pl-promise__location-estimated')).not.toBeNull());
      await vi.waitFor(() => expect(container.querySelector<HTMLSelectElement>('.pl-promise__country-select')?.value).toBe('USA'));
      expect(container.querySelector('.pl-promise__location-estimated')?.getAttribute('aria-label')).toBe('Approximate location based on your IP data or default country');
      expect(fetchMock).toHaveBeenCalledTimes(2);
      await widget.refresh();
      const request = new URL(fetchMock.mock.calls[2]![0]);
      expect(request.searchParams.get('destination')).toBe('USA');
      expect(request.searchParams.has('fallbackCountry')).toBe(false);
      widget.destroy();
    });

    it('keeps a usable IP location in a different country from the configured country', async () => {
      const fetchMock = mockIpFetch();
      globalThis.fetch = fetchMock;
      const { init } = await import('../src/index');
      const widget = init({ target: container, accountId: 18, destinationCountry: 'FRA', ipFetch: true, zipPicker: 'inline' });
      await vi.waitFor(() => expect(container.textContent).toContain('10038 United States'));
      expect(new URL(fetchMock.mock.calls[1]![0]).searchParams.get('fallbackCountry')).toBe('FRA');
      widget.destroy();
    });

    it('uses an explicit country update instead of the previous IP estimate', async () => {
      const fetchMock = mockIpFetch();
      globalThis.fetch = fetchMock;
      const { init } = await import('../src/index');
      const widget = init({ target: container, accountId: 18, destinationCountry: 'USA', ipFetch: true, zipPicker: 'inline' });
      await vi.waitFor(() => expect(container.querySelector('.pl-promise__location-estimated')).not.toBeNull());
      await widget.update({ destinationCountry: 'FRA' });
      const request = new URL(fetchMock.mock.calls[2]![0]);
      expect(request.searchParams.get('destination')).toBe('FRA');
      expect(request.searchParams.has('fallbackCountry')).toBe(false);
      expect(fetchMock).toHaveBeenCalledTimes(3);
      expect(container.querySelector('.pl-promise__location-estimated')).toBeNull();
      widget.destroy();
    });

    it('keeps prediction cache entries separate for different fallback countries', async () => {
      const fetchMock = mockIpFetch();
      globalThis.fetch = fetchMock;
      const { resolveConfig } = await import('../src/config');
      const { fetchPrediction } = await import('../src/api');
      const config = resolveConfig({ target: container, accountId: 18, destinationCountry: 'USA', ipFetch: true });
      const signal = new AbortController().signal;
      await fetchPrediction(config, signal, '8.8.8.8');
      await fetchPrediction({ ...config, destinationCountry: 'FRA' }, signal, '8.8.8.8');
      await fetchPrediction(config, signal, '8.8.8.8');
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('uses the fallback country with an empty ZIP when IP resolution fails', async () => {
      const fetchMock = mockIpFetch();
      fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ ip: '8.8.8.8' }) });
      fetchMock.mockResolvedValueOnce({ ok: false, status: 404, json: async () => ({ location: null }) });
      fetchMock.mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ ...successResponse(), location: { country: 'USA', region: 'US', zip: null } }) });
      globalThis.fetch = fetchMock;
      const { init } = await import('../src/index');
      const widget = init({ target: container, accountId: 18, destinationCountry: 'USA', ipFetch: true, zipPicker: 'inline', countryPicker: true });
      await vi.waitFor(() => expect(container.querySelector<HTMLSelectElement>('.pl-promise__country-select')?.value).toBe('USA'));
      await vi.waitFor(() => expect(container.querySelector('.pl-promise__summary')).not.toBeNull());
      expect(fetchMock).toHaveBeenCalledTimes(3);
      expect(new URL(fetchMock.mock.calls[2]![0]).searchParams.get('destination')).toBe('USA');
      (container.querySelector('.pl-promise__zip-inline') as HTMLButtonElement).click();
      const input = container.querySelector<HTMLInputElement>('.pl-promise__zip-input')!;
      expect(input.value).toBe('');
      input.value = '10001';
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
      await vi.waitFor(() => expect(container.textContent).toContain('Estimated delivery'));
      expect(new URL(fetchMock.mock.calls[3]![0]).searchParams.get('destination')).toBe('10001_USA');
      widget.destroy();
    });

    it.each([undefined, false])('does not look up or submit an IP when ipFetch=%s', async (ipFetch) => {
      const fetchMock = mockIpFetch();
      globalThis.fetch = fetchMock;
      const { init } = await import('../src/index');
      const widget = init({ target: container, accountId: 18, destinationCountry: 'DEU', ...(ipFetch === undefined ? {} : { ipFetch }) });
      await widget.refresh();
      expect(fetchMock.mock.calls.every(([url]) => !url.includes('ipify.org') && !url.includes('destination_ip'))).toBe(true);
      expect(container.querySelector('.pl-promise__location-estimated')).toBeNull();
      widget.destroy();
    });

    it.each(['text', 'card', 'badge'] as const)('shows and reuses the estimated location in the %s layout', async (layout) => {
      const fetchMock = mockIpFetch();
      globalThis.fetch = fetchMock;
      const { init } = await import('../src/index');
      const widget = init({ target: container, accountId: 18, destinationCountry: 'DEU', ipFetch: true, layout, zipPicker: 'inline' });
      await vi.waitFor(() => expect(container.textContent).toContain('10038 United States'));
      const marker = container.querySelector('.pl-promise__location-estimated')!;
      expect(marker.getAttribute('aria-label')).toBe('Approximate location based on your IP data or default country');
      expect(marker.getAttribute('title')).toBe('Approximate location based on your IP data or default country');
      expect(marker.querySelector('svg')).not.toBeNull();
      const ipRequest = new URL(fetchMock.mock.calls[1]![0]);
      expect(ipRequest.pathname).toBe('/v2/prediction');
      expect(ipRequest.searchParams.toString()).toBe(new URLSearchParams({ user: '18', destination: '2001:4860:4860::8888', fallbackCountry: 'DEU', lang: 'en' }).toString());
      expect(localStorage.getItem('pl-promise-zip')).toBeNull();

      await widget.refresh();
      const explicitRequest = new URL(fetchMock.mock.calls[2]![0]);
      expect(explicitRequest.searchParams.get('destination')).toBe('10038_USA');
      expect(container.querySelector('.pl-promise__location-estimated')).not.toBeNull();
      widget.destroy();
    });

    it('uses a shopper correction with the resolved country and removes the estimate marker', async () => {
      const fetchMock = mockIpFetch();
      globalThis.fetch = fetchMock;
      const { init } = await import('../src/index');
      const widget = init({ target: container, accountId: 18, destinationCountry: 'DEU', ipFetch: true, zipPicker: 'inline' });
      await vi.waitFor(() => expect(container.querySelector('.pl-promise__zip-inline')?.textContent).toBe('10038'));
      (container.querySelector('.pl-promise__zip-inline') as HTMLButtonElement).click();
      const input = container.querySelector('.pl-promise__zip-input') as HTMLInputElement;
      expect(input.value).toBe('10038');
      input.value = '10001';
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
      await vi.waitFor(() => expect(container.textContent).toContain('Estimated delivery'));
      expect(container.querySelector('.pl-promise__location-estimated')).toBeNull();
      expect(JSON.parse(localStorage.getItem('pl-promise-zip')!)).toEqual({ postalCode: '10001', destinationCountry: 'USA' });
      const request = new URL(fetchMock.mock.calls[2]![0]);
      expect(request.searchParams.get('destination')).toBe('10001_USA');
      widget.destroy();

      const restored = init({ target: container, accountId: 18, destinationCountry: 'DEU', ipFetch: true, zipPicker: 'inline' });
      await vi.waitFor(() => expect(container.textContent).toContain('10001'));
      expect(fetchMock).toHaveBeenCalledTimes(3);
      expect(container.querySelector('.pl-promise__location-estimated')).toBeNull();
      restored.destroy();
    });

    it.each(['configured', 'saved'])('skips IP Fetch for a %s postal code', async (source) => {
      if (source === 'saved') localStorage.setItem('pl-promise-zip', '80469');
      const fetchMock = mockIpFetch();
      globalThis.fetch = fetchMock;
      const { init } = await import('../src/index');
      const widget = init({ target: container, accountId: 18, destinationCountry: 'DEU', ipFetch: true, zipPicker: 'inline', ...(source === 'configured' ? { postalCode: '80469' } : {}) });
      await vi.waitFor(() => expect(container.textContent).toContain('80469'));
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(new URL(fetchMock.mock.calls[0]![0]).searchParams.get('destination')).toBe('80469_DEU');
      expect(container.querySelector('.pl-promise__location-estimated')).toBeNull();
      widget.destroy();
    });

    it('tries IP Fetch before requireZip prompts for a postal code', async () => {
      globalThis.fetch = mockIpFetch();
      const { init } = await import('../src/index');
      const widget = init({ target: container, accountId: 18, destinationCountry: 'DEU', ipFetch: true, zipPicker: 'inline', requireZip: true });
      await vi.waitFor(() => expect(container.textContent).toContain('10038 United States'));
      expect(container.querySelector('.pl-promise__link')).toBeNull();
      widget.destroy();
    });

    it.each([null, '0'])('shows the country when the resolved postal code is %s', async (zip) => {
      globalThis.fetch = mockIpFetch({ ...location, zip });
      const { init } = await import('../src/index');
      const widget = init({ target: container, accountId: 18, destinationCountry: 'DEU', ipFetch: true, zipPicker: 'inline' });
      await vi.waitFor(() => expect(container.textContent).toContain('United States'));
      expect(container.querySelector('.pl-promise__location-estimated')).not.toBeNull();
      widget.destroy();
    });

    it('keeps requireZip active when IP resolution has no postal code', async () => {
      globalThis.fetch = mockIpFetch({ ...location, zip: null });
      const { init } = await import('../src/index');
      const widget = init({ target: container, accountId: 18, destinationCountry: 'DEU', ipFetch: true, zipPicker: 'inline', requireZip: true });
      await vi.waitFor(() => expect(container.querySelector('.pl-promise__location-estimated')).not.toBeNull());
      expect(container.querySelector('.pl-promise__summary')).toBeNull();
      expect(container.textContent).toContain('United States');
      expect(container.querySelector('.pl-promise__location-estimated')).not.toBeNull();
      widget.destroy();
    });

    it('shows the resolved location even when no delivery prediction is available', async () => {
      const fetchMock = mockIpFetch();
      fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ ip: '8.8.8.8' }) });
      fetchMock.mockResolvedValueOnce({ ok: false, status: 404, json: async () => ({ success: false, location, error: 'Nothing found.' }) });
      globalThis.fetch = fetchMock;
      const { init } = await import('../src/index');
      const widget = init({ target: container, accountId: 18, destinationCountry: 'DEU', ipFetch: true, zipPicker: 'inline' });
      await vi.waitFor(() => expect(container.textContent).toContain('10038 United States'));
      expect(container.querySelector('.pl-promise__location-estimated')).not.toBeNull();
      expect(fetchMock).toHaveBeenCalledTimes(2);
      widget.destroy();
    });

    it.each([undefined, 3])('keeps the resolved location with empty predictions and fallbackDays=%s', async (fallbackDays) => {
      const fetchMock = mockIpFetch();
      fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ ip: '8.8.8.8' }) });
      fetchMock.mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ ...successResponse([]), location }) });
      globalThis.fetch = fetchMock;
      const { init } = await import('../src/index');
      const widget = init({ target: container, accountId: 18, destinationCountry: 'DEU', ipFetch: true, zipPicker: 'inline', ...(fallbackDays === undefined ? {} : { fallbackDays }) });
      await vi.waitFor(() => expect(container.textContent).toContain('10038 United States'));
      expect(container.querySelector(fallbackDays ? '.pl-promise__summary' : '.pl-promise__state')).not.toBeNull();
      expect(container.querySelector('.pl-promise__location-estimated')).not.toBeNull();
      widget.destroy();
    });

    it('ignores a malformed location from IP resolution', async () => {
      globalThis.fetch = mockIpFetch({ country: 'USA', zip: 10038 });
      const { init } = await import('../src/index');
      const widget = init({ target: container, accountId: 18, destinationCountry: 'DEU', ipFetch: true, zipPicker: 'inline' });
      await vi.waitFor(() => expect(container.querySelector('.pl-promise__summary')).not.toBeNull());
      expect(container.querySelector('.pl-promise__location-estimated')).toBeNull();
      widget.destroy();
    });

    it('lets the shopper change the inferred country and keeps that selection on refresh and reload', async () => {
      const fetchMock = mockIpFetch();
      globalThis.fetch = fetchMock;
      const { init } = await import('../src/index');
      const widget = init({ target: container, accountId: 18, destinationCountry: 'DEU', ipFetch: true, countryPicker: true, zipPicker: 'inline' });
      await vi.waitFor(() => expect(container.querySelector<HTMLSelectElement>('.pl-promise__country-select')?.value).toBe('USA'));
      const picker = container.querySelector<HTMLSelectElement>('.pl-promise__country-select')!;
      expect(picker.getAttribute('aria-label')).toBe('Delivery country');
      expect(picker.querySelector('option[value="DEU"]')?.textContent).toBe('Germany');
      expect(container.querySelector('.pl-promise__country-inline > span')?.textContent).toBe('United States');
      expect(picker.options.length).toBe(250);
      picker.value = 'FRA';
      picker.dispatchEvent(new Event('change'));
      await vi.waitFor(() => expect(container.querySelector<HTMLSelectElement>('.pl-promise__country-select')?.value).toBe('FRA'));
      expect(container.querySelector('.pl-promise__country-inline > span')?.textContent).toBe('France');
      await vi.waitFor(() => expect(container.querySelector('.pl-promise__summary')).not.toBeNull());
      expect(new URL(fetchMock.mock.calls[2]![0]).searchParams.get('destination')).toBe('FRA');
      expect(container.querySelector('.pl-promise__location-estimated')).toBeNull();
      expect(container.textContent).not.toContain('10038');
      expect(JSON.parse(localStorage.getItem('pl-promise-zip')!)).toEqual({ postalCode: '', destinationCountry: 'FRA' });
      await widget.refresh();
      expect(fetchMock).toHaveBeenCalledTimes(3);
      widget.destroy();

      const restored = init({ target: container, accountId: 18, destinationCountry: 'DEU', ipFetch: true, zipPicker: 'inline', countryPicker: true });
      await vi.waitFor(() => expect(container.querySelector<HTMLSelectElement>('.pl-promise__country-select')?.value).toBe('FRA'));
      expect(fetchMock).toHaveBeenCalledTimes(3);
      restored.destroy();
    });

    it('localizes country names and allows selection while a postal code is required', async () => {
      globalThis.fetch = mockIpFetch();
      const { init } = await import('../src/index');
      const widget = init({ target: container, accountId: 18, destinationCountry: 'DEU', countryPicker: true, requireZip: true, zipPicker: 'inline', locale: 'de' });
      const picker = container.querySelector<HTMLSelectElement>('.pl-promise__country-select')!;
      expect(picker.querySelector('option[value="DEU"]')?.textContent).toBe('Deutschland');
      expect(container.querySelector('.pl-promise__country-inline > span')?.textContent).toBe('Deutschland');
      expect(picker.getAttribute('aria-label')).toBe('Lieferland');
      picker.value = 'AUT';
      picker.dispatchEvent(new Event('change'));
      await vi.waitFor(() => expect(container.querySelector<HTMLSelectElement>('.pl-promise__country-select')?.value).toBe('AUT'));
      expect(globalThis.fetch).not.toHaveBeenCalled();
      (container.querySelector('.pl-promise__zip-inline') as HTMLButtonElement).click();
      const input = container.querySelector<HTMLInputElement>('.pl-promise__zip-input')!;
      input.value = '1010';
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
      await vi.waitFor(() => expect(container.textContent).toContain('1010'));
      expect(new URL(vi.mocked(globalThis.fetch).mock.calls[0]![0] as string).searchParams.get('destination')).toBe('1010_AUT');
      widget.destroy();
    });

    it('keeps the estimate on presentation updates and clears it when IP Fetch is disabled', async () => {
      const fetchMock = mockIpFetch();
      globalThis.fetch = fetchMock;
      const { init } = await import('../src/index');
      const widget = init({ target: container, accountId: 18, destinationCountry: 'DEU', ipFetch: true, zipPicker: 'inline' });
      await vi.waitFor(() => expect(container.textContent).toContain('10038 United States'));
      await widget.update({ locale: 'de' });
      expect(container.querySelector('.pl-promise__location-estimated')?.getAttribute('aria-label')).toBe('Ungefährer Standort anhand Ihrer IP-Daten oder des Standardlands');
      await widget.update({ ipFetch: false });
      expect(container.querySelector('.pl-promise__location-estimated')).toBeNull();
      const request = new URL(fetchMock.mock.calls[fetchMock.mock.calls.length - 1]![0]);
      expect(request.searchParams.toString()).toBe('user=18&destination=DEU&lang=de');
      widget.destroy();
    });

    it.each([false, true])('uses the fallback country after a public IP lookup failure with requireZip=%s', async (requireZip) => {
      const fetchMock = mockIpFetch({ country: 'USA', region: '', zip: null });
      fetchMock.mockRejectedValueOnce(new Error('IP lookup failed'));
      globalThis.fetch = fetchMock;
      const { init } = await import('../src/index');
      const widget = init({ target: container, accountId: 18, destinationCountry: 'USA', ipFetch: true, zipPicker: 'inline', countryPicker: true, requireZip });
      await vi.waitFor(() => expect(container.querySelector('.pl-promise__location-estimated')).not.toBeNull());
      expect(container.querySelector<HTMLSelectElement>('.pl-promise__country-select')?.value).toBe('USA');
      expect(fetchMock).toHaveBeenCalledTimes(requireZip ? 1 : 2);
      if (!requireZip) expect(new URL(fetchMock.mock.calls[1]![0]).searchParams.get('destination')).toBe('USA');
      (container.querySelector('.pl-promise__zip-inline') as HTMLButtonElement).click();
      const input = container.querySelector<HTMLInputElement>('.pl-promise__zip-input')!;
      expect(input.value).toBe('');
      input.value = '10001';
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
      await vi.waitFor(() => expect(container.textContent).toContain('Estimated delivery'));
      expect(new URL(fetchMock.mock.calls[fetchMock.mock.calls.length - 1]![0]).searchParams.get('destination')).toBe('10001_USA');
      widget.destroy();
    });

    it('ties ZIP edits during IP lookup to the country shown in the picker', async () => {
      let finishIp!: (value: unknown) => void;
      let ipSignal!: AbortSignal;
      const fetchMock = mockIpFetch();
      fetchMock.mockImplementationOnce((_url, options) => new Promise((resolve) => { finishIp = resolve; ipSignal = options.signal; }));
      globalThis.fetch = fetchMock;
      const { init } = await import('../src/index');
      const widget = init({ target: container, accountId: 18, destinationCountry: 'USA', ipFetch: true, zipPicker: 'inline', countryPicker: true });
      expect(container.querySelector<HTMLSelectElement>('.pl-promise__country-select')?.value).toBe('USA');
      (container.querySelector('.pl-promise__zip-inline') as HTMLButtonElement).click();
      const input = container.querySelector<HTMLInputElement>('.pl-promise__zip-input')!;
      input.value = '10001';
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
      await vi.waitFor(() => expect(container.textContent).toContain('Estimated delivery'));
      expect(new URL(fetchMock.mock.calls[1]![0]).searchParams.get('destination')).toBe('10001_USA');
      expect(ipSignal.aborted).toBe(true);
      finishIp({ ok: true, json: async () => ({ ip: '8.8.8.8' }) });
      await widget.refresh();
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(container.querySelector('.pl-promise__zip-inline')?.textContent).toBe('10001');
      expect(container.querySelector('.pl-promise__location-estimated')).toBeNull();
      widget.destroy();
    });

    it('retries the configured country if Promise cannot resolve the IP', async () => {
      const fetchMock = mockIpFetch();
      fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ ip: '8.8.8.8' }) });
      fetchMock.mockResolvedValueOnce({ ok: false, status: 404, json: async () => ({ location: null }) });
      fetchMock.mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ ...successResponse(), location: { country: 'DEU', region: 'DE', zip: null } }) });
      globalThis.fetch = fetchMock;
      const { init } = await import('../src/index');
      const widget = init({ target: container, accountId: 18, destinationCountry: 'DEU', ipFetch: true, zipPicker: 'inline' });
      await vi.waitFor(() => expect(container.textContent).toContain('Estimated delivery'));
      expect(fetchMock).toHaveBeenCalledTimes(3);
      expect(new URL(fetchMock.mock.calls[2]![0]).searchParams.get('destination')).toBe('DEU');
      expect(container.querySelector('.pl-promise__location-estimated')).not.toBeNull();
      widget.destroy();
    });

    it('does not apply an old IP lookup after a destination update', async () => {
      let finishIp!: (value: unknown) => void;
      const fetchMock = mockIpFetch();
      fetchMock.mockImplementationOnce(() => new Promise((resolve) => { finishIp = resolve; }));
      globalThis.fetch = fetchMock;
      const { init } = await import('../src/index');
      const widget = init({ target: container, accountId: 18, destinationCountry: 'DEU', ipFetch: true, zipPicker: 'inline' });
      await widget.update({ destinationCountry: 'FRA', postalCode: '75001' });
      finishIp({ ok: true, json: async () => ({ ip: '8.8.8.8' }) });
      await vi.waitFor(() => expect(container.textContent).toContain('75001'));
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(container.querySelector('.pl-promise__location-estimated')).toBeNull();
      widget.destroy();
    });

    it('reads the opt-in setting from HTML attributes', async () => {
      globalThis.fetch = mockIpFetch();
      container.dataset.promise = '';
      container.dataset.accountId = '18';
      container.dataset.country = 'FRA';
      container.dataset.ipFetch = 'true';
      container.dataset.zipPicker = 'inline';
      container.dataset.countryPicker = 'true';
      const { autoInit } = await import('../src/index');
      const [widget] = autoInit(document.body);
      await vi.waitFor(() => expect(container.querySelector<HTMLSelectElement>('.pl-promise__country-select')?.value).toBe('USA'));
      expect(container.textContent).toContain('10038');
      expect(new URL(vi.mocked(globalThis.fetch).mock.calls[1]![0] as string).searchParams.get('fallbackCountry')).toBe('FRA');
      widget!.destroy();
    });

    it('does not share prediction cache entries between IP and explicit destinations', async () => {
      const fetchMock = mockIpFetch();
      globalThis.fetch = fetchMock;
      const { resolveConfig } = await import('../src/config');
      const { fetchPrediction } = await import('../src/api');
      const config = resolveConfig({ target: container, accountId: 18, destinationCountry: 'DEU', ipFetch: true });
      const signal = new AbortController().signal;
      await fetchPrediction(config, signal, '8.8.8.8');
      await fetchPrediction(config, signal, '1.1.1.1');
      await fetchPrediction({ ...config, ipFetch: false }, signal);
      await fetchPrediction(config, signal, '8.8.8.8');
      expect(fetchMock).toHaveBeenCalledTimes(3);
    });

    it('uses the Backend query names for explicit destinations and filters', async () => {
      const fetchMock = mockIpFetch();
      globalThis.fetch = fetchMock;
      const { resolveConfig } = await import('../src/config');
      const { fetchPrediction } = await import('../src/api');
      const config = resolveConfig({
        target: container, accountId: 18, destinationCountry: 'DEU', postalCode: '81549',
        courier: 'dhl-germany', serviceLevel: 'home-delivery', warehouse: 'EU-1',
        calibration: 'balanced', locale: 'de', draft: true, tag: 'pdp', ipFetch: true,
      });
      await fetchPrediction(config, new AbortController().signal, '8.8.8.8');
      const request = new URL(fetchMock.mock.calls[0]![0]);
      expect(request.pathname).toBe('/v2/prediction');
      expect(request.searchParams.toString()).toBe(new URLSearchParams({
        user: '18', destination: '81549_DEU', courier: 'dhl-germany',
        courierServiceLevel: 'home-delivery', warehouse: 'EU-1', calibration: 'balanced',
        lang: 'de', draft: 'true', tag: 'pdp',
      }).toString());
    });

    it('reads a Backend validation error', async () => {
      globalThis.fetch = mockFetchResponse({ success: false, error: 'Invalid destination parameter' }, 400);
      const { resolveConfig } = await import('../src/config');
      const { fetchPrediction } = await import('../src/api');
      const config = resolveConfig({ target: container, accountId: 18, destinationCountry: 'DEU' });
      await expect(fetchPrediction(config, new AbortController().signal)).rejects.toMatchObject({
        code: 'bad-request', message: 'Invalid destination parameter',
      });
    });

    it.each(['8.8.8.8', '2001:4860:4860::8888', '::ffff:192.0.2.1', '', '999.8.8.8', '2001:::8888', 'example.com', 123])('validates the advertised IP %s', async (ip) => {
      globalThis.fetch = mockFetchResponse({ ip });
      const { fetchPublicIp } = await import('../src/api');
      const result = await fetchPublicIp(new AbortController().signal);
      expect(result).toBe(typeof ip === 'string' && ['8.8.8.8', '2001:4860:4860::8888', '::ffff:192.0.2.1'].includes(ip) ? ip : '');
    });

    it('aborts an IP lookup after three seconds', async () => {
      vi.useFakeTimers();
      let requestSignal!: AbortSignal;
      globalThis.fetch = vi.fn().mockImplementation((_url, options) => new Promise((_resolve, reject) => {
        requestSignal = options.signal;
        requestSignal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
      }));
      const { fetchPublicIp } = await import('../src/api');
      const lookup = fetchPublicIp(new AbortController().signal);
      await vi.advanceTimersByTimeAsync(3000);
      expect(await lookup).toBe('');
      expect(requestSignal.aborted).toBe(true);
    });
  });

  describe('primary selection from multiple predictions', () => {
    function selectionFixtures() {
      const dhlStandard = makePrediction({
        id: 'DHL Standard',
        courierName: 'DHL',
        prediction: {
          ...makePrediction().prediction,
          earliest: '2026-04-13',
          earliestLocale: 'Monday, Apr 13',
          mostLikely: '2026-04-15',
          mostLikelyLocale: 'Wednesday, Apr 15',
          latest: '2026-04-19',
          latestLocale: 'Sunday, Apr 19',
        },
      });
      const upsExpress = makePrediction({
        id: 'UPS Express',
        courier: 'ups',
        courierName: 'UPS',
        prediction: {
          ...makePrediction().prediction,
          earliest: '2026-04-15',
          earliestLocale: 'Wednesday, Apr 15',
          mostLikely: '2026-04-15',
          mostLikelyLocale: 'Wednesday, Apr 15',
          latest: '2026-04-15',
          latestLocale: 'Wednesday, Apr 15',
        },
      });
      const dhlNextDay = makePrediction({
        id: 'DHL DE NDD',
        courierName: 'DHL',
        prediction: {
          ...makePrediction().prediction,
          earliest: '2026-04-27',
          earliestLocale: 'Monday, Apr 27',
          mostLikely: '2026-04-27',
          mostLikelyLocale: 'Monday, Apr 27',
          latest: '2026-04-26',
          latestLocale: 'Sunday, Apr 26',
        },
      });
      return [dhlStandard, upsExpress, dhlNextDay];
    }

    it('selectionReferenceDate=latest with pick=earliest picks the smallest latest', async () => {
      globalThis.fetch = mockFetchResponse(successResponse(selectionFixtures()));
      const { init } = await import('../src/index');
      const widget = init({
        target: container,
        accountId: 18,
        destinationCountry: 'DEU',
        dateMode: 'by',
        showCarrier: 'inline',
        selectionReferenceDate: 'latest',
        selectionPick: 'earliest',
      });

      await vi.waitFor(() => {
        expect(container.textContent).toContain('Wednesday, Apr 15');
        expect(container.textContent).toContain('via UPS');
      });
      widget.destroy();
    });

    it('selectionPick=latest selects the prediction with the largest reference date', async () => {
      globalThis.fetch = mockFetchResponse(successResponse(selectionFixtures()));
      const { init } = await import('../src/index');
      const widget = init({
        target: container,
        accountId: 18,
        destinationCountry: 'DEU',
        dateMode: 'on',
        selectionReferenceDate: 'mostLikely',
        selectionPick: 'latest',
      });

      await vi.waitFor(() => {
        expect(container.textContent).toContain('Monday, Apr 27');
      });
      widget.destroy();
    });

    it('reads selectionReferenceDate / selectionPick from data attributes via auto-init', async () => {
      globalThis.fetch = mockFetchResponse(successResponse(selectionFixtures()));
      container.setAttribute('data-promise', '');
      container.setAttribute('data-account-id', '18');
      container.setAttribute('data-country', 'DEU');
      container.setAttribute('data-date-mode', 'by');
      container.setAttribute('data-selection-reference-date', 'latest');
      container.setAttribute('data-selection-pick', 'earliest');

      const { autoInit } = await import('../src/index');
      const [widget] = autoInit(document);

      await vi.waitFor(() => {
        expect(container.textContent).toContain('Wednesday, Apr 15');
      });
      widget!.destroy();
    });
  });
});
