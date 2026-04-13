import { fetchRecommendation } from './api';
import { readConfigFromElement, resolveConfig } from './config';
import { handleFetchError, readyViewModel } from './model';
import { WidgetRenderer } from './render';
import type {
  ResolvedWidgetConfig,
  ViewModel,
  WidgetInitOptions,
  WidgetInstance,
  WidgetUpdateOptions,
} from './types';

const registry = new WeakMap<HTMLElement, SizeRecommenderWidget>();

function loadingViewModel(config: ResolvedWidgetConfig): ViewModel {
  return {
    state: 'loading',
    text: config.messages.loading,
  };
}

function canonicalizeInput<T extends WidgetInitOptions | WidgetUpdateOptions>(
  input: T,
): T {
  const productId =
    typeof input.productId === 'string'
      ? input.productId
      : typeof input.articleName === 'string'
        ? input.articleName
        : undefined;

  if (productId == null) {
    return input;
  }

  const normalized = {
    ...input,
    productId,
  } as T & { articleName?: string };

  delete normalized.articleName;
  return normalized;
}

export class SizeRecommenderWidget implements WidgetInstance {
  private input: WidgetInitOptions;
  private config: ResolvedWidgetConfig;
  private renderer: WidgetRenderer;
  private abortController: AbortController | null = null;
  private requestId = 0;

  constructor(input: WidgetInitOptions) {
    this.input = canonicalizeInput(input);
    this.config = resolveConfig(this.input);
    this.renderer = new WidgetRenderer(this.config.target);
    registry.set(this.config.target, this);
    this.config.target.dataset.sizeRecommenderActive = 'true';
    this.renderer.render(this.config, loadingViewModel(this.config));
  }

  async refresh(): Promise<void> {
    this.requestId += 1;
    const currentRequestId = this.requestId;
    this.abortController?.abort();
    this.abortController = new AbortController();
    this.renderer.render(this.config, loadingViewModel(this.config));

    try {
      const response = await fetchRecommendation(
        this.config,
        this.abortController.signal,
      );

      if (currentRequestId !== this.requestId) {
        return;
      }

      this.renderer.render(this.config, readyViewModel(response, this.config));
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        return;
      }

      if (currentRequestId !== this.requestId) {
        return;
      }

      this.renderer.render(this.config, handleFetchError(error, this.config));
    }
  }

  async update(options: WidgetUpdateOptions): Promise<void> {
    this.input = canonicalizeInput({
      ...this.input,
      ...options,
      target: this.config.target,
      messages: {
        ...this.input.messages,
        ...options.messages,
      },
    });
    this.config = resolveConfig(this.input);
    await this.refresh();
  }

  destroy(): void {
    this.abortController?.abort();
    registry.delete(this.config.target);
    this.renderer.destroy();
  }
}

export function initWidget(config: WidgetInitOptions): WidgetInstance {
  const normalizedConfig = canonicalizeInput(config);
  const resolved = resolveConfig(normalizedConfig);
  const existing = registry.get(resolved.target);

  if (existing) {
    void existing.update(normalizedConfig);
    return existing;
  }

  const widget = new SizeRecommenderWidget({
    ...normalizedConfig,
    target: resolved.target,
  });
  void widget.refresh();
  return widget;
}

export function autoInit(root: ParentNode = document): WidgetInstance[] {
  const elements = Array.from(
    root.querySelectorAll<HTMLElement>('[data-size-recommender]'),
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
