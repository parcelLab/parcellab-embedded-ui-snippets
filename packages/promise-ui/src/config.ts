import { getMessages } from './messages';
import type {
  DensityMode,
  LayoutMode,
  ResolvedWidgetConfig,
  SurfaceMode,
  WidgetConfig,
  WidgetInitOptions,
  WidgetMessages,
  WidgetTheme,
} from './types';

const DEFAULT_API_BASE_URL = 'https://api.parcellab.com';

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
  if (layout === 'compact' || layout === 'banner') {
    return layout;
  }

  return 'list';
}

function parseDensity(density: WidgetConfig['density']): DensityMode {
  return density === 'compact' ? 'compact' : 'comfortable';
}

function parseSurface(surface: WidgetConfig['surface']): SurfaceMode {
  return surface === 'subtle' ? 'subtle' : 'plain';
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
    calibration: config.calibration ?? '',
    locale,
    messages,
    apiBaseUrl: (config.apiBaseUrl ?? DEFAULT_API_BASE_URL).replace(/\/$/, ''),
    layout: parseLayout(config.layout),
    density: parseDensity(config.density),
    surface: parseSurface(config.surface),
    theme: config.theme ?? {},
    className: config.className?.trim() ?? '',
    showCutoff: config.showCutoff !== false,
    showCourier: config.showCourier !== false,
    showDateRange: config.showDateRange !== false,
    showIcon: config.showIcon !== false,
    zipEditable: config.zipEditable === true,
    draft: config.draft === true,
    tag: config.tag?.trim() ?? '',
    maxPredictions: config.maxPredictions ?? 5,
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

  if (dataset.layout === 'list' || dataset.layout === 'compact' || dataset.layout === 'banner') {
    config.layout = dataset.layout;
  }

  if (dataset.density === 'comfortable' || dataset.density === 'compact') {
    config.density = dataset.density;
  }

  if (dataset.surface === 'plain' || dataset.surface === 'subtle') {
    config.surface = dataset.surface;
  }

  if (dataset.className) {
    config.className = dataset.className;
  }

  if (dataset.showCutoff === 'false') {
    config.showCutoff = false;
  }

  if (dataset.showCourier === 'false') {
    config.showCourier = false;
  }

  if (dataset.showDateRange === 'false') {
    config.showDateRange = false;
  }

  if (dataset.showIcon === 'false') {
    config.showIcon = false;
  }

  if (dataset.zipEditable === 'true') {
    config.zipEditable = true;
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
