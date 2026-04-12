export type WidgetTarget = string | HTMLElement;

export type LayoutMode = 'list' | 'compact' | 'banner';

export type DensityMode = 'compact' | 'comfortable';

export type SurfaceMode = 'subtle' | 'plain';

export type CutoffUrgency = 'none' | 'low' | 'medium' | 'high';

export interface WidgetTheme {
  backgroundColor: string;
  cardBackgroundColor: string;
  borderColor: string;
  textColor: string;
  mutedTextColor: string;
  accentColor: string;
  urgentColor: string;
  successColor: string;
  iconColor: string;
  radius: string;
}

export interface WidgetMessages {
  title: string;
  deliverTo: string;
  orderWithin: string;
  toReceiveBy: string;
  estimatedDelivery: string;
  freeShipping: string;
  loading: string;
  noDataHeading: string;
  noDataSummary: string;
  errorHeading: string;
  errorSummary: string;
  editZip: string;
  changeZip: string;
  applyZip: string;
  zipPlaceholder: string;
  dayRange: string;
  singleDay: string;
  tomorrow: string;
  today: string;
}

export interface WidgetConfig {
  target: WidgetTarget;
  accountId: number | string;
  destinationCountry: string;
  postalCode?: string;
  courier?: string;
  serviceLevel?: string;
  warehouse?: string;
  calibration?: 'conservative' | 'balanced' | 'aggressive';
  locale?: string;
  messages?: Partial<WidgetMessages>;
  apiBaseUrl?: string;
  layout?: LayoutMode;
  density?: DensityMode;
  surface?: SurfaceMode;
  theme?: Partial<WidgetTheme>;
  className?: string;
  showCutoff?: boolean;
  showCourier?: boolean;
  showDateRange?: boolean;
  showIcon?: boolean;
  zipEditable?: boolean;
  draft?: boolean;
  tag?: string;
  maxPredictions?: number;
}

export interface ResolvedWidgetConfig {
  target: HTMLElement;
  accountId: number;
  destinationCountry: string;
  postalCode: string;
  courier: string;
  serviceLevel: string;
  warehouse: string;
  calibration: string;
  locale: string;
  messages: WidgetMessages;
  apiBaseUrl: string;
  layout: LayoutMode;
  density: DensityMode;
  surface: SurfaceMode;
  theme: Partial<WidgetTheme>;
  className: string;
  showCutoff: boolean;
  showCourier: boolean;
  showDateRange: boolean;
  showIcon: boolean;
  zipEditable: boolean;
  draft: boolean;
  tag: string;
  maxPredictions: number;
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

export interface PredictionDetail {
  min: number;
  max: number;
  likely: number;
  send_date: string;
  earliest_date: string;
  latest_date: string;
  most_likely_date: string;
  earliest_locale: string;
  latest_locale: string;
  most_likely_locale: string;
  cutoff: number;
  cutoff_locale: string;
}

export interface PredictionEntry {
  id: string;
  warehouse: string;
  courier: string;
  courier_name: string;
  courier_alias: string[];
  courier_service_level: string[];
  prediction: PredictionDetail;
}

export interface PromiseApiResponse {
  request_id: string;
  success: boolean;
  error?: string;
  prediction: PredictionEntry[];
}

export type FetchErrorCode = 'not-found' | 'bad-request' | 'network';

export class FetchError extends Error {
  code: FetchErrorCode;

  constructor(code: FetchErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

export interface PredictionViewModel {
  id: string;
  courierName: string;
  serviceLevels: string[];
  earliestDate: string;
  latestDate: string;
  mostLikelyDate: string;
  dateRangeText: string;
  cutoffMinutes: number;
  cutoffText: string;
  cutoffUrgency: CutoffUrgency;
  daysMin: number;
  daysMax: number;
}

export interface ReadyViewModel {
  state: 'ready';
  predictions: PredictionViewModel[];
  postalCode: string;
  country: string;
}

export interface EmptyViewModel {
  state: 'empty';
  heading: string;
  summary: string;
}

export interface ErrorViewModel {
  state: 'error';
  heading: string;
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
  | EmptyViewModel
  | ErrorViewModel
  | HiddenViewModel;
