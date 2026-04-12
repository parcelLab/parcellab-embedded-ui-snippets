import type {
  CutoffUrgency,
  EmptyViewModel,
  ErrorViewModel,
  HiddenViewModel,
  LoadingViewModel,
  PredictionViewModel,
  ReadyViewModel,
  ResolvedWidgetConfig,
  ViewModel,
  WidgetTheme,
} from './types';

const STYLE_ID = 'pl-promise-styles';
const ROOT_CLASS = 'pl-promise';

const STYLES = `
  .${ROOT_CLASS},
  .${ROOT_CLASS} *,
  .${ROOT_CLASS} *::before,
  .${ROOT_CLASS} *::after {
    box-sizing: border-box;
  }

  .${ROOT_CLASS} {
    --plp-background: #f6f6f6;
    --plp-card-background: #ffffff;
    --plp-border: #e4e4e4;
    --plp-text: #1a1a1a;
    --plp-muted-text: #6c6c6c;
    --plp-accent: #3D3AD3;
    --plp-urgent: #F4373D;
    --plp-success: #035740;
    --plp-icon: #3D3AD3;
    --plp-radius: 12px;
    --plp-padding: 12px;
    --plp-gap: 10px;
    --plp-title-size: 0.88rem;
    --plp-date-size: 0.92rem;
    --plp-body-size: 0.8rem;
    --plp-small-size: 0.72rem;
    --plp-courier-size: 0.72rem;
    background: transparent;
    color: var(--plp-text);
    display: grid;
    font: inherit;
    gap: var(--plp-gap);
    line-height: 1.45;
    min-width: 0;
    overflow: hidden;
    width: 100%;
  }

  .${ROOT_CLASS}--surface-subtle {
    background: var(--plp-background);
    border: 1px solid var(--plp-border);
    border-radius: var(--plp-radius);
    padding: var(--plp-padding);
  }

  .${ROOT_CLASS}--surface-plain {
    padding: 0;
  }

  .${ROOT_CLASS}--density-comfortable {
    --plp-padding: 16px;
    --plp-gap: 12px;
    --plp-title-size: 0.92rem;
    --plp-date-size: 1rem;
    --plp-body-size: 0.84rem;
    --plp-small-size: 0.76rem;
    --plp-courier-size: 0.76rem;
  }

  .${ROOT_CLASS}--density-compact {
    --plp-padding: 8px;
    --plp-gap: 6px;
    --plp-title-size: 0.82rem;
    --plp-date-size: 0.86rem;
    --plp-body-size: 0.76rem;
    --plp-small-size: 0.68rem;
    --plp-courier-size: 0.68rem;
  }

  /* Header */
  .${ROOT_CLASS}__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    flex-wrap: wrap;
  }

  .${ROOT_CLASS}__title {
    font-size: var(--plp-title-size);
    font-weight: 600;
    color: var(--plp-text);
    margin: 0;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .${ROOT_CLASS}__title-icon {
    flex-shrink: 0;
    width: 18px;
    height: 18px;
    color: var(--plp-icon);
  }

  /* Zip editor */
  .${ROOT_CLASS}__zip {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: var(--plp-small-size);
    color: var(--plp-muted-text);
  }

  .${ROOT_CLASS}__zip-label {
    white-space: nowrap;
  }

  .${ROOT_CLASS}__zip-value {
    font-weight: 500;
    color: var(--plp-text);
  }

  .${ROOT_CLASS}__zip-btn {
    background: none;
    border: none;
    cursor: pointer;
    color: var(--plp-accent);
    font: inherit;
    font-size: var(--plp-small-size);
    padding: 0 2px;
    text-decoration: underline;
    text-decoration-style: dotted;
    text-underline-offset: 2px;
  }

  .${ROOT_CLASS}__zip-btn:hover {
    text-decoration-style: solid;
  }

  .${ROOT_CLASS}__zip-form {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .${ROOT_CLASS}__zip-input {
    font: inherit;
    font-size: var(--plp-small-size);
    padding: 3px 6px;
    border: 1px solid var(--plp-border);
    border-radius: 4px;
    width: 80px;
    color: var(--plp-text);
    background: var(--plp-card-background);
    outline: none;
    transition: border-color 0.15s;
  }

  .${ROOT_CLASS}__zip-input:focus {
    border-color: var(--plp-accent);
  }

  .${ROOT_CLASS}__zip-submit {
    background: var(--plp-accent);
    border: none;
    cursor: pointer;
    color: #fff;
    font: inherit;
    font-size: var(--plp-small-size);
    font-weight: 500;
    padding: 3px 8px;
    border-radius: 4px;
    transition: opacity 0.15s;
  }

  .${ROOT_CLASS}__zip-submit:hover {
    opacity: 0.85;
  }

  /* Predictions list */
  .${ROOT_CLASS}__predictions {
    display: grid;
    gap: var(--plp-gap);
  }

  /* Single prediction card */
  .${ROOT_CLASS}__card {
    display: grid;
    gap: 4px;
    background: var(--plp-card-background);
    border: 1px solid var(--plp-border);
    border-radius: calc(var(--plp-radius) - 2px);
    padding: var(--plp-padding);
    transition: border-color 0.15s;
  }

  .${ROOT_CLASS}--surface-plain .${ROOT_CLASS}__card {
    border-color: var(--plp-border);
  }

  .${ROOT_CLASS}__card-row {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 8px;
    flex-wrap: wrap;
  }

  /* Courier badge */
  .${ROOT_CLASS}__courier {
    font-size: var(--plp-courier-size);
    font-weight: 500;
    color: var(--plp-muted-text);
    letter-spacing: 0.01em;
  }

  /* Date display */
  .${ROOT_CLASS}__date {
    font-size: var(--plp-date-size);
    font-weight: 600;
    color: var(--plp-text);
  }

  .${ROOT_CLASS}__date-range {
    font-size: var(--plp-body-size);
    color: var(--plp-muted-text);
    font-weight: 400;
  }

  /* Days badge */
  .${ROOT_CLASS}__days {
    font-size: var(--plp-small-size);
    color: var(--plp-muted-text);
    white-space: nowrap;
  }

  /* Cutoff urgency */
  .${ROOT_CLASS}__cutoff {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: var(--plp-small-size);
    margin-top: 2px;
  }

  .${ROOT_CLASS}__cutoff-icon {
    flex-shrink: 0;
    width: 12px;
    height: 12px;
  }

  .${ROOT_CLASS}__cutoff--high {
    color: var(--plp-urgent);
    font-weight: 600;
  }

  .${ROOT_CLASS}__cutoff--medium {
    color: var(--plp-urgent);
    font-weight: 500;
    opacity: 0.8;
  }

  .${ROOT_CLASS}__cutoff--low {
    color: var(--plp-muted-text);
  }

  /* Layout: compact */
  .${ROOT_CLASS}--layout-compact .${ROOT_CLASS}__predictions {
    gap: 0;
  }

  .${ROOT_CLASS}--layout-compact .${ROOT_CLASS}__card {
    border-radius: 0;
    border-bottom-width: 0;
  }

  .${ROOT_CLASS}--layout-compact .${ROOT_CLASS}__card:first-child {
    border-top-left-radius: calc(var(--plp-radius) - 2px);
    border-top-right-radius: calc(var(--plp-radius) - 2px);
  }

  .${ROOT_CLASS}--layout-compact .${ROOT_CLASS}__card:last-child {
    border-bottom-left-radius: calc(var(--plp-radius) - 2px);
    border-bottom-right-radius: calc(var(--plp-radius) - 2px);
    border-bottom-width: 1px;
  }

  /* Layout: banner — single-line horizontal */
  .${ROOT_CLASS}--layout-banner {
    gap: 6px;
  }

  .${ROOT_CLASS}--layout-banner .${ROOT_CLASS}__header {
    gap: 4px;
  }

  .${ROOT_CLASS}--layout-banner .${ROOT_CLASS}__card {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 12px;
    flex-wrap: wrap;
  }

  .${ROOT_CLASS}--layout-banner .${ROOT_CLASS}__card-row {
    flex-wrap: nowrap;
    gap: 10px;
  }

  .${ROOT_CLASS}--layout-banner .${ROOT_CLASS}__cutoff {
    margin-top: 0;
  }

  /* Empty / Error states */
  .${ROOT_CLASS}__empty,
  .${ROOT_CLASS}__error {
    text-align: center;
    padding: 12px;
  }

  .${ROOT_CLASS}__empty-heading,
  .${ROOT_CLASS}__error-heading {
    font-size: var(--plp-body-size);
    font-weight: 600;
    color: var(--plp-text);
    margin: 0 0 4px;
  }

  .${ROOT_CLASS}__empty-summary,
  .${ROOT_CLASS}__error-summary {
    font-size: var(--plp-small-size);
    color: var(--plp-muted-text);
    margin: 0;
  }

  /* Loading */
  .${ROOT_CLASS}__loading {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 12px;
    font-size: var(--plp-body-size);
    color: var(--plp-muted-text);
  }

  .${ROOT_CLASS}__spinner {
    width: 16px;
    height: 16px;
    animation: pl-promise-spin 0.8s linear infinite;
  }

  @keyframes pl-promise-spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  /* Responsive: narrow containers */
  @container (max-width: 320px) {
    .${ROOT_CLASS}__card-row {
      flex-direction: column;
      gap: 2px;
    }
  }
`;

const THEME_VAR_MAP: Record<keyof WidgetTheme, string> = {
  backgroundColor: '--plp-background',
  cardBackgroundColor: '--plp-card-background',
  borderColor: '--plp-border',
  textColor: '--plp-text',
  mutedTextColor: '--plp-muted-text',
  accentColor: '--plp-accent',
  urgentColor: '--plp-urgent',
  successColor: '--plp-success',
  iconColor: '--plp-icon',
  radius: '--plp-radius',
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
  tag: K,
  className?: string,
  textContent?: string,
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);

  if (className) {
    el.className = className;
  }

  if (textContent) {
    el.textContent = textContent;
  }

  return el;
}

function truckIcon(): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '1.5');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  svg.classList.add(`${ROOT_CLASS}__title-icon`);
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute(
    'd',
    'M1 3h15v13H1zM16 8h4l3 3v5h-7V8zM5.5 21a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM18.5 21a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
  );
  svg.appendChild(path);
  return svg;
}

function clockIcon(): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  svg.classList.add(`${ROOT_CLASS}__cutoff-icon`);
  const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  circle.setAttribute('cx', '12');
  circle.setAttribute('cy', '12');
  circle.setAttribute('r', '10');
  const line1 = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
  line1.setAttribute('points', '12 6 12 12 16 14');
  svg.appendChild(circle);
  svg.appendChild(line1);
  return svg;
}

function spinnerSvg(): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('aria-hidden', 'true');
  svg.classList.add(`${ROOT_CLASS}__spinner`);
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', 'M12 2a10 10 0 0 1 10 10');
  svg.appendChild(path);
  return svg;
}

function applyTheme(
  root: HTMLElement,
  theme: Partial<WidgetTheme>,
): void {
  for (const [key, cssVar] of Object.entries(THEME_VAR_MAP)) {
    const value = theme[key as keyof WidgetTheme];

    if (value) {
      root.style.setProperty(cssVar, value);
    }
  }
}

function renderHeader(
  config: ResolvedWidgetConfig,
  vm: ReadyViewModel,
  onZipChange: (zip: string) => void,
): HTMLElement {
  const header = createElement('div', `${ROOT_CLASS}__header`);
  header.setAttribute('role', 'heading');
  header.setAttribute('aria-level', '3');

  const title = createElement('h3', `${ROOT_CLASS}__title`);

  if (config.showIcon) {
    title.appendChild(truckIcon());
  }

  title.appendChild(document.createTextNode(config.messages.title));
  header.appendChild(title);

  if (config.zipEditable || vm.postalCode) {
    header.appendChild(
      renderZipSection(config, vm, onZipChange),
    );
  }

  return header;
}

function renderZipSection(
  config: ResolvedWidgetConfig,
  vm: ReadyViewModel,
  onZipChange: (zip: string) => void,
): HTMLElement {
  const zip = createElement('div', `${ROOT_CLASS}__zip`);

  if (!config.zipEditable) {
    if (vm.postalCode) {
      zip.appendChild(
        createElement('span', `${ROOT_CLASS}__zip-label`, config.messages.deliverTo),
      );
      zip.appendChild(
        createElement('span', `${ROOT_CLASS}__zip-value`, vm.postalCode),
      );
    }
    return zip;
  }

  let editing = false;

  function renderDisplay(): void {
    zip.innerHTML = '';

    if (vm.postalCode) {
      zip.appendChild(
        createElement('span', `${ROOT_CLASS}__zip-label`, config.messages.deliverTo),
      );
      zip.appendChild(
        createElement('span', `${ROOT_CLASS}__zip-value`, vm.postalCode),
      );
      const btn = createElement('button', `${ROOT_CLASS}__zip-btn`, config.messages.changeZip);
      btn.type = 'button';
      btn.addEventListener('click', () => {
        editing = true;
        renderEdit();
      });
      zip.appendChild(btn);
    } else {
      const btn = createElement('button', `${ROOT_CLASS}__zip-btn`, config.messages.editZip);
      btn.type = 'button';
      btn.addEventListener('click', () => {
        editing = true;
        renderEdit();
      });
      zip.appendChild(btn);
    }
  }

  function renderEdit(): void {
    zip.innerHTML = '';
    const form = createElement('form', `${ROOT_CLASS}__zip-form`);

    const input = createElement('input', `${ROOT_CLASS}__zip-input`) as HTMLInputElement;
    input.type = 'text';
    input.placeholder = config.messages.zipPlaceholder;
    input.value = vm.postalCode;
    input.setAttribute('aria-label', config.messages.zipPlaceholder);

    const submit = createElement('button', `${ROOT_CLASS}__zip-submit`, config.messages.applyZip);
    submit.type = 'submit';

    form.appendChild(input);
    form.appendChild(submit);

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const value = input.value.trim();

      if (value) {
        editing = false;
        onZipChange(value);
      }
    });

    zip.appendChild(form);

    requestAnimationFrame(() => {
      input.focus();
    });
  }

  if (editing) {
    renderEdit();
  } else {
    renderDisplay();
  }

  return zip;
}

function renderPredictionCard(
  prediction: PredictionViewModel,
  config: ResolvedWidgetConfig,
): HTMLElement {
  const card = createElement('div', `${ROOT_CLASS}__card`);
  card.setAttribute('role', 'listitem');

  const mainRow = createElement('div', `${ROOT_CLASS}__card-row`);

  const dateEl = createElement('span', `${ROOT_CLASS}__date`, prediction.mostLikelyDate);
  mainRow.appendChild(dateEl);

  if (config.showCourier) {
    mainRow.appendChild(
      createElement('span', `${ROOT_CLASS}__courier`, prediction.courierName),
    );
  }

  card.appendChild(mainRow);

  if (config.showDateRange && prediction.earliestDate !== prediction.latestDate) {
    const rangeRow = createElement('div', `${ROOT_CLASS}__card-row`);
    rangeRow.appendChild(
      createElement('span', `${ROOT_CLASS}__date-range`, prediction.dateRangeText),
    );

    const daysMin = prediction.daysMin;
    const daysMax = prediction.daysMax;
    const daysText =
      daysMin === daysMax
        ? config.messages.singleDay.replace('{count}', String(daysMin))
        : config.messages.dayRange
            .replace('{min}', String(daysMin))
            .replace('{max}', String(daysMax));
    rangeRow.appendChild(
      createElement('span', `${ROOT_CLASS}__days`, daysText),
    );

    card.appendChild(rangeRow);
  }

  if (config.showCutoff && prediction.cutoffMinutes > 0 && prediction.cutoffUrgency !== 'none') {
    card.appendChild(renderCutoff(prediction, config));
  }

  return card;
}

function renderCutoff(
  prediction: PredictionViewModel,
  config: ResolvedWidgetConfig,
): HTMLElement {
  const urgencyClass = `${ROOT_CLASS}__cutoff--${prediction.cutoffUrgency}`;
  const cutoff = createElement('div', `${ROOT_CLASS}__cutoff ${urgencyClass}`);

  cutoff.appendChild(clockIcon());

  const text = `${config.messages.orderWithin} ${prediction.cutoffText} ${config.messages.toReceiveBy} ${prediction.mostLikelyDate}`;
  cutoff.appendChild(document.createTextNode(text));

  return cutoff;
}

function renderLoading(vm: LoadingViewModel): HTMLElement {
  const el = createElement('div', `${ROOT_CLASS}__loading`);
  el.setAttribute('role', 'status');
  el.setAttribute('aria-live', 'polite');
  el.appendChild(spinnerSvg());
  el.appendChild(document.createTextNode(vm.text));
  return el;
}

function renderEmpty(vm: EmptyViewModel): HTMLElement {
  const el = createElement('div', `${ROOT_CLASS}__empty`);
  el.appendChild(createElement('p', `${ROOT_CLASS}__empty-heading`, vm.heading));
  el.appendChild(createElement('p', `${ROOT_CLASS}__empty-summary`, vm.summary));
  return el;
}

function renderError(vm: ErrorViewModel): HTMLElement {
  const el = createElement('div', `${ROOT_CLASS}__error`);
  el.appendChild(createElement('p', `${ROOT_CLASS}__error-heading`, vm.heading));
  el.appendChild(createElement('p', `${ROOT_CLASS}__error-summary`, vm.summary));
  return el;
}

export class WidgetRenderer {
  private host: HTMLElement;
  private root: HTMLElement | null = null;
  private onZipChange: ((zip: string) => void) | null = null;

  constructor(host: HTMLElement) {
    this.host = host;
  }

  setZipChangeHandler(handler: (zip: string) => void): void {
    this.onZipChange = handler;
  }

  render(config: ResolvedWidgetConfig, viewModel: ViewModel): void {
    ensureStyles();

    if (viewModel.state === 'hidden') {
      this.destroy();
      this.host.style.display = 'none';
      return;
    }

    this.host.style.display = '';

    if (!this.root) {
      this.root = createElement('div', ROOT_CLASS);
      this.root.setAttribute('role', 'region');
      this.root.setAttribute('aria-label', config.messages.title);
      this.host.appendChild(this.root);
    }

    const root = this.root;
    root.innerHTML = '';

    root.className = ROOT_CLASS;
    root.classList.add(`${ROOT_CLASS}--surface-${config.surface}`);
    root.classList.add(`${ROOT_CLASS}--density-${config.density}`);
    root.classList.add(`${ROOT_CLASS}--layout-${config.layout}`);

    if (config.className) {
      root.classList.add(config.className);
    }

    applyTheme(root, config.theme);

    switch (viewModel.state) {
      case 'loading':
        root.appendChild(renderLoading(viewModel));
        break;

      case 'ready': {
        root.appendChild(
          renderHeader(config, viewModel, (zip) => {
            this.onZipChange?.(zip);
          }),
        );

        const list = createElement('div', `${ROOT_CLASS}__predictions`);
        list.setAttribute('role', 'list');

        for (const prediction of viewModel.predictions) {
          list.appendChild(renderPredictionCard(prediction, config));
        }

        root.appendChild(list);
        break;
      }

      case 'empty':
        root.appendChild(renderEmpty(viewModel));
        break;

      case 'error':
        root.appendChild(renderError(viewModel));
        break;
    }
  }

  destroy(): void {
    if (this.root) {
      this.root.remove();
      this.root = null;
    }
  }
}
