export type WidgetTarget = string | HTMLElement;

export type NotFoundMode = 'empty' | 'true-to-size' | 'hidden';

export type FitCategory = 'small' | 'true' | 'large' | 'unknown';

export type AppearanceMode = 'neutral' | 'colored' | 'alert';

export type DensityMode = 'compact' | 'comfortable';

export type SurfaceMode = 'subtle' | 'plain';

export interface WidgetTheme {
  backgroundColor: string;
  recommendationBackgroundColor: string;
  borderColor: string;
  textColor: string;
  mutedTextColor: string;
  accentColor: string;
  badgeBackgroundColor: string;
  badgeTextColor: string;
  trackColor: string;
  trackStartColor: string;
  trackEndColor: string;
  radius: string;
}

export interface WidgetMessages {
  title: string;
  runsSmallLabel: string;
  trueToSizeLabel: string;
  runsLargeLabel: string;
  confidenceText: string;
  loading: string;
  fitCategorySmall: string;
  fitCategoryTrue: string;
  fitCategoryLarge: string;
  fallbackTruePill: string;
  noDataPill: string;
  errorPill: string;
  recommendationHeadingSmall: string;
  recommendationHeadingTrue: string;
  recommendationHeadingLarge: string;
  fallbackTrueHeading: string;
  fallbackTrueSummary: string;
  noDataHeading: string;
  noDataSummary: string;
  errorHeading: string;
  errorSummary: string;
  fallbackSummarySmall: string;
  fallbackSummaryTrue: string;
  fallbackSummaryLarge: string;
}

export interface WidgetConfig {
  target: WidgetTarget;
  accountId: number | string;
  productId?: string;
  articleName?: string;
  locale?: string;
  messages?: Partial<WidgetMessages>;
  notFoundMode?: NotFoundMode;
  apiBaseUrl?: string;
  appearance?: AppearanceMode;
  density?: DensityMode;
  surface?: SurfaceMode;
  theme?: Partial<WidgetTheme>;
  className?: string;
  showPill?: boolean;
  showScale?: boolean;
  showRecommendation?: boolean;
  showSummary?: boolean;
}

export interface ResolvedWidgetConfig {
  target: HTMLElement;
  accountId: number;
  productId: string;
  locale: string;
  messages: WidgetMessages;
  notFoundMode: NotFoundMode;
  apiBaseUrl: string;
  appearance: AppearanceMode;
  density: DensityMode;
  surface: SurfaceMode;
  theme: Partial<WidgetTheme>;
  className: string;
  showPill: boolean;
  showScale: boolean;
  showRecommendation: boolean;
  showSummary: boolean;
}

export interface WidgetInitOptions extends WidgetConfig {
  target: WidgetTarget;
}

export interface WidgetUpdateOptions
  extends Partial<Omit<WidgetConfig, 'target' | 'accountId'>> {
  accountId?: number | string;
  target?: WidgetTarget;
}

export interface WidgetInstance {
  refresh: () => Promise<void>;
  update: (options: WidgetUpdateOptions) => Promise<void>;
  destroy: () => void;
}

export interface RecommendationApiResponse {
  article_name: string;
  size_fit_category: string | null;
  confidence_smetabase_core: number | null;
  smoothed_fit_position: number | null;
  raw_fit_position: number | null;
  llm_summary: string | null;
}

export type FetchErrorCode = 'not-found' | 'throttled' | 'network';

export class FetchError extends Error {
  code: FetchErrorCode;

  constructor(code: FetchErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

export interface ReadyViewModel {
  state: 'ready';
  fitCategory: Exclude<FitCategory, 'unknown'>;
  pillText: string;
  recommendationHeading: string;
  summary: string;
  position: number;
  confidenceText?: string;
}

export interface FallbackTrueViewModel {
  state: 'fallback-true';
  fitCategory: 'true';
  pillText: string;
  recommendationHeading: string;
  summary: string;
  position: number;
}

export interface EmptyViewModel {
  state: 'empty';
  pillText: string;
  recommendationHeading: string;
  summary: string;
}

export interface ErrorViewModel {
  state: 'error';
  pillText: string;
  recommendationHeading: string;
  summary: string;
}

export interface LoadingViewModel {
  state: 'loading';
  text: string;
}

export interface HiddenViewModel {
  state: 'hidden';
}

export type ViewModel =
  | LoadingViewModel
  | ReadyViewModel
  | FallbackTrueViewModel
  | EmptyViewModel
  | ErrorViewModel
  | HiddenViewModel;
