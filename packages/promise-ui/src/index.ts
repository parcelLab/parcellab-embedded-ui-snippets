import { autoInit, initWidget } from './widget';
import type {
  CarrierDisplay,
  Confidence,
  CutoffUrgency,
  CutoffVisibility,
  DateFormat,
  DateMode,
  FallbackDays,
  IconKind,
  LayoutMode,
  WidgetConfig,
  WidgetInitOptions,
  WidgetInstance,
  WidgetMessages,
  WidgetTheme,
  WidgetUpdateOptions,
  ZipPickerMode,
} from './types';

declare const __AUTO_INIT__: boolean;
declare const __VERSION__: string;

export type {
  CarrierDisplay,
  Confidence,
  CutoffUrgency,
  CutoffVisibility,
  DateFormat,
  DateMode,
  FallbackDays,
  IconKind,
  LayoutMode,
  WidgetConfig,
  WidgetInitOptions,
  WidgetInstance,
  WidgetMessages,
  WidgetTheme,
  WidgetUpdateOptions,
  ZipPickerMode,
};

export function init(config: WidgetInitOptions): WidgetInstance {
  return initWidget(config);
}

export { autoInit };

const api = {
  version: typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'dev',
  init,
  autoInit,
};

function shouldAutoInit(): boolean {
  return typeof __AUTO_INIT__ !== 'undefined' ? __AUTO_INIT__ : false;
}

function scheduleAutoInit(): void {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      autoInit();
    });
    return;
  }

  autoInit();
}

if (typeof window !== 'undefined') {
  (window as Window & { DeliveryPromise?: typeof api }).DeliveryPromise = api;

  if (shouldAutoInit()) {
    scheduleAutoInit();
  }
}

export default api;
