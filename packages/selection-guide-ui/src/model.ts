import {
  FetchError,
  type FitCategory,
  type RecommendationApiResponse,
  type ReadyViewModel,
  type ResolvedWidgetConfig,
  type ViewModel,
} from './types';

const DEFAULT_POSITIONS: Record<Exclude<FitCategory, 'unknown'>, number> = {
  small: -0.55,
  true: 0,
  large: 0.55,
};

function clampPosition(value: number): number {
  return Math.max(-1, Math.min(1, value));
}

export function normalizeFitCategory(
  value: string | null | undefined,
): FitCategory {
  const normalized = value?.trim().toLowerCase();

  if (!normalized) {
    return 'unknown';
  }

  if (normalized.includes('small')) {
    return 'small';
  }

  if (normalized.includes('large')) {
    return 'large';
  }

  if (normalized.includes('true')) {
    return 'true';
  }

  return 'unknown';
}

function formatConfidence(
  confidence: number | null,
  template: string,
): string | undefined {
  if (confidence == null || !Number.isFinite(confidence)) {
    return undefined;
  }

  const percent = Math.max(0, Math.min(100, Math.round(confidence * 100)));
  return template.replace('{value}', String(percent));
}

function resolvePosition(
  response: RecommendationApiResponse,
  fitCategory: Exclude<FitCategory, 'unknown'>,
): number {
  const position = response.smoothed_fit_position ?? response.raw_fit_position;

  if (position != null && Number.isFinite(position)) {
    return clampPosition(position);
  }

  return DEFAULT_POSITIONS[fitCategory];
}

function fallbackSummary(
  fitCategory: Exclude<FitCategory, 'unknown'>,
  config: ResolvedWidgetConfig,
): string {
  switch (fitCategory) {
    case 'small':
      return config.messages.fallbackSummarySmall;
    case 'large':
      return config.messages.fallbackSummaryLarge;
    case 'true':
      return config.messages.fallbackSummaryTrue;
  }
}

function recommendationHeading(
  fitCategory: Exclude<FitCategory, 'unknown'>,
  config: ResolvedWidgetConfig,
): string {
  switch (fitCategory) {
    case 'small':
      return config.messages.recommendationHeadingSmall;
    case 'large':
      return config.messages.recommendationHeadingLarge;
    case 'true':
      return config.messages.recommendationHeadingTrue;
  }
}

function fitPill(
  fitCategory: Exclude<FitCategory, 'unknown'>,
  config: ResolvedWidgetConfig,
): string {
  switch (fitCategory) {
    case 'small':
      return config.messages.fitCategorySmall;
    case 'large':
      return config.messages.fitCategoryLarge;
    case 'true':
      return config.messages.fitCategoryTrue;
  }
}

export function readyViewModel(
  response: RecommendationApiResponse,
  config: ResolvedWidgetConfig,
): ViewModel {
  const fitCategory = normalizeFitCategory(response.size_fit_category);
  const resolvedCategory = fitCategory === 'unknown' ? 'true' : fitCategory;
  const confidenceText = formatConfidence(
    response.confidence_smetabase_core,
    config.messages.confidenceText,
  );

  const viewModel: Omit<ReadyViewModel, 'confidenceText'> = {
    state: 'ready',
    fitCategory: resolvedCategory,
    pillText: fitPill(resolvedCategory, config),
    recommendationHeading: recommendationHeading(resolvedCategory, config),
    summary:
      response.llm_summary?.trim() || fallbackSummary(resolvedCategory, config),
    position: resolvePosition(response, resolvedCategory),
  };

  if (confidenceText) {
    return {
      ...viewModel,
      confidenceText,
    };
  }

  return viewModel;
}

export function handleFetchError(
  error: unknown,
  config: ResolvedWidgetConfig,
): ViewModel {
  if (error instanceof FetchError && error.code === 'not-found') {
    if (config.notFoundMode === 'hidden') {
      return { state: 'hidden' };
    }

    if (config.notFoundMode === 'true-to-size') {
      return {
        state: 'fallback-true',
        fitCategory: 'true',
        pillText: config.messages.fallbackTruePill,
        recommendationHeading: config.messages.fallbackTrueHeading,
        summary: config.messages.fallbackTrueSummary,
        position: DEFAULT_POSITIONS.true,
      };
    }

    return {
      state: 'empty',
      pillText: config.messages.noDataPill,
      recommendationHeading: config.messages.noDataHeading,
      summary: config.messages.noDataSummary,
    };
  }

  return {
    state: 'error',
    pillText: config.messages.errorPill,
    recommendationHeading: config.messages.errorHeading,
    summary: config.messages.errorSummary,
  };
}
