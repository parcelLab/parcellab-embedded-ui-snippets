import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

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

  it('renders loading state then prediction', async () => {
    globalThis.fetch = mockFetchResponse(successResponse());

    const { init } = await import('../src/index');
    const widget = init({
      target: container,
      accountId: 18,
      destinationCountry: 'DEU',
      postalCode: '80469',
    });

    // Loading state should be rendered synchronously
    expect(container.textContent).toContain('Checking delivery times');

    // Wait for fetch to resolve
    await vi.waitFor(() => {
      expect(container.textContent).toContain('Tuesday, Apr 14');
    });

    widget.destroy();
  });

  it('shows courier name when showCourier is true', async () => {
    globalThis.fetch = mockFetchResponse(successResponse());

    const { init } = await import('../src/index');
    const widget = init({
      target: container,
      accountId: 18,
      destinationCountry: 'DEU',
      showCourier: true,
    });

    await vi.waitFor(() => {
      expect(container.textContent).toContain('DHL');
    });

    widget.destroy();
  });

  it('hides courier name when showCourier is false', async () => {
    globalThis.fetch = mockFetchResponse(successResponse());

    const { init } = await import('../src/index');
    const widget = init({
      target: container,
      accountId: 18,
      destinationCountry: 'DEU',
      showCourier: false,
    });

    await vi.waitFor(() => {
      expect(container.textContent).toContain('Tuesday, Apr 14');
    });

    expect(container.querySelector('.pl-promise__courier')).toBeNull();

    widget.destroy();
  });

  it('shows cutoff urgency for high urgency', async () => {
    const pred = makePrediction();
    pred.prediction.cutoff = 30;
    pred.prediction.cutoff_locale = '30 minutes';
    globalThis.fetch = mockFetchResponse(successResponse([pred]));

    const { init } = await import('../src/index');
    const widget = init({
      target: container,
      accountId: 18,
      destinationCountry: 'DEU',
    });

    await vi.waitFor(() => {
      expect(container.querySelector('.pl-promise__cutoff--high')).not.toBeNull();
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

    globalThis.fetch = mockFetchResponse(successResponse());

    const { autoInit } = await import('../src/index');
    const widgets = autoInit(document.body);

    expect(widgets.length).toBe(1);

    await vi.waitFor(() => {
      expect(container.textContent).toContain('Tuesday, Apr 14');
    });

    widgets[0].destroy();
  });

  it('applies layout classes', async () => {
    globalThis.fetch = mockFetchResponse(successResponse());

    const { init } = await import('../src/index');
    const widget = init({
      target: container,
      accountId: 18,
      destinationCountry: 'DEU',
      layout: 'compact',
    });

    await vi.waitFor(() => {
      expect(container.querySelector('.pl-promise--layout-compact')).not.toBeNull();
    });

    widget.destroy();
  });

  it('respects maxPredictions', async () => {
    const predictions = [
      makePrediction({ id: 'DHL Standard' }),
      makePrediction({ id: 'UPS Express', courier_name: 'UPS' }),
      makePrediction({ id: 'DPD', courier_name: 'DPD' }),
    ];
    globalThis.fetch = mockFetchResponse(successResponse(predictions));

    const { init } = await import('../src/index');
    const widget = init({
      target: container,
      accountId: 18,
      destinationCountry: 'DEU',
      maxPredictions: 2,
    });

    await vi.waitFor(() => {
      const cards = container.querySelectorAll('.pl-promise__card');
      expect(cards.length).toBe(2);
    });

    widget.destroy();
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
      expect(container.textContent).toContain('Estimated Delivery');
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
