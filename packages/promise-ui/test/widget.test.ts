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
    courier_name: 'DHL',
    courier_alias: [],
    courier_service_level: ['home-delivery'],
    prediction: {
      min: 1,
      max: 3,
      likely: 2,
      send_date: '2026-04-12',
      earliest_date: '2026-04-13',
      latest_date: '2026-04-15',
      most_likely_date: '2026-04-14',
      earliest_locale: 'Monday, Apr 13',
      latest_locale: 'Wednesday, Apr 15',
      most_likely_locale: 'Tuesday, Apr 14',
      cutoff: 120,
      cutoff_locale: '2 hours',
    },
    ...overrides,
  };
}

function expressPrediction() {
  return makePrediction({
    id: 'DHL Express',
    courier: 'dhl-express',
    courier_name: 'DHL',
    courier_service_level: ['express'],
    prediction: {
      min: 1,
      max: 1,
      likely: 1,
      send_date: '2026-04-12',
      earliest_date: '2026-04-13',
      latest_date: '2026-04-13',
      most_likely_date: '2026-04-13',
      earliest_locale: 'Monday, Apr 13',
      latest_locale: 'Monday, Apr 13',
      most_likely_locale: 'Monday, Apr 13',
      cutoff: 45,
      cutoff_locale: '45 minutes',
    },
  });
}

function successResponse(predictions = [makePrediction()]) {
  return {
    request_id: 'test-123',
    success: true,
    prediction: predictions,
  };
}

describe('DeliveryPromise Widget', () => {
  let container: HTMLElement;

  beforeEach(() => {
    vi.resetModules();
    container = document.createElement('div');
    container.id = 'test-target';
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
    vi.restoreAllMocks();
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
    });

    await vi.waitFor(() => {
      expect(container.querySelector('.pl-promise__link')).not.toBeNull();
      expect(container.textContent).toContain('Get delivery date');
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

  it('pickBestBy=earliest selects earliest most-likely date for primary', async () => {
    const predictions = [
      makePrediction({
        id: 'DHL Slow',
        courier_name: 'DHL',
        prediction: {
          ...makePrediction().prediction,
          most_likely_date: '2026-04-18',
          most_likely_locale: 'Saturday, Apr 18',
          earliest_date: '2026-04-16',
          earliest_locale: 'Thursday, Apr 16',
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
      pickBestBy: 'earliest',
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
      dateMode: 'asSoonAs',
      zipPicker: 'inline',
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
      dateMode: 'asSoonAs',
      dateFormat: 'relative',
    });

    await vi.waitFor(() => {
      // earliest_date is 2026-04-13 → tomorrow from 2026-04-12
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
      request_id: 't',
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
});
