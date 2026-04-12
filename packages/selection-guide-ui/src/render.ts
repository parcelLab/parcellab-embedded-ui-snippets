import type {
  EmptyViewModel,
  ErrorViewModel,
  FallbackTrueViewModel,
  FitCategory,
  HiddenViewModel,
  LoadingViewModel,
  ReadyViewModel,
  ResolvedWidgetConfig,
  ViewModel,
  WidgetTheme,
} from './types';

const STYLE_ID = 'pl-size-recommender-styles';
const ROOT_CLASS = 'pl-size-recommender';

const STYLES = `
  .${ROOT_CLASS},
  .${ROOT_CLASS} *,
  .${ROOT_CLASS} *::before,
  .${ROOT_CLASS} *::after {
    box-sizing: border-box;
  }

  .${ROOT_CLASS} {
    --plsr-background: #f6f6f6;
    --plsr-recommendation-background: #f8f8f8;
    --plsr-border: #e4e4e4;
    --plsr-text: #202020;
    --plsr-muted-text: #6c6c6c;
    --plsr-accent: #3b3b3b;
    --plsr-badge-background: #efefef;
    --plsr-badge-text: #333333;
    --plsr-track: #dbdbdb;
    --plsr-track-start: #dbdbdb;
    --plsr-track-end: #dbdbdb;
    --plsr-radius: 12px;
    --plsr-padding: 12px;
    --plsr-gap: 10px;
    --plsr-title-size: 0.95rem;
    --plsr-pill-size: 0.72rem;
    --plsr-label-size: 0.68rem;
    --plsr-body-size: 0.8rem;
    --plsr-summary-size: 0.76rem;
    --plsr-track-height: 6px;
    --plsr-marker-size: 12px;
    background: transparent;
    color: var(--plsr-text);
    display: grid;
    font: inherit;
    gap: var(--plsr-gap);
    line-height: 1.4;
    min-width: 0;
    overflow: hidden;
    width: 100%;
  }

  .${ROOT_CLASS}--surface-subtle {
    background: var(--plsr-background);
    border: 1px solid var(--plsr-border);
    border-radius: var(--plsr-radius);
    padding: var(--plsr-padding);
  }

  .${ROOT_CLASS}--surface-plain {
    padding: 0;
  }

  .${ROOT_CLASS}--density-comfortable {
    --plsr-padding: 16px;
    --plsr-gap: 12px;
    --plsr-title-size: 1rem;
    --plsr-pill-size: 0.76rem;
    --plsr-label-size: 0.72rem;
    --plsr-body-size: 0.84rem;
    --plsr-summary-size: 0.8rem;
    --plsr-track-height: 8px;
    --plsr-marker-size: 14px;
  }

  .${ROOT_CLASS}--neutral {
    --plsr-accent: #454545;
    --plsr-badge-background: #ececec;
    --plsr-badge-text: #303030;
    --plsr-track: #d9d9d9;
    --plsr-track-start: #d9d9d9;
    --plsr-track-end: #d9d9d9;
  }

  .${ROOT_CLASS}--colored.${ROOT_CLASS}--fit-small {
    --plsr-accent: #4f7de2;
    --plsr-badge-background: #edf3ff;
    --plsr-badge-text: #37568a;
    --plsr-track-start: #dce8ff;
    --plsr-track: #e9ebef;
    --plsr-track-end: #e9ebef;
  }

  .${ROOT_CLASS}--colored.${ROOT_CLASS}--fit-true {
    --plsr-accent: #4c8b61;
    --plsr-badge-background: #edf7ef;
    --plsr-badge-text: #315743;
    --plsr-track-start: #e7ece8;
    --plsr-track: #dde6de;
    --plsr-track-end: #e7ece8;
  }

  .${ROOT_CLASS}--colored.${ROOT_CLASS}--fit-large {
    --plsr-accent: #4f7de2;
    --plsr-badge-background: #edf3ff;
    --plsr-badge-text: #37568a;
    --plsr-track-start: #e9ebef;
    --plsr-track: #e9ebef;
    --plsr-track-end: #dce8ff;
  }

  .${ROOT_CLASS}--colored.${ROOT_CLASS}--fit-unknown {
    --plsr-accent: #6b6b6b;
    --plsr-badge-background: #efefef;
    --plsr-badge-text: #333333;
    --plsr-track-start: #e3e3e3;
    --plsr-track: #e3e3e3;
    --plsr-track-end: #e3e3e3;
  }

  .${ROOT_CLASS}--alert.${ROOT_CLASS}--fit-small {
    --plsr-accent: #cf6868;
    --plsr-badge-background: #fdf0f0;
    --plsr-badge-text: #7a4040;
    --plsr-track-start: #f8dddd;
    --plsr-track: #f0e6e6;
    --plsr-track-end: #ececec;
  }

  .${ROOT_CLASS}--alert.${ROOT_CLASS}--fit-true {
    --plsr-accent: #4c8b61;
    --plsr-badge-background: #edf7ef;
    --plsr-badge-text: #315743;
    --plsr-track-start: #e7ece8;
    --plsr-track: #dde6de;
    --plsr-track-end: #e7ece8;
  }

  .${ROOT_CLASS}--alert.${ROOT_CLASS}--fit-large {
    --plsr-accent: #cf6868;
    --plsr-badge-background: #fdf0f0;
    --plsr-badge-text: #7a4040;
    --plsr-track-start: #ececec;
    --plsr-track: #f0e6e6;
    --plsr-track-end: #f8dddd;
  }

  .${ROOT_CLASS}--alert.${ROOT_CLASS}--fit-unknown {
    --plsr-accent: #6b6b6b;
    --plsr-badge-background: #efefef;
    --plsr-badge-text: #333333;
    --plsr-track-start: #e3e3e3;
    --plsr-track: #e3e3e3;
    --plsr-track-end: #e3e3e3;
  }

  .${ROOT_CLASS}__header {
    align-items: center;
    display: flex;
    gap: 8px;
    justify-content: space-between;
  }

  .${ROOT_CLASS}__title {
    color: var(--plsr-text);
    font: inherit;
    font-size: var(--plsr-title-size);
    font-weight: 600;
    line-height: 1.3;
    margin: 0;
  }

  .${ROOT_CLASS}__pill {
    background: var(--plsr-badge-background);
    border-radius: 999px;
    color: var(--plsr-badge-text);
    flex-shrink: 0;
    font: inherit;
    font-size: var(--plsr-pill-size);
    font-weight: 500;
    line-height: 1;
    padding: 0.42rem 0.65rem;
    white-space: nowrap;
  }

  .${ROOT_CLASS}__loading {
    color: var(--plsr-muted-text);
    font-size: var(--plsr-body-size);
  }

  .${ROOT_CLASS}__scale {
    display: grid;
    gap: 6px;
  }

  .${ROOT_CLASS}__scale-labels {
    color: var(--plsr-muted-text);
    display: flex;
    font-size: var(--plsr-label-size);
    font-weight: 500;
    gap: 10px;
    justify-content: space-between;
    text-transform: none;
  }

  .${ROOT_CLASS}__scale-label {
    min-width: 0;
  }

  .${ROOT_CLASS}__scale-label--center {
    text-align: center;
  }

  .${ROOT_CLASS}__scale-label--right {
    text-align: right;
  }

  .${ROOT_CLASS}__track {
    background: var(--plsr-track);
    border-radius: 999px;
    height: var(--plsr-track-height);
    overflow: visible;
    position: relative;
  }

  .${ROOT_CLASS}--colored .${ROOT_CLASS}__track,
  .${ROOT_CLASS}--alert .${ROOT_CLASS}__track {
    background: linear-gradient(
      90deg,
      var(--plsr-track-start) 0%,
      var(--plsr-track) 50%,
      var(--plsr-track-end) 100%
    );
  }

  .${ROOT_CLASS}__marker {
    background: var(--plsr-accent);
    border: 2px solid var(--plsr-background);
    border-radius: 999px;
    box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.03);
    height: var(--plsr-marker-size);
    left: 50%;
    position: absolute;
    top: 50%;
    transform: translate(-50%, -50%);
    width: var(--plsr-marker-size);
  }

  .${ROOT_CLASS}__recommendation {
    background: var(--plsr-recommendation-background);
    border: 1px solid var(--plsr-border);
    border-radius: calc(var(--plsr-radius) - 2px);
    display: grid;
    gap: 5px;
    padding: 10px 12px;
  }

  .${ROOT_CLASS}__recommendation-header {
    align-items: center;
    column-gap: 10px;
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    row-gap: 4px;
  }

  .${ROOT_CLASS}__recommendation-title-row {
    align-items: center;
    display: inline-flex;
    gap: 8px;
    min-width: 0;
  }

  .${ROOT_CLASS}__recommendation-icon {
    color: var(--plsr-accent);
    display: inline-flex;
    flex: 0 0 auto;
    height: 16px;
    width: 16px;
  }

  .${ROOT_CLASS}__recommendation-icon svg {
    display: block;
    height: 100%;
    width: 100%;
  }

  .${ROOT_CLASS}__recommendation-title {
    color: var(--plsr-text);
    font: inherit;
    font-size: var(--plsr-body-size);
    font-weight: 600;
    line-height: 1.35;
    margin: 0;
  }

  .${ROOT_CLASS}__recommendation-meta {
    color: var(--plsr-muted-text);
    font-size: var(--plsr-summary-size);
  }

  .${ROOT_CLASS}__recommendation-summary {
    color: var(--plsr-muted-text);
    font: inherit;
    font-size: var(--plsr-summary-size);
    line-height: 1.5;
    margin: 0;
    overflow-wrap: anywhere;
  }

  @media (max-width: 520px) {
    .${ROOT_CLASS}__header {
      align-items: flex-start;
      flex-direction: column;
    }

    .${ROOT_CLASS}__pill {
      white-space: normal;
    }

    .${ROOT_CLASS}__recommendation-header {
      align-items: flex-start;
      flex-direction: column;
    }
  }
`;

const THEME_VARIABLES: Record<keyof WidgetTheme, string> = {
  backgroundColor: '--plsr-background',
  recommendationBackgroundColor: '--plsr-recommendation-background',
  borderColor: '--plsr-border',
  textColor: '--plsr-text',
  mutedTextColor: '--plsr-muted-text',
  accentColor: '--plsr-accent',
  badgeBackgroundColor: '--plsr-badge-background',
  badgeTextColor: '--plsr-badge-text',
  trackColor: '--plsr-track',
  trackStartColor: '--plsr-track-start',
  trackEndColor: '--plsr-track-end',
  radius: '--plsr-radius',
};

function ensureStyles(): void {
  if (document.getElementById(STYLE_ID)) {
    return;
  }

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = STYLES;
  document.head.appendChild(style);
}

function createElement<K extends keyof HTMLElementTagNameMap>(
  tagName: K,
  className?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tagName);

  if (className) {
    element.className = className;
  }

  if (text) {
    element.textContent = text;
  }

  return element;
}

function fitClass(fitCategory: FitCategory): string {
  switch (fitCategory) {
    case 'small':
      return `${ROOT_CLASS}--fit-small`;
    case 'true':
      return `${ROOT_CLASS}--fit-true`;
    case 'large':
      return `${ROOT_CLASS}--fit-large`;
    default:
      return `${ROOT_CLASS}--fit-unknown`;
  }
}

function viewModelFitCategory(viewModel: ViewModel): FitCategory {
  switch (viewModel.state) {
    case 'ready':
    case 'fallback-true':
      return viewModel.fitCategory;
    default:
      return 'unknown';
  }
}

function rootClassName(
  config: ResolvedWidgetConfig,
  viewModel: ViewModel,
): string {
  const classes = [
    ROOT_CLASS,
    `${ROOT_CLASS}--${config.appearance}`,
    `${ROOT_CLASS}--density-${config.density}`,
    `${ROOT_CLASS}--surface-${config.surface}`,
    `${ROOT_CLASS}--state-${viewModel.state}`,
    fitClass(viewModelFitCategory(viewModel)),
  ];

  if (config.className) {
    classes.push(...config.className.split(/\s+/).filter(Boolean));
  }

  return classes.join(' ');
}

function applyTheme(root: HTMLElement, theme: Partial<WidgetTheme>): void {
  const typedKeys = Object.keys(THEME_VARIABLES) as Array<keyof WidgetTheme>;

  for (const key of typedKeys) {
    const variable = THEME_VARIABLES[key];
    const value = theme[key];

    if (value) {
      root.style.setProperty(variable, value);
    } else {
      root.style.removeProperty(variable);
    }
  }
}

function appendHeader(
  container: HTMLElement,
  config: ResolvedWidgetConfig,
  pillText?: string,
): void {
  const header = createElement('div', `${ROOT_CLASS}__header`);
  const title = createElement('h2', `${ROOT_CLASS}__title`, config.messages.title);
  header.appendChild(title);

  if (pillText && config.showPill) {
    header.appendChild(
      createElement('div', `${ROOT_CLASS}__pill`, pillText),
    );
  }

  container.appendChild(header);
}

function appendScale(
  container: HTMLElement,
  config: ResolvedWidgetConfig,
  position: number,
): void {
  const scale = createElement('div', `${ROOT_CLASS}__scale`);
  const labels = createElement('div', `${ROOT_CLASS}__scale-labels`);
  labels.appendChild(
    createElement(
      'span',
      `${ROOT_CLASS}__scale-label ${ROOT_CLASS}__scale-label--left`,
      config.messages.runsSmallLabel,
    ),
  );
  labels.appendChild(
    createElement(
      'span',
      `${ROOT_CLASS}__scale-label ${ROOT_CLASS}__scale-label--center`,
      config.messages.trueToSizeLabel,
    ),
  );
  labels.appendChild(
    createElement(
      'span',
      `${ROOT_CLASS}__scale-label ${ROOT_CLASS}__scale-label--right`,
      config.messages.runsLargeLabel,
    ),
  );
  scale.appendChild(labels);

  const track = createElement('div', `${ROOT_CLASS}__track`);
  const marker = createElement('div', `${ROOT_CLASS}__marker`);
  marker.style.left = `${((position + 1) / 2) * 100}%`;
  marker.setAttribute(
    'aria-label',
    `${config.messages.title}: ${Math.round(((position + 1) / 2) * 100)}%`,
  );
  track.appendChild(marker);
  scale.appendChild(track);

  container.appendChild(scale);
}

function recommendationIcon(fitCategory?: FitCategory): HTMLElement | null {
  if (!fitCategory || fitCategory === 'unknown') {
    return null;
  }

  const icon = createElement('div', `${ROOT_CLASS}__recommendation-icon`);
  icon.setAttribute('aria-hidden', 'true');

  const svgPath =
    fitCategory === 'small'
      ? '<path fill-rule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm-.75-4.75a.75.75 0 0 0 1.5 0V8.66l1.95 2.1a.75.75 0 1 0 1.1-1.02l-3.25-3.5a.75.75 0 0 0-1.1 0L6.2 9.74a.75.75 0 1 0 1.1 1.02l1.95-2.1v4.59Z" clip-rule="evenodd" />'
      : fitCategory === 'large'
        ? '<path fill-rule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm.75-11.25a.75.75 0 0 0-1.5 0v4.59L7.3 9.24a.75.75 0 0 0-1.1 1.02l3.25 3.5a.75.75 0 0 0 1.1 0l3.25-3.5a.75.75 0 1 0-1.1-1.02l-1.95 2.1V6.75Z" clip-rule="evenodd" />'
        : '<path fill-rule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM6.75 9.25a.75.75 0 0 0 0 1.5h6.5a.75.75 0 0 0 0-1.5h-6.5Z" clip-rule="evenodd" />';

  icon.innerHTML = `<svg viewBox="0 0 20 20" fill="currentColor" role="presentation">${svgPath}</svg>`;
  return icon;
}

function appendRecommendation(
  container: HTMLElement,
  heading: string,
  summary: string,
  fitCategory?: FitCategory,
  confidenceText?: string,
  showSummary = true,
): void {
  const recommendation = createElement('section', `${ROOT_CLASS}__recommendation`);
  const header = createElement('div', `${ROOT_CLASS}__recommendation-header`);
  const titleRow = createElement('div', `${ROOT_CLASS}__recommendation-title-row`);
  const icon = recommendationIcon(fitCategory);

  if (icon) {
    titleRow.appendChild(icon);
  }

  titleRow.appendChild(
    createElement('h3', `${ROOT_CLASS}__recommendation-title`, heading),
  );
  header.appendChild(titleRow);

  if (confidenceText) {
    header.appendChild(
      createElement(
        'div',
        `${ROOT_CLASS}__recommendation-meta`,
        confidenceText,
      ),
    );
  }

  recommendation.appendChild(header);

  if (showSummary) {
    recommendation.appendChild(
      createElement('p', `${ROOT_CLASS}__recommendation-summary`, summary),
    );
  }

  container.appendChild(recommendation);
}

function renderLoading(
  mount: HTMLElement,
  config: ResolvedWidgetConfig,
  viewModel: LoadingViewModel,
): void {
  appendHeader(mount, config);
  const loading = createElement(
    'div',
    `${ROOT_CLASS}__loading`,
    viewModel.text,
  );
  loading.setAttribute('role', 'status');
  mount.appendChild(loading);
}

function renderReadyLike(
  mount: HTMLElement,
  config: ResolvedWidgetConfig,
  viewModel: ReadyViewModel | FallbackTrueViewModel,
): void {
  appendHeader(mount, config, viewModel.pillText);

  if (config.showScale) {
    appendScale(mount, config, viewModel.position);
  }

  if (config.showRecommendation) {
    appendRecommendation(
      mount,
      viewModel.recommendationHeading,
      viewModel.summary,
      viewModel.fitCategory,
      'confidenceText' in viewModel ? viewModel.confidenceText : undefined,
      config.showSummary,
    );
  }
}

function renderMessageOnly(
  mount: HTMLElement,
  config: ResolvedWidgetConfig,
  viewModel: EmptyViewModel | ErrorViewModel,
): void {
  appendHeader(mount, config, viewModel.pillText);

  if (config.showRecommendation) {
    appendRecommendation(
      mount,
      viewModel.recommendationHeading,
      viewModel.summary,
      undefined,
      undefined,
      config.showSummary,
    );
  }
}

export class WidgetRenderer {
  private host: HTMLElement;

  private mount: HTMLElement;

  constructor(host: HTMLElement) {
    ensureStyles();
    this.host = host;

    const existingMount = host.querySelector<HTMLElement>('[data-size-recommender-root]');

    if (existingMount) {
      this.mount = existingMount;
    } else {
      this.mount = createElement('div');
      this.mount.dataset.sizeRecommenderRoot = 'true';
      host.replaceChildren(this.mount);
    }

    host.classList.add(`${ROOT_CLASS}-host`);
  }

  render(config: ResolvedWidgetConfig, viewModel: ViewModel): void {
    if (viewModel.state === 'hidden') {
      this.mount.className = rootClassName(config, viewModel);
      this.mount.replaceChildren();
      this.mount.style.display = 'none';
      return;
    }

    this.mount.style.display = '';
    this.mount.className = rootClassName(config, viewModel);
    applyTheme(this.mount, config.theme);
    this.mount.replaceChildren();

    switch (viewModel.state) {
      case 'loading':
        renderLoading(this.mount, config, viewModel);
        break;
      case 'ready':
      case 'fallback-true':
        renderReadyLike(this.mount, config, viewModel);
        break;
      case 'empty':
      case 'error':
        renderMessageOnly(this.mount, config, viewModel);
        break;
    }
  }

  destroy(): void {
    this.host.replaceChildren();
    this.host.classList.remove(`${ROOT_CLASS}-host`);
    this.host.removeAttribute('data-size-recommender-active');
  }
}