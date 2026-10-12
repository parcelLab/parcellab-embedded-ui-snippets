import {
  FetchError,
  type PromiseApiResponse,
  type ResolvedWidgetConfig,
} from './types';

const responseCache = new Map<string, PromiseApiResponse>();

export function isIpAddress(ip: string): boolean {
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(ip)) {
    return ip.split('.').every((part) => /^(0|[1-9]\d{0,2})$/.test(part) && Number(part) <= 255);
  }
  if (/^[\da-f:.]+$/i.test(ip) && ip.includes(':')) {
    try {
      new URL(`http://[${ip}]/`);
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

function cacheKey(config: ResolvedWidgetConfig, destinationIp: string): string {
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
    config.locale,
    destinationIp,
  ].join('|');
}

export async function fetchPrediction(
  config: ResolvedWidgetConfig,
  signal: AbortSignal,
  destinationIp = '',
): Promise<PromiseApiResponse> {
  const key = cacheKey(config, destinationIp);
  const selfRequest = !config.postalCode && config.ipFetch && destinationIp === 'self';
  const cached = selfRequest ? undefined : responseCache.get(key);

  if (cached) {
    return cached;
  }

  const url = new URL('/v2/prediction', config.apiBaseUrl);
  const destination = config.postalCode
    ? `${config.postalCode}_${config.destinationCountry}`
    : config.ipFetch && destinationIp
      ? destinationIp
      : config.destinationCountry;

  url.searchParams.set('user', String(config.accountId));
  url.searchParams.set('destination', destination);
  if (!config.postalCode && config.ipFetch && destinationIp) {
    url.searchParams.set('fallbackCountry', config.destinationCountry);
  }

  if (config.courier) {
    url.searchParams.set('courier', config.courier);
  }

  if (config.serviceLevel) {
    url.searchParams.set('courierServiceLevel', config.serviceLevel);
  }

  if (config.warehouse) {
    url.searchParams.set('warehouse', config.warehouse);
  }

  if (config.calibration) {
    url.searchParams.set('calibration', config.calibration);
  }

  if (config.locale) {
    url.searchParams.set('lang', config.locale);
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
      ...(selfRequest ? { cache: 'no-store', credentials: 'omit', referrerPolicy: 'no-referrer' } as const : {}),
    });
  } catch (error) {
    if ((error as Error).name === 'AbortError') {
      throw error;
    }

    throw new FetchError('network', 'Network request failed.');
  }

  if (response.status === 400) {
    const body = await response.json().catch(() => null) as { error?: string } | null;
    const detail = body?.error ?? 'Bad request.';
    throw new FetchError('bad-request', detail);
  }

  if (response.status === 404) {
    const body = await response.json().catch(() => null) as PromiseApiResponse | null;
    throw new FetchError('not-found', 'Prediction not found.', body?.location ?? null);
  }

  if (!response.ok) {
    throw new FetchError('network', `Unexpected response: ${response.status}`);
  }

  const payload = (await response.json()) as PromiseApiResponse;

  if (!payload.success) {
    throw new FetchError('network', payload.error ?? 'Prediction failed.', payload.location ?? null);
  }

  if (!selfRequest) responseCache.set(key, payload);
  return payload;
}
