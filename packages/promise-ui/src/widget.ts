import { fetchPrediction, fetchPublicIp } from './api';
import { readConfigFromElement, resolveConfig } from './config';
import { handleFetchError, linkViewModel, readyViewModel } from './model';
import { WidgetRenderer } from './render';
import {
  FetchError,
  type PromiseLocation,
  type ResolvedWidgetConfig,
  type ViewModel,
  type WidgetInitOptions,
  type WidgetInstance,
  type WidgetUpdateOptions,
} from './types';

const registry = new WeakMap<HTMLElement, DeliveryPromiseWidget>();

const ZIP_STORAGE_KEY = 'pl-promise-zip';
const ZIP_STORAGE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function readLocation(value: unknown): PromiseLocation | null {
  if (!value || typeof value !== 'object') return null;
  const location = value as Partial<PromiseLocation>;
  if (typeof location.country !== 'string' || !/^[A-Z]{3}$/.test(location.country) ||
      (location.zip !== null && typeof location.zip !== 'string')) return null;
  return {
    country: location.country,
    region: typeof location.region === 'string' ? location.region : '',
    zip: location.zip === '0' ? null : location.zip,
  };
}

function loadingViewModel(config: ResolvedWidgetConfig): ViewModel {
  return {
    state: 'loading',
    text: config.messages.loading,
  };
}

function persistZip(postalCode: string, destinationCountry: string): void {
  try {
    localStorage.setItem(ZIP_STORAGE_KEY, JSON.stringify({
      postalCode,
      destinationCountry,
      expiresAt: Date.now() + ZIP_STORAGE_TTL_MS,
    }));
  } catch {
    // localStorage may be unavailable
  }
}

function loadPersistedZip(destinationCountry: string): { postalCode: string; destinationCountry?: string } {
  try {
    const stored = localStorage.getItem(ZIP_STORAGE_KEY) ?? '';
    if (!stored) return { postalCode: '' };
    const destination = stored.startsWith('{')
      ? JSON.parse(stored)
      : { postalCode: stored, destinationCountry: destinationCountry.trim().toUpperCase() };
    if (typeof destination.postalCode === 'string' &&
        typeof destination.destinationCountry === 'string' &&
        /^[A-Z]{3}$/.test(destination.destinationCountry)) {
      if (destination.expiresAt === undefined) {
        // Older values have no timestamp; start their expiry on first use.
        persistZip(destination.postalCode, destination.destinationCountry);
      } else if (!Number.isFinite(destination.expiresAt) || destination.expiresAt <= Date.now()) {
        localStorage.removeItem(ZIP_STORAGE_KEY);
        return { postalCode: '' };
      }
      return {
        postalCode: destination.postalCode,
        destinationCountry: destination.destinationCountry,
      };
    }
    return { postalCode: '' };
  } catch {
    return { postalCode: '' };
  }
}

export class DeliveryPromiseWidget implements WidgetInstance {
  private input: WidgetInitOptions;
  private config: ResolvedWidgetConfig;
  private renderer: WidgetRenderer;
  private abortController: AbortController | null = null;
  private requestId = 0;
  private destroyed = false;
  private estimatedLocation: PromiseLocation | null = null;
  private countrySelected = false;

  constructor(input: WidgetInitOptions) {
    this.input = { ...input };

    if (!this.input.postalCode) {
      const persisted = loadPersistedZip(this.input.destinationCountry);
      if (persisted.postalCode || persisted.destinationCountry) {
        this.input.postalCode = persisted.postalCode;
        this.input.destinationCountry = persisted.destinationCountry ?? this.input.destinationCountry;
        this.countrySelected = !!persisted.destinationCountry;
      }
    }

    this.config = resolveConfig(this.input);
    this.renderer = new WidgetRenderer(this.config.target);
    this.renderer.setZipChangeHandler((zip) => {
      void this.handleZipChange(zip);
    });
    this.renderer.setCountryChangeHandler((country) => {
      persistZip('', country);
      void this.update({ destinationCountry: country, postalCode: '' });
    });
    registry.set(this.config.target, this);
    this.config.target.dataset.promiseActive = 'true';
    this.renderer.render(this.config, loadingViewModel(this.config));
  }

  private async handleZipChange(zip: string): Promise<void> {
    const country = this.estimatedLocation?.country ?? this.config.destinationCountry;
    persistZip(zip, country);
    await this.update({
      postalCode: zip,
      destinationCountry: country,
    });
  }

  async refresh(): Promise<void> {
    if (this.destroyed) return;
    this.requestId += 1;
    const currentRequestId = this.requestId;
    this.abortController?.abort();
    this.abortController = new AbortController();
    const signal = this.abortController.signal;
    let config = this.estimatedLocation
      ? {
          ...this.config,
          destinationCountry: this.estimatedLocation.country,
          postalCode: this.estimatedLocation.zip ?? '',
        }
      : this.config;
    const resolvingIp = config.ipFetch && !config.postalCode && !this.estimatedLocation && !this.countrySelected;
    const fallbackLocation: PromiseLocation = { country: config.destinationCountry, region: '', zip: null };

    if (config.requireZip && !config.postalCode && (!config.ipFetch || this.countrySelected)) {
      this.renderer.render(config, linkViewModel(config), this.estimatedLocation !== null);
      return;
    }

    this.renderer.render(config, loadingViewModel(config), this.estimatedLocation !== null);

    try {
      let destinationIp = resolvingIp ? config.ipAddress || await fetchPublicIp(config.apiBaseUrl, signal) : '';
      if (signal.aborted) return;
      if (resolvingIp && !destinationIp) this.estimatedLocation = fallbackLocation;
      if (config.requireZip && !config.postalCode && !destinationIp) {
        this.renderer.render(config, linkViewModel(config), this.estimatedLocation !== null);
        return;
      }

      let response;
      try {
        response = await fetchPrediction(config, signal, destinationIp);
      } catch (error) {
        if (!destinationIp || !(error instanceof FetchError) || error.code !== 'not-found') {
          throw error;
        }
        if (signal.aborted) return;
        if (readLocation(error.location)) {
          response = { requestId: '', success: false, prediction: [], location: error.location };
        } else {
          this.estimatedLocation = fallbackLocation;
          if (config.requireZip) {
            this.renderer.render(config, linkViewModel(config), true);
            return;
          }
          destinationIp = '';
          response = await fetchPrediction(config, signal);
        }
      }

      if (this.destroyed || currentRequestId !== this.requestId) {
        return;
      }

      const location = readLocation(response.location);
      if (resolvingIp && location) {
        this.estimatedLocation = location;
        config = {
          ...config,
          destinationCountry: location.country,
          postalCode: this.estimatedLocation.zip ?? '',
        };
      }
      if (config.requireZip && !config.postalCode) {
        this.renderer.render(config, linkViewModel(config), this.estimatedLocation !== null);
        return;
      }
      this.renderer.render(config, readyViewModel(response, config, this.estimatedLocation !== null), this.estimatedLocation !== null);
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        return;
      }

      if (this.destroyed || currentRequestId !== this.requestId) {
        return;
      }

      if (resolvingIp && !this.estimatedLocation) {
        this.estimatedLocation = error instanceof FetchError ? readLocation(error.location) : null;
        this.estimatedLocation ??= fallbackLocation;
        config = { ...config, destinationCountry: this.estimatedLocation.country, postalCode: this.estimatedLocation.zip ?? '' };
      }
      this.renderer.render(config, handleFetchError(error, config), this.estimatedLocation !== null);
    }
  }

  async update(options: WidgetUpdateOptions): Promise<void> {
    if (options.postalCode !== undefined || options.destinationCountry !== undefined ||
        options.ipAddress !== undefined || options.ipFetch === false) {
      this.estimatedLocation = null;
    }
    if (options.ipAddress !== undefined) this.countrySelected = false;
    if (options.postalCode !== undefined || options.destinationCountry !== undefined) {
      this.countrySelected = options.destinationCountry !== undefined;
    }
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
