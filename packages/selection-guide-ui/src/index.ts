import { autoInit, initWidget } from './widget';
import type {
  AppearanceMode,
  DensityMode,
  SurfaceMode,
  WidgetConfig,
  WidgetInitOptions,
  WidgetInstance,
  WidgetMessages,
  WidgetTheme,
  WidgetUpdateOptions,
} from './types';

declare const __AUTO_INIT__: boolean;
declare const __VERSION__: string;

export type {
  AppearanceMode,
  DensityMode,
  SurfaceMode,
  WidgetConfig,
  WidgetInitOptions,
  WidgetInstance,
  WidgetMessages,
  WidgetTheme,
  WidgetUpdateOptions,
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
  (window as Window & { SizeRecommender?: typeof api }).SizeRecommender = api;

  if (shouldAutoInit()) {
    scheduleAutoInit();
  }
}

export default api;
