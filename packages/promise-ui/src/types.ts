export type WidgetTarget = string | HTMLElement;

export type LayoutMode = 'text' | 'card' | 'badge';

export type IconKind = 'none' | 'truck' | 'calendar';

export type DateMode =
  | 'from'   // "Estimated delivery as early as {earliest}"
  | 'on'     // "Estimated delivery on {mostLikely}"
  | 'by'     // "Estimated delivery by {latest}" (smart estimated/guaranteed verb)
  | 'range'; // "Estimated delivery {earliest} – {latest}"

export type Confidence = 'auto' | 'estimated' | 'guaranteed';

export type DateFormat =
  | 'long'           // "Wednesday, Apr 29"
  | 'longWithYear'   // "Wednesday, Apr 29, 2026"
  | 'short'          // "Wed, Apr 29"
  | 'shortWithYear'  // "Wed, Apr 29, 2026"
  | 'relative';      // "Today" / "Tomorrow" / "In 4 days"

export type CarrierDisplay = 'none' | 'inline';

export type CutoffVisibility = 'auto' | 'always' | 'never' | 'express-only';

export type ZipPickerMode = 'none' | 'inline' | 'link';

export type CutoffUrgency = 'none' | 'low' | 'medium' | 'high';

/** Static fallback shown when the API errors out or returns nothing. */
export type FallbackDays = number | [number, number];

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
  linkColor: string;
  radius: string;
}

export interface WidgetMessages {
  // Text layout — estimated / guaranteed variants
  summaryEstimatedFrom: string;
  summaryEstimatedOn: string;
  summaryEstimatedBy: string;
  summaryEstimatedRange: string;
  summaryGuaranteedFrom: string;
  summaryGuaranteedOn: string;
  summaryGuaranteedBy: string;
  summaryGuaranteedRange: string;

  // Card eyebrow heading — estimated / guaranteed variants
  cardHeadingEstimatedFrom: string;
  cardHeadingEstimatedOn: string;
  cardHeadingEstimatedBy: string;
  cardHeadingEstimatedRange: string;
  cardHeadingGuaranteedFrom: string;
  cardHeadingGuaranteedOn: string;
  cardHeadingGuaranteedBy: string;
  cardHeadingGuaranteedRange: string;

  // Carrier annotation, e.g. "via DHL"
  viaCarrier: string;

  // Static fallback when API errors and fallbackDays is configured
  fallbackRange: string;       // "Delivery in {min}–{max} business days"
  fallbackSingle: string;      // "Delivery in {count} business day"

  // Relative date words
  relativeToday: string;
  relativeTomorrow: string;
  relativeInDays: string;

  // Cutoff line — only the time, no second date
  cutoffSentence: string;      // "Order within {cutoff}"

  // Deliver-to label
  deliverTo: string;

  // Zip picker
  zipPromptCta: string;
  zipPromptHint: string;
  zipPlaceholder: string;
  applyZip: string;
  changeZip: string;

  // States
  loading: string;
  noDataHeading: string;
  noDataSummary: string;
  errorHeading: string;
  errorSummary: string;

  // Days text
  dayRange: string;
  singleDay: string;
}

export interface WidgetConfig {
  target: WidgetTarget;
  accountId: number | string;
  destinationCountry: string;
  postalCode?: string;

  // Filter fields composed into the API call
  courier?: string;
  serviceLevel?: string;
  warehouse?: string;
  calibration?: 'conservative' | 'balanced' | 'aggressive';
  tag?: string;
  draft?: boolean;

  // Presentation
  layout?: LayoutMode;
  dateMode?: DateMode;
  zipPicker?: ZipPickerMode;
  showCutoff?: CutoffVisibility;
  icon?: IconKind;
  showPrice?: boolean;  // placeholder — host-provided, not from API

  // Confidence verb: 'auto' picks "Guaranteed" for express services, else "Estimated"
  confidence?: Confidence;
  // Date format including whether to include the year explicitly
  dateFormat?: DateFormat;
  // 'inline' renders "via DHL" next to the summary; 'none' hides the carrier
  showCarrier?: CarrierDisplay | boolean;
  // When true and no postal code is set, render a "Get delivery date" CTA instead of
  // calling the API at country level. Replaces the old layout='link'.
  requireZip?: boolean;

  // Static fallback shown when the API errors out, e.g. 3 → "Delivery in 3 business days"
  // or [2, 3] → "Delivery in 2–3 business days"
  fallbackDays?: FallbackDays;

  maxPredictions?: number;

  // i18n + theming
  locale?: string;
  messages?: Partial<WidgetMessages>;
  apiBaseUrl?: string;
  theme?: Partial<WidgetTheme>;
  className?: string;

  // Express service level tags — used for showCutoff='express-only' and 'auto'
  expressServiceLevels?: string[];
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
  tag: string;
  draft: boolean;

  layout: LayoutMode;
  dateMode: DateMode;
  zipPicker: ZipPickerMode;
  showCutoff: CutoffVisibility;
  icon: IconKind;
  showPrice: boolean;
  confidence: Confidence;
  dateFormat: DateFormat;
  showCarrier: CarrierDisplay;
  requireZip: boolean;
  fallbackDays: FallbackDays | null;
  maxPredictions: number;

  locale: string;
  messages: WidgetMessages;
  apiBaseUrl: string;
  theme: Partial<WidgetTheme>;
  className: string;
  expressServiceLevels: string[];
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
  courier: string;
  courierName: string;
  serviceLevels: string[];
  // Localized display strings (e.g. "Donnerstag, 24.04.2026")
  earliestDate: string;
  latestDate: string;
  mostLikelyDate: string;
  // ISO YYYY-MM-DD — used for sorting and comparison
  earliestIso: string;
  latestIso: string;
  mostLikelyIso: string;
  cutoffMinutes: number;
  cutoffText: string;
  cutoffUrgency: CutoffUrgency;
  cutoffSentence: string;
  isExpress: boolean;
  showCutoff: boolean;
  daysMin: number;
  daysMax: number;
  // True when the date for this option is now "guaranteed" rather than "estimated"
  isGuaranteed: boolean;
}

export interface ReadyViewModel {
  state: 'ready';
  predictions: PredictionViewModel[];
  primary: PredictionViewModel;
  summaryText: string;
  summaryDateText: string;
  postalCode: string;
  country: string;
}

export interface LinkViewModel {
  state: 'link';
  cta: string;
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

export interface FallbackViewModel {
  state: 'fallback';
  text: string;
  isGuaranteed: boolean;
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
  | LinkViewModel
  | EmptyViewModel
  | ErrorViewModel
  | FallbackViewModel
  | HiddenViewModel;
