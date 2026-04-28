import { getMessages } from './messages';
import type {
  CarrierDisplay,
  Confidence,
  CutoffVisibility,
  DateFormat,
  DateMode,
  FallbackDays,
  IconKind,
  LayoutMode,
  ResolvedWidgetConfig,
  WidgetConfig,
  WidgetInitOptions,
  WidgetMessages,
  WidgetTheme,
  ZipPickerMode,
} from './types';

const DEFAULT_API_BASE_URL = 'https://api.parcellab.com';

const DEFAULT_EXPRESS_SERVICE_LEVELS = [
  'express',
  'expedited',
  'overnight',
  'next-day',
  'same-day',
  'home-delivery-express',
];

function resolveTarget(target: WidgetInitOptions['target']): HTMLElement {
  if (typeof target === 'string') {
    const element = document.querySelector<HTMLElement>(target);

    if (!element) {
      throw new Error(`DeliveryPromise target not found: ${target}`);
    }

    return element;
  }

  return target;
}

function parseAccountId(accountId: WidgetConfig['accountId']): number {
  const parsed = Number(accountId);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`Invalid accountId: ${String(accountId)}`);
  }

  return parsed;
}

function parseLayout(layout: WidgetConfig['layout']): LayoutMode {
  if (layout === 'card' || layout === 'badge') {
    return layout;
  }
  return 'text';
}

function parseIcon(icon: WidgetConfig['icon']): IconKind {
  if (icon === 'truck' || icon === 'calendar') {
    return icon;
  }
  return 'none';
}

function parseConfidence(value: WidgetConfig['confidence']): Confidence {
  if (value === 'estimated' || value === 'guaranteed') return value;
  return 'auto';
}

function parseDateFormat(value: WidgetConfig['dateFormat']): DateFormat {
  if (
    value === 'short' ||
    value === 'shortWithYear' ||
    value === 'longWithYear' ||
    value === 'relative'
  ) {
    return value;
  }
  return 'long';
}

function parseCarrier(value: WidgetConfig['showCarrier']): CarrierDisplay {
  if (value === 'inline' || value === true) return 'inline';
  return 'none';
}

function parseFallbackDays(
  value: WidgetConfig['fallbackDays'],
): FallbackDays | null {
  if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
    return Math.round(value);
  }
  if (
    Array.isArray(value) &&
    value.length === 2 &&
    Number.isFinite(value[0]) &&
    Number.isFinite(value[1]) &&
    value[0]! >= 0 &&
    value[1]! >= value[0]!
  ) {
    return [Math.round(value[0]!), Math.round(value[1]!)];
  }
  return null;
}

function parseFallbackDaysAttribute(value: string): FallbackDays | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const rangeMatch = trimmed.match(/^(\d+)\s*[-–]\s*(\d+)$/);
  if (rangeMatch) {
    const min = Number(rangeMatch[1]);
    const max = Number(rangeMatch[2]);
    return parseFallbackDays([min, max]);
  }
  const single = Number(trimmed);
  return parseFallbackDays(single);
}

function parseDateMode(dateMode: WidgetConfig['dateMode']): DateMode {
  switch (dateMode) {
    case 'on':
    case 'by':
    case 'range':
      return dateMode;
    default:
      return 'from';
  }
}

function parseZipPicker(zipPicker: WidgetConfig['zipPicker']): ZipPickerMode {
  if (zipPicker === 'inline' || zipPicker === 'link') {
    return zipPicker;
  }

  return 'none';
}

function parseShowCutoff(
  showCutoff: WidgetConfig['showCutoff'],
): CutoffVisibility {
  switch (showCutoff) {
    case 'always':
    case 'never':
    case 'express-only':
    case 'auto':
      return showCutoff;
    default:
      return 'auto';
  }
}

function parseCalibration(calibration: WidgetConfig['calibration']): string {
  if (
    calibration === 'conservative' ||
    calibration === 'balanced' ||
    calibration === 'aggressive'
  ) {
    return calibration;
  }
  return '';
}

export function resolveConfig(
  config: WidgetInitOptions,
): ResolvedWidgetConfig {
  const locale = config.locale ?? 'en';
  const baseMessages = getMessages(locale);
  const messages: WidgetMessages = {
    ...baseMessages,
    ...config.messages,
  };

  if (!config.destinationCountry?.trim()) {
    throw new Error('destinationCountry is required.');
  }

  return {
    target: resolveTarget(config.target),
    accountId: parseAccountId(config.accountId),
    destinationCountry: config.destinationCountry.trim().toUpperCase(),
    postalCode: config.postalCode?.trim() ?? '',
    courier: config.courier?.trim() ?? '',
    serviceLevel: config.serviceLevel?.trim() ?? '',
    warehouse: config.warehouse?.trim() ?? '',
    calibration: parseCalibration(config.calibration),
    tag: config.tag?.trim() ?? '',
    draft: config.draft === true,

    layout: parseLayout(config.layout),
    dateMode: parseDateMode(config.dateMode),
    zipPicker: parseZipPicker(config.zipPicker),
    showCutoff: parseShowCutoff(config.showCutoff),
    icon: parseIcon(config.icon),
    showPrice: config.showPrice === true,
    confidence: parseConfidence(config.confidence),
    dateFormat: parseDateFormat(config.dateFormat),
    showCarrier: parseCarrier(config.showCarrier),
    requireZip: config.requireZip === true,
    fallbackDays: parseFallbackDays(config.fallbackDays),
    maxPredictions: Math.max(1, config.maxPredictions ?? 5),

    locale,
    messages,
    apiBaseUrl: (config.apiBaseUrl ?? DEFAULT_API_BASE_URL).replace(/\/$/, ''),
    theme: config.theme ?? {},
    className: config.className?.trim() ?? '',
    expressServiceLevels: (
      config.expressServiceLevels ?? DEFAULT_EXPRESS_SERVICE_LEVELS
    ).map((s) => s.toLowerCase()),
  };
}

function parseJsonObject<T>(value: string | undefined): Partial<T> | undefined {
  if (!value) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(value) as Partial<T>;
    return parsed && typeof parsed === 'object' ? parsed : undefined;
  } catch (error) {
    console.warn('DeliveryPromise: failed to parse JSON config.', error);
    return undefined;
  }
}

export function readConfigFromElement(
  element: HTMLElement,
): WidgetInitOptions | null {
  const { dataset } = element;
  const accountId = dataset.accountId;
  const destinationCountry = dataset.country ?? dataset.destinationCountry;

  if (!accountId) {
    console.warn(
      'DeliveryPromise: skipping element missing data-account-id.',
      element,
    );
    return null;
  }

  if (!destinationCountry) {
    console.warn(
      'DeliveryPromise: skipping element missing data-country.',
      element,
    );
    return null;
  }

  const config: WidgetInitOptions = {
    target: element,
    accountId,
    destinationCountry,
  };

  const postalCode = dataset.postalCode ?? dataset.zip;
  if (postalCode) {
    config.postalCode = postalCode;
  }

  if (dataset.courier) {
    config.courier = dataset.courier;
  }

  if (dataset.serviceLevel) {
    config.serviceLevel = dataset.serviceLevel;
  }

  if (dataset.warehouse) {
    config.warehouse = dataset.warehouse;
  }

  if (
    dataset.calibration === 'conservative' ||
    dataset.calibration === 'balanced' ||
    dataset.calibration === 'aggressive'
  ) {
    config.calibration = dataset.calibration;
  }

  if (dataset.locale) {
    config.locale = dataset.locale;
  }

  if (dataset.apiBaseUrl) {
    config.apiBaseUrl = dataset.apiBaseUrl;
  }

  if (
    dataset.layout === 'text' ||
    dataset.layout === 'card' ||
    dataset.layout === 'badge'
  ) {
    config.layout = dataset.layout;
  }

  if (
    dataset.dateMode === 'from' ||
    dataset.dateMode === 'on' ||
    dataset.dateMode === 'by' ||
    dataset.dateMode === 'range'
  ) {
    config.dateMode = dataset.dateMode;
  }

  if (
    dataset.zipPicker === 'none' ||
    dataset.zipPicker === 'inline' ||
    dataset.zipPicker === 'link'
  ) {
    config.zipPicker = dataset.zipPicker;
  }

  if (
    dataset.showCutoff === 'auto' ||
    dataset.showCutoff === 'always' ||
    dataset.showCutoff === 'never' ||
    dataset.showCutoff === 'express-only'
  ) {
    config.showCutoff = dataset.showCutoff;
  }

  if (
    dataset.icon === 'truck' ||
    dataset.icon === 'calendar' ||
    dataset.icon === 'none'
  ) {
    config.icon = dataset.icon;
  }

  if (
    dataset.confidence === 'auto' ||
    dataset.confidence === 'estimated' ||
    dataset.confidence === 'guaranteed'
  ) {
    config.confidence = dataset.confidence;
  }

  if (
    dataset.dateFormat === 'long' ||
    dataset.dateFormat === 'longWithYear' ||
    dataset.dateFormat === 'short' ||
    dataset.dateFormat === 'shortWithYear' ||
    dataset.dateFormat === 'relative'
  ) {
    config.dateFormat = dataset.dateFormat;
  }

  if (dataset.showCarrier === 'inline' || dataset.showCarrier === 'true') {
    config.showCarrier = 'inline';
  } else if (dataset.showCarrier === 'none' || dataset.showCarrier === 'false') {
    config.showCarrier = 'none';
  }

  if (dataset.requireZip === 'true') config.requireZip = true;

  if (dataset.fallbackDays) {
    const fallback = parseFallbackDaysAttribute(dataset.fallbackDays);
    if (fallback != null) config.fallbackDays = fallback;
  }

  if (dataset.className) {
    config.className = dataset.className;
  }

  if (dataset.draft === 'true') {
    config.draft = true;
  }

  if (dataset.tag) {
    config.tag = dataset.tag;
  }

  if (dataset.maxPredictions) {
    const max = Number(dataset.maxPredictions);
    if (Number.isFinite(max) && max > 0) {
      config.maxPredictions = max;
    }
  }

  const messages = parseJsonObject<WidgetMessages>(dataset.messages);
  const theme = parseJsonObject<WidgetTheme>(dataset.theme);

  if (messages) {
    config.messages = messages;
  }

  if (theme) {
    config.theme = theme;
  }

  return config;
}
