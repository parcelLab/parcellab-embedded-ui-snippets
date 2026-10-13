import {
  FetchError,
  type RecommendationApiResponse,
  type ResolvedWidgetConfig,
} from './types';

const responseCache = new Map<string, RecommendationApiResponse>();

const SUPPORTED_LANGUAGE_CODES = new Set(['en', 'de', 'fr', 'it', 'es']);

function resolveLanguageCode(locale: string): string {
  const normalized = locale.toLowerCase().slice(0, 2);
  return SUPPORTED_LANGUAGE_CODES.has(normalized) ? normalized : 'en';
}

function cacheKey(config: ResolvedWidgetConfig): string {
  return [
    config.apiBaseUrl,
    config.accountId,
    config.productId,
    resolveLanguageCode(config.locale),
  ].join('|');
}

export async function fetchRecommendation(
  config: ResolvedWidgetConfig,
  signal: AbortSignal,
): Promise<RecommendationApiResponse> {
  const key = cacheKey(config);
  const cached = responseCache.get(key);

  if (cached) {
    return cached;
  }

  const url = new URL(
    '/v4/size-recommender/recommendation/',
    config.apiBaseUrl,
  );

  url.searchParams.set('account_id', String(config.accountId));
  url.searchParams.set('article_name', config.productId);
  url.searchParams.set('language_code', resolveLanguageCode(config.locale));

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

  if (response.status === 404) {
    throw new FetchError('not-found', 'Recommendation not found.');
  }

  if (response.status === 429) {
    throw new FetchError('throttled', 'Recommendation request throttled.');
  }

  if (!response.ok) {
    throw new FetchError('network', `Unexpected response: ${response.status}`);
  }

  const payload = (await response.json()) as RecommendationApiResponse;
  responseCache.set(key, payload);
  return payload;
}
