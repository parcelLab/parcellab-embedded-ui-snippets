import {
  FetchError,
  type CutoffUrgency,
  type DateFormat,
  type DateMode,
  type FallbackDays,
  type PredictionEntry,
  type PredictionViewModel,
  type PromiseApiResponse,
  type ResolvedWidgetConfig,
  type ViewModel,
  type WidgetMessages,
} from './types';

const LOCALE_TAG_MAP: Record<string, string> = {
  en: 'en-US',
  de: 'de-DE',
  fr: 'fr-FR',
  it: 'it-IT',
  es: 'es-ES',
};

function localeTag(locale: string): string {
  return LOCALE_TAG_MAP[locale] ?? locale ?? 'en-US';
}

function classifyCutoffUrgency(minutes: number): CutoffUrgency {
  if (minutes <= 0) return 'none';
  if (minutes <= 60) return 'high';
  if (minutes <= 180) return 'medium';
  return 'low';
}

function interpolate(
  template: string,
  values: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (_match, key: string) => {
    const value = values[key];
    return value == null ? '' : String(value);
  });
}

function isExpressService(
  serviceLevels: string[],
  id: string,
  expressTags: string[],
): boolean {
  const idLower = id.toLowerCase();
  if (expressTags.some((tag) => idLower.includes(tag))) return true;
  return serviceLevels.some((level) => {
    const lower = level.toLowerCase();
    return expressTags.some((tag) => lower.includes(tag));
  });
}

function parseIsoDate(iso: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return null;
  const [, y, m, d] = match;
  return new Date(Number(y), Number(m) - 1, Number(d), 12, 0, 0);
}

function daysBetween(target: Date, now: Date): number {
  const ms =
    target.getTime() -
    new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12).getTime();
  return Math.round(ms / 86400000);
}

interface FormatOptions {
  format: DateFormat;
  locale: string;
  messages: WidgetMessages;
  now?: Date;
}

/**
 * Format an ISO date into a display string. Falls back to apiFormatted (the
 * pre-localized string from the API) when ISO can't be parsed.
 */
function formatDate(
  iso: string,
  apiFormatted: string,
  options: FormatOptions,
): string {
  const date = parseIsoDate(iso);
  if (!date) return apiFormatted;

  const now = options.now ?? new Date();
  const days = daysBetween(date, now);
  const tag = localeTag(options.locale);

  if (options.format === 'relative') {
    if (days <= 0) return options.messages.relativeToday;
    if (days === 1) return options.messages.relativeTomorrow;
    if (days <= 7) return interpolate(options.messages.relativeInDays, { count: days });
    // fall through to short
  }

  const useShort =
    options.format === 'short' ||
    options.format === 'shortWithYear' ||
    options.format === 'relative';

  const includeYear =
    options.format === 'longWithYear' ||
    options.format === 'shortWithYear';

  const formatter = new Intl.DateTimeFormat(tag, {
    weekday: useShort ? 'short' : 'long',
    month: 'short',
    day: 'numeric',
    ...(includeYear ? { year: 'numeric' } : {}),
  });

  return formatter.format(date);
}

/**
 * Collapse `range` to `on` when the two dates are identical — a one-point
 * range reads more naturally as a single-date sentence ("delivery on May 18")
 * than as a duplicated span ("May 18 – May 18").
 *
 * Compare the raw ISO dates, not the formatted display strings: with
 * `dateFormat='relative'`, distinct dates can format identically (e.g. both as
 * "Today"), and we don't want to claim a single-date delivery for a real range.
 */
export function effectiveDateMode(
  mode: DateMode,
  primary: PredictionViewModel,
): DateMode {
  if (mode === 'range' && primary.earliestIso === primary.latestIso) {
    return 'on';
  }
  return mode;
}

function pickSummaryTemplate(
  messages: WidgetMessages,
  mode: DateMode,
  guaranteed: boolean,
): string {
  if (guaranteed) {
    switch (mode) {
      case 'on': return messages.summaryGuaranteedOn;
      case 'by': return messages.summaryGuaranteedBy;
      case 'range': return messages.summaryGuaranteedRange;
      case 'from':
      default: return messages.summaryGuaranteedFrom;
    }
  }
  switch (mode) {
    case 'on': return messages.summaryEstimatedOn;
    case 'by': return messages.summaryEstimatedBy;
    case 'range': return messages.summaryEstimatedRange;
    case 'from':
    default: return messages.summaryEstimatedFrom;
  }
}

export function pickCardHeading(
  messages: WidgetMessages,
  mode: DateMode,
  guaranteed: boolean,
): string {
  if (guaranteed) {
    switch (mode) {
      case 'on': return messages.cardHeadingGuaranteedOn;
      case 'by': return messages.cardHeadingGuaranteedBy;
      case 'range': return messages.cardHeadingGuaranteedRange;
      case 'from':
      default: return messages.cardHeadingGuaranteedFrom;
    }
  }
  switch (mode) {
    case 'on': return messages.cardHeadingEstimatedOn;
    case 'by': return messages.cardHeadingEstimatedBy;
    case 'range': return messages.cardHeadingEstimatedRange;
    case 'from':
    default: return messages.cardHeadingEstimatedFrom;
  }
}

function isGuaranteedFor(
  config: ResolvedWidgetConfig,
  isExpress: boolean,
): boolean {
  if (config.confidence === 'guaranteed') return true;
  if (config.confidence === 'estimated') return false;
  return isExpress;
}

function mapPrediction(
  entry: PredictionEntry,
  config: ResolvedWidgetConfig,
): PredictionViewModel {
  const p = entry.prediction;
  const cutoffUrgency = classifyCutoffUrgency(p.cutoff);
  const isExpress = isExpressService(
    entry.courier_service_level ?? [],
    entry.id,
    config.expressServiceLevels,
  );

  const showCutoff = (() => {
    if (p.cutoff <= 0) return false;
    switch (config.showCutoff) {
      case 'never': return false;
      case 'always': return true;
      case 'express-only': return isExpress;
      case 'auto':
      default:
        return cutoffUrgency === 'high' || cutoffUrgency === 'medium' || isExpress;
    }
  })();

  const formatOpts: FormatOptions = {
    format: config.dateFormat,
    locale: config.locale,
    messages: config.messages,
  };

  const earliestDisplay = formatDate(p.earliest_date, p.earliest_locale, formatOpts);
  const latestDisplay = formatDate(p.latest_date, p.latest_locale, formatOpts);
  const mostLikelyDisplay = formatDate(p.most_likely_date, p.most_likely_locale, formatOpts);

  const cutoffSentence = interpolate(config.messages.cutoffSentence, {
    cutoff: p.cutoff_locale,
  });

  return {
    id: entry.id,
    courier: entry.courier,
    courierName: entry.courier_name || entry.courier,
    serviceLevels: entry.courier_service_level ?? [],
    earliestDate: earliestDisplay,
    latestDate: latestDisplay,
    mostLikelyDate: mostLikelyDisplay,
    earliestIso: p.earliest_date,
    latestIso: p.latest_date,
    mostLikelyIso: p.most_likely_date,
    cutoffMinutes: p.cutoff,
    cutoffText: p.cutoff_locale,
    cutoffUrgency,
    cutoffSentence,
    isExpress,
    showCutoff,
    daysMin: p.min,
    daysMax: p.max,
    isGuaranteed: isGuaranteedFor(config, isExpress),
  };
}

function referenceIso(
  prediction: PredictionViewModel,
  reference: ResolvedWidgetConfig['selectionReferenceDate'],
): string {
  switch (reference) {
    case 'earliest':
      return prediction.earliestIso;
    case 'latest':
      return prediction.latestIso || prediction.mostLikelyIso || prediction.earliestIso;
    case 'mostLikely':
    default:
      return prediction.mostLikelyIso || prediction.earliestIso;
  }
}

/**
 * Pick a primary prediction from the API response.
 *
 * `selectionReferenceDate` chooses which date field on each prediction is the
 * point of comparison; `selectionPick` decides whether the prediction with the
 * smallest (`earliest`) or largest (`latest`) value of that field wins.
 */
function pickPrimary(
  predictions: PredictionViewModel[],
  config: ResolvedWidgetConfig,
): PredictionViewModel {
  const sorted = [...predictions].sort((a, b) => {
    const aDate = referenceIso(a, config.selectionReferenceDate);
    const bDate = referenceIso(b, config.selectionReferenceDate);
    if (aDate === bDate) return 0;
    return aDate < bDate ? -1 : 1;
  });
  return config.selectionPick === 'latest'
    ? sorted[sorted.length - 1]!
    : sorted[0]!;
}

function buildSummary(
  primary: PredictionViewModel,
  config: ResolvedWidgetConfig,
): { text: string; dateText: string } {
  const dateMode = effectiveDateMode(config.dateMode, primary);
  const collapsedRange = config.dateMode === 'range' && dateMode === 'on';

  const template = pickSummaryTemplate(config.messages, dateMode, primary.isGuaranteed);

  let dateText: string;
  switch (dateMode) {
    case 'on':
      // Collapsed-range case: keep the (single) range date, not most-likely.
      dateText = collapsedRange ? primary.earliestDate : primary.mostLikelyDate;
      break;
    case 'by':
      dateText = primary.latestDate;
      break;
    case 'range':
      dateText = `${primary.earliestDate} – ${primary.latestDate}`;
      break;
    case 'from':
    default:
      dateText = primary.earliestDate;
      break;
  }

  const text =
    dateMode === 'range'
      ? interpolate(template, {
          earliest: primary.earliestDate,
          latest: primary.latestDate,
        })
      : interpolate(template, { date: dateText });

  return { text, dateText };
}

export function readyViewModel(
  response: PromiseApiResponse,
  config: ResolvedWidgetConfig,
): ViewModel {
  const predictions = response.prediction
    .slice(0, config.maxPredictions)
    .map((entry) => mapPrediction(entry, config));

  if (predictions.length === 0) {
    return fallbackOrEmpty(config);
  }

  const primary = pickPrimary(predictions, config);
  const { text, dateText } = buildSummary(primary, config);

  return {
    state: 'ready',
    predictions,
    primary,
    summaryText: text,
    summaryDateText: dateText,
    postalCode: config.postalCode,
    country: config.destinationCountry,
  };
}

export function linkViewModel(config: ResolvedWidgetConfig): ViewModel {
  return {
    state: 'link',
    cta: config.messages.zipPromptCta,
  };
}

function fallbackOrEmpty(config: ResolvedWidgetConfig): ViewModel {
  if (config.fallbackDays != null) {
    return buildFallbackViewModel(config.fallbackDays, config);
  }
  return {
    state: 'empty',
    heading: config.messages.noDataHeading,
    summary: config.messages.noDataSummary,
  };
}

export function buildFallbackViewModel(
  fallback: FallbackDays,
  config: ResolvedWidgetConfig,
): ViewModel {
  const isGuaranteed = config.confidence === 'guaranteed';
  let text: string;
  if (Array.isArray(fallback)) {
    const [min, max] = fallback;
    if (min === max) {
      text =
        min === 1
          ? interpolate(config.messages.fallbackSingle, { count: min })
          : interpolate(config.messages.fallbackRange, { min, max });
    } else {
      text = interpolate(config.messages.fallbackRange, { min, max });
    }
  } else {
    text =
      fallback === 1
        ? interpolate(config.messages.fallbackSingle, { count: fallback })
        : interpolate(config.messages.fallbackRange, {
            min: fallback,
            max: fallback,
          });
  }
  return { state: 'fallback', text, isGuaranteed };
}

export function handleFetchError(
  error: unknown,
  config: ResolvedWidgetConfig,
): ViewModel {
  if (error instanceof FetchError && error.code === 'not-found') {
    return fallbackOrEmpty(config);
  }

  if (config.fallbackDays != null) {
    return buildFallbackViewModel(config.fallbackDays, config);
  }

  return {
    state: 'error',
    heading: config.messages.errorHeading,
    summary: config.messages.errorSummary,
  };
}
