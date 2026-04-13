import {
  FetchError,
  type CutoffUrgency,
  type PredictionEntry,
  type PredictionViewModel,
  type PromiseApiResponse,
  type ResolvedWidgetConfig,
  type ViewModel,
} from './types';

function classifyCutoffUrgency(minutes: number): CutoffUrgency {
  if (minutes <= 0) {
    return 'none';
  }

  if (minutes <= 60) {
    return 'high';
  }

  if (minutes <= 180) {
    return 'medium';
  }

  return 'low';
}

function mapPrediction(
  entry: PredictionEntry,
  config: ResolvedWidgetConfig,
): PredictionViewModel {
  const p = entry.prediction;
  const cutoffUrgency = classifyCutoffUrgency(p.cutoff);

  let dateRangeText: string;

  if (p.earliest_locale === p.latest_locale) {
    dateRangeText = p.earliest_locale;
  } else {
    dateRangeText = `${p.earliest_locale} – ${p.latest_locale}`;
  }

  const daysText =
    p.min === p.max
      ? config.messages.singleDay.replace('{count}', String(p.min))
      : config.messages.dayRange
          .replace('{min}', String(p.min))
          .replace('{max}', String(p.max));

  return {
    id: entry.id,
    courierName: entry.courier_name || entry.courier,
    serviceLevels: entry.courier_service_level,
    earliestDate: p.earliest_locale,
    latestDate: p.latest_locale,
    mostLikelyDate: p.most_likely_locale,
    dateRangeText,
    cutoffMinutes: p.cutoff,
    cutoffText: p.cutoff_locale,
    cutoffUrgency,
    daysMin: p.min,
    daysMax: p.max,
  };
}

export function readyViewModel(
  response: PromiseApiResponse,
  config: ResolvedWidgetConfig,
): ViewModel {
  const predictions = response.prediction
    .slice(0, config.maxPredictions)
    .map((entry) => mapPrediction(entry, config));

  if (predictions.length === 0) {
    return {
      state: 'empty',
      heading: config.messages.noDataHeading,
      summary: config.messages.noDataSummary,
    };
  }

  return {
    state: 'ready',
    predictions,
    postalCode: config.postalCode,
    country: config.destinationCountry,
  };
}

export function handleFetchError(
  error: unknown,
  config: ResolvedWidgetConfig,
): ViewModel {
  if (error instanceof FetchError && error.code === 'not-found') {
    return {
      state: 'empty',
      heading: config.messages.noDataHeading,
      summary: config.messages.noDataSummary,
    };
  }

  return {
    state: 'error',
    heading: config.messages.errorHeading,
    summary: config.messages.errorSummary,
  };
}
