import { fetchPrediction } from './api';
import { readConfigFromElement, resolveConfig } from './config';
import { handleFetchError, linkViewModel, readyViewModel } from './model';
import { WidgetRenderer } from './render';
import type {
  ResolvedWidgetConfig,
  ViewModel,
  WidgetInitOptions,
  WidgetInstance,
  WidgetUpdateOptions,
} from './types';

const registry = new WeakMap<HTMLElement, DeliveryPromiseWidget>();

const ZIP_STORAGE_KEY = 'pl-promise-zip';

function loadingViewModel(config: ResolvedWidgetConfig): ViewModel {
  return {
    state: 'loading',
    text: config.messages.loading,
  };
}

function persistZip(zip: string): void {
  try {
    localStorage.setItem(ZIP_STORAGE_KEY, zip);
  } catch {
    // localStorage may be unavailable
  }
}

function loadPersistedZip(): string {
  try {
    return localStorage.getItem(ZIP_STORAGE_KEY) ?? '';
  } catch {
    return '';
  }
}

export class DeliveryPromiseWidget implements WidgetInstance {
  private input: WidgetInitOptions;
  private config: ResolvedWidgetConfig;
  private renderer: WidgetRenderer;
  private abortController: AbortController | null = null;
  private requestId = 0;
  private destroyed = false;

  constructor(input: WidgetInitOptions) {
    this.input = { ...input };

    if (!this.input.postalCode) {
      const persisted = loadPersistedZip();
      if (persisted) {
        this.input.postalCode = persisted;
      }
    }

    this.config = resolveConfig(this.input);
    this.renderer = new WidgetRenderer(this.config.target);
    this.renderer.setZipChangeHandler((zip) => {
      void this.handleZipChange(zip);
    });
    registry.set(this.config.target, this);
    this.config.target.dataset.promiseActive = 'true';
    this.renderer.render(this.config, loadingViewModel(this.config));
  }

  private async handleZipChange(zip: string): Promise<void> {
    persistZip(zip);
    await this.update({ postalCode: zip });
  }

  async refresh(): Promise<void> {
    if (this.destroyed) return;
    this.requestId += 1;
    const currentRequestId = this.requestId;
    this.abortController?.abort();
    this.abortController = new AbortController();

    // requireZip without a postal code: show CTA, skip API call entirely
    if (this.config.requireZip && !this.config.postalCode) {
      this.renderer.render(this.config, linkViewModel(this.config));
      return;
    }

    this.renderer.render(this.config, loadingViewModel(this.config));

    try {
      const response = await fetchPrediction(
        this.config,
        this.abortController.signal,
      );

      if (this.destroyed || currentRequestId !== this.requestId) {
        return;
      }

      this.renderer.render(this.config, readyViewModel(response, this.config));
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        return;
      }

      if (this.destroyed || currentRequestId !== this.requestId) {
        return;
      }

      this.renderer.render(this.config, handleFetchError(error, this.config));
    }
  }

  async update(options: WidgetUpdateOptions): Promise<void> {
    this.input = {
      ...this.input,
      ...options,
      target: this.config.target,
      messages: {
        ...this.input.messages,
        ...options.messages,
      },
    };
    this.config = resolveConfig(this.input);
    await this.refresh();
  }

  destroy(): void {
    this.destroyed = true;
    this.abortController?.abort();
    registry.delete(this.config.target);
    this.renderer.destroy();
  }
}

export function initWidget(config: WidgetInitOptions): WidgetInstance {
  const resolved = resolveConfig(config);
  const existing = registry.get(resolved.target);

  if (existing) {
    void existing.update(config);
    return existing;
  }

  const widget = new DeliveryPromiseWidget({
    ...config,
    target: resolved.target,
  });
  void widget.refresh();
  return widget;
}

export function autoInit(root: ParentNode = document): WidgetInstance[] {
  const elements = Array.from(
    root.querySelectorAll<HTMLElement>('[data-promise]'),
  );

  return elements
    .map((element) => {
      const config = readConfigFromElement(element);

      if (!config) {
        return null;
      }

      return initWidget(config);
    })
    .filter((instance): instance is WidgetInstance => instance != null);
}
