import {
  FetchError,
  type PromiseApiResponse,
  type ResolvedWidgetConfig,
} from './types';

const responseCache = new Map<string, PromiseApiResponse>();

function cacheKey(config: ResolvedWidgetConfig): string {
  return [
    config.apiBaseUrl,
    config.accountId,
    config.destinationCountry,
    config.postalCode,
    config.courier,
    config.serviceLevel,
    config.warehouse,
    config.calibration,
    config.tag,
    config.draft,
  ].join('|');
}

export async function fetchPrediction(
  config: ResolvedWidgetConfig,
  signal: AbortSignal,
): Promise<PromiseApiResponse> {
  const key = cacheKey(config);
  const cached = responseCache.get(key);

  if (cached) {
    return cached;
  }

  const url = new URL('/v4/promise/prediction/predict/', config.apiBaseUrl);

  url.searchParams.set('account', String(config.accountId));
  url.searchParams.set('destination_country_iso3', config.destinationCountry);

  if (config.postalCode) {
    url.searchParams.set('destination_postal_code', config.postalCode);
  }

  if (config.courier) {
    url.searchParams.set('courier', config.courier);
  }

  if (config.serviceLevel) {
    url.searchParams.set('service_level', config.serviceLevel);
  }

  if (config.warehouse) {
    url.searchParams.set('warehouse', config.warehouse);
  }

  if (config.calibration) {
    url.searchParams.set('calibration', config.calibration);
  }

  if (config.locale) {
    url.searchParams.set('language_iso2', config.locale);
  }

  if (config.draft) {
    url.searchParams.set('draft', 'true');
  }

  if (config.tag) {
    url.searchParams.set('tag', config.tag);
  }

  let response: Response;

  try {
    response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      signal,
    });
  } catch (error) {
    if ((error as Error).name === 'AbortError') {
      throw error;
    }

    throw new FetchError('network', 'Network request failed.');
  }

  if (response.status === 400) {
    const body = await response.json().catch(() => null) as {
      errors?: Array<{ detail?: string }>;
    } | null;
    const detail = body?.errors?.[0]?.detail ?? 'Bad request.';
    throw new FetchError('bad-request', detail);
  }

  if (response.status === 404) {
    throw new FetchError('not-found', 'Prediction not found.');
  }

  if (!response.ok) {
    throw new FetchError('network', `Unexpected response: ${response.status}`);
  }

  const payload = (await response.json()) as PromiseApiResponse;

  if (!payload.success) {
    throw new FetchError('network', payload.error ?? 'Prediction failed.');
  }

  responseCache.set(key, payload);
  return payload;
}
