import { iconForKind } from './icons';
import { pickCardHeading } from './model';
import type {
  EmptyViewModel,
  ErrorViewModel,
  FallbackViewModel,
  LinkViewModel,
  LoadingViewModel,
  ReadyViewModel,
  ResolvedWidgetConfig,
  ViewModel,
  WidgetMessages,
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
    --plp-background: transparent;
    --plp-card-background: #ffffff;
    --plp-card-tint: #f5f5ff;
    --plp-border: #e4e4e4;
    --plp-text: #1a1a1a;
    --plp-muted-text: #6c6c6c;
    --plp-accent: #3D3AD3;
    --plp-accent-soft: rgba(61, 58, 211, 0.08);
    --plp-urgent: #c05600;
    --plp-urgent-soft: rgba(192, 86, 0, 0.12);
    --plp-success: #035740;
    --plp-icon: currentColor;
    --plp-link: #3D3AD3;
    --plp-radius: 12px;
    color: var(--plp-text);
    font: inherit;
    line-height: 1.45;
    min-width: 0;
    width: 100%;
  }

  @keyframes pl-promise-fade-in {
    from { opacity: 0; transform: translateY(4px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  @keyframes pl-promise-pulse {
    0%, 100% { box-shadow: 0 0 0 0 var(--plp-urgent-soft); }
    50%      { box-shadow: 0 0 0 6px transparent; }
  }

  @media (prefers-reduced-motion: reduce) {
    .${ROOT_CLASS} *,
    .${ROOT_CLASS} *::before,
    .${ROOT_CLASS} *::after {
      animation: none !important;
      transition: none !important;
    }
  }

  /* ----- layout: text (default) ----- */
  .${ROOT_CLASS}--layout-text {
    display: block;
    font-size: inherit;
    animation: pl-promise-fade-in 0.35s ease-out both;
  }

  .${ROOT_CLASS}__summary {
    display: inline;
    color: inherit;
    margin: 0;
  }

  .${ROOT_CLASS}__summary-icon {
    display: inline-block;
    vertical-align: -0.22em;
    width: 1.2em;
    height: 1.2em;
    margin-right: 0.4em;
    color: var(--plp-icon);
  }

  .${ROOT_CLASS}__summary-date {
    font-weight: 700;
  }

  .${ROOT_CLASS}__deliver-to {
    display: block;
    margin-top: 4px;
    font-size: 0.85em;
    color: var(--plp-muted-text);
  }

  .${ROOT_CLASS}__zip-inline {
    color: var(--plp-link);
    text-decoration: underline;
    text-decoration-style: dotted;
    text-underline-offset: 0.2em;
    background: none;
    border: 0;
    padding: 0;
    font: inherit;
    cursor: pointer;
    transition: color 0.15s ease;
  }

  .${ROOT_CLASS}__zip-inline:hover {
    text-decoration-style: solid;
    color: var(--plp-accent);
  }

  .${ROOT_CLASS}__zip-form {
    display: inline-flex;
    align-items: baseline;
    gap: 6px;
    margin-left: 4px;
  }

  .${ROOT_CLASS}__zip-input {
    font: inherit;
    border: 0;
    border-bottom: 1px solid var(--plp-border);
    padding: 0 2px;
    width: 7em;
    outline: none;
    background: transparent;
    color: inherit;
  }

  .${ROOT_CLASS}__zip-input:focus {
    border-bottom-color: var(--plp-accent);
  }

  .${ROOT_CLASS}__zip-apply {
    font: inherit;
    font-size: 0.85em;
    padding: 2px 8px;
    background: var(--plp-accent);
    color: #fff;
    border: 0;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.15s ease, transform 0.15s ease;
  }

  .${ROOT_CLASS}__zip-apply:hover {
    transform: translateY(-1px);
  }

  .${ROOT_CLASS}__via {
    color: var(--plp-muted-text);
    font-weight: normal;
    margin-left: 4px;
  }

  /* cutoff line under summary */
  .${ROOT_CLASS}__cutoff-line {
    display: block;
    margin-top: 4px;
    font-size: 0.88em;
    color: var(--plp-urgent);
  }

  .${ROOT_CLASS}__cutoff-line--standard {
    color: var(--plp-muted-text);
  }

  /* CTA shown when requireZip && no postal */
  .${ROOT_CLASS}__link {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: var(--plp-link);
    background: none;
    border: 0;
    padding: 0;
    font: inherit;
    text-decoration: underline;
    text-underline-offset: 0.18em;
    cursor: pointer;
    transition: color 0.15s ease;
  }

  .${ROOT_CLASS}__link:hover {
    text-decoration-thickness: 2px;
    color: var(--plp-accent);
  }

  .${ROOT_CLASS}__link-icon {
    width: 1.1em;
    height: 1.1em;
  }

  /* ----- layout: card ----- */
  .${ROOT_CLASS}--layout-card {
    display: block;
    animation: pl-promise-fade-in 0.35s ease-out both;
  }

  .${ROOT_CLASS}__card {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 16px;
    align-items: center;
    padding: 14px 18px;
    border-radius: var(--plp-radius);
    background: linear-gradient(135deg, var(--plp-card-background), var(--plp-card-tint));
    border: 1px solid var(--plp-border);
    transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
  }

  .${ROOT_CLASS}__card:hover {
    transform: translateY(-1px);
    box-shadow: 0 8px 24px -12px rgba(16, 32, 60, 0.18);
    border-color: var(--plp-accent-soft);
  }

  .${ROOT_CLASS}__card-icon {
    width: 36px;
    height: 36px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 10px;
    background: var(--plp-accent-soft);
    color: var(--plp-accent);
  }

  .${ROOT_CLASS}__card-icon svg {
    width: 22px;
    height: 22px;
  }

  .${ROOT_CLASS}__card-body {
    display: grid;
    gap: 2px;
    min-width: 0;
  }

  .${ROOT_CLASS}__card-heading {
    font-size: 0.78em;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--plp-muted-text);
  }

  .${ROOT_CLASS}__card-date {
    font-size: 1.1em;
    font-weight: 700;
    color: var(--plp-text);
    line-height: 1.25;
  }

  .${ROOT_CLASS}__card-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 12px;
    margin-top: 4px;
    font-size: 0.85em;
    color: var(--plp-muted-text);
  }

  .${ROOT_CLASS}__card-cutoff {
    color: var(--plp-urgent);
    font-weight: 600;
  }

  .${ROOT_CLASS}__card-cutoff--standard {
    color: var(--plp-muted-text);
    font-weight: 500;
  }

  /* ----- layout: badge ----- */
  .${ROOT_CLASS}--layout-badge {
    display: inline-block;
    animation: pl-promise-fade-in 0.35s ease-out both;
  }

  .${ROOT_CLASS}__badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 6px 12px;
    border-radius: 999px;
    background: var(--plp-accent-soft);
    color: var(--plp-accent);
    font-size: 0.92em;
    font-weight: 600;
    line-height: 1.2;
    transition: transform 0.15s ease, background-color 0.15s ease;
  }

  .${ROOT_CLASS}__badge:hover {
    transform: translateY(-1px);
    background: rgba(61, 58, 211, 0.14);
  }

  .${ROOT_CLASS}__badge--urgent {
    background: var(--plp-urgent-soft);
    color: var(--plp-urgent);
    animation: pl-promise-fade-in 0.35s ease-out both, pl-promise-pulse 2.4s ease-in-out infinite;
  }

  .${ROOT_CLASS}__badge-icon {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
  }

  .${ROOT_CLASS}__badge-cutoff {
    font-weight: 500;
    opacity: 0.85;
    margin-left: 4px;
    padding-left: 8px;
    border-left: 1px solid currentColor;
    border-color: rgba(0, 0, 0, 0.12);
  }

  /* ----- loading / empty / error ----- */
  .${ROOT_CLASS}__loading {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    color: var(--plp-muted-text);
    font-size: 0.9em;
  }

  .${ROOT_CLASS}__loading::before {
    content: '';
    width: 10px;
    height: 10px;
    border-radius: 50%;
    border: 2px solid var(--plp-border);
    border-top-color: var(--plp-accent);
    animation: pl-promise-spin 0.8s linear infinite;
  }

  @keyframes pl-promise-spin {
    to { transform: rotate(360deg); }
  }

  .${ROOT_CLASS}__state {
    color: var(--plp-muted-text);
    font-size: 0.9em;
  }

  .${ROOT_CLASS}__state-heading {
    color: var(--plp-text);
    font-weight: 600;
    margin: 0 0 2px;
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
  linkColor: '--plp-link',
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
  if (className) el.className = className;
  if (textContent) el.textContent = textContent;
  return el;
}

function applyTheme(root: HTMLElement, theme: Partial<WidgetTheme>): void {
  for (const [key, cssVar] of Object.entries(THEME_VAR_MAP)) {
    const value = theme[key as keyof WidgetTheme];
    if (value) {
      root.style.setProperty(cssVar, value);
    }
  }
}

/**
 * Replace placeholders like {date} / {zip} in a template string with inline
 * element nodes. Returns a DocumentFragment so rendering preserves the structure.
 */
function renderTemplate(
  template: string,
  parts: Record<string, Node>,
): DocumentFragment {
  const frag = document.createDocumentFragment();
  const regex = /\{(\w+)\}/g;
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(template)) !== null) {
    if (match.index > last) {
      frag.appendChild(
        document.createTextNode(template.slice(last, match.index)),
      );
    }
    const node = parts[match[1]!];
    if (node) {
      frag.appendChild(node.cloneNode(true));
    }
    last = regex.lastIndex;
  }

  if (last < template.length) {
    frag.appendChild(document.createTextNode(template.slice(last)));
  }

  return frag;
}

function makeBoldText(text: string): HTMLElement {
  const el = createElement('strong', `${ROOT_CLASS}__summary-date`);
  el.textContent = text;
  return el;
}

function renderZipInlineButton(
  config: ResolvedWidgetConfig,
  currentZip: string,
  onSubmit: (zip: string) => void,
): HTMLElement {
  const host = createElement('span');

  function renderDisplay() {
    host.textContent = '';
    const btn = createElement('button', `${ROOT_CLASS}__zip-inline`);
    btn.type = 'button';
    btn.textContent = currentZip || config.messages.zipPromptCta;
    btn.setAttribute('aria-label', config.messages.zipPromptHint);
    btn.addEventListener('click', () => {
      renderForm();
    });
    host.appendChild(btn);
  }

  function renderForm() {
    host.textContent = '';
    const form = createElement('span', `${ROOT_CLASS}__zip-form`);

    const input = createElement('input', `${ROOT_CLASS}__zip-input`) as HTMLInputElement;
    input.type = 'text';
    input.value = currentZip;
    input.placeholder = config.messages.zipPlaceholder;
    input.setAttribute('aria-label', config.messages.zipPlaceholder);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        commit();
      } else if (e.key === 'Escape') {
        renderDisplay();
      }
    });

    const apply = createElement('button', `${ROOT_CLASS}__zip-apply`);
    apply.type = 'button';
    apply.textContent = config.messages.applyZip;
    apply.addEventListener('click', commit);

    function commit() {
      const value = input.value.trim();
      if (value) {
        onSubmit(value);
      }
    }

    form.appendChild(input);
    form.appendChild(apply);
    host.appendChild(form);

    queueMicrotask(() => input.focus());
  }

  renderDisplay();
  return host;
}

/** Build the localized summary date text used in summary/card. */
function pickDateText(vm: ReadyViewModel): string {
  return vm.summaryDateText;
}

function renderCarrier(
  carrier: string,
  messages: WidgetMessages,
): HTMLElement {
  const span = createElement(
    'span',
    `${ROOT_CLASS}__via`,
    interpolate(messages.viaCarrier, { carrier }),
  );
  return span;
}

function interpolate(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_m, k: string) => values[k] ?? '');
}

/** Render the text layout — minimal single sentence. */
function renderText(
  vm: ReadyViewModel,
  config: ResolvedWidgetConfig,
  onZipChange: ((zip: string) => void) | null,
): HTMLElement {
  const container = createElement('span', `${ROOT_CLASS}__summary`);
  container.setAttribute('role', 'status');

  if (config.icon !== 'none') {
    const icon = iconForKind(config.icon);
    if (icon) {
      icon.classList.add(`${ROOT_CLASS}__summary-icon`);
      container.appendChild(icon);
    }
  }

  const parts: Record<string, Node> = {
    date: makeBoldText(pickDateText(vm)),
    earliest: makeBoldText(vm.primary.earliestDate),
    latest: makeBoldText(vm.primary.latestDate),
  };

  const mode = config.dateMode;
  const template = pickSummaryTemplateFromMessages(
    config.messages,
    mode,
    vm.primary.isGuaranteed,
  );

  container.appendChild(renderTemplate(template, parts));

  if (config.showCarrier === 'inline' && vm.primary.courierName) {
    container.appendChild(renderCarrier(vm.primary.courierName, config.messages));
  }

  if (vm.primary.showCutoff && vm.primary.cutoffSentence) {
    const cutoff = createElement(
      'span',
      `${ROOT_CLASS}__cutoff-line${
        vm.primary.isExpress ? '' : ' ' + ROOT_CLASS + '__cutoff-line--standard'
      }`,
    );
    cutoff.textContent = vm.primary.cutoffSentence;
    container.appendChild(cutoff);
  }

  appendDeliverToLine(container, vm, config, onZipChange);

  return container;
}

function pickSummaryTemplateFromMessages(
  messages: WidgetMessages,
  mode: ResolvedWidgetConfig['dateMode'],
  guaranteed: boolean,
): string {
  if (guaranteed) {
    switch (mode) {
      case 'on': return messages.summaryGuaranteedOn;
      case 'by': return messages.summaryGuaranteedBy;
      case 'range': return messages.summaryGuaranteedRange;
      case 'from':
      default: return messages.summaryGuaranteedFrom;
    }
  }
  switch (mode) {
    case 'on': return messages.summaryEstimatedOn;
    case 'by': return messages.summaryEstimatedBy;
    case 'range': return messages.summaryEstimatedRange;
    case 'from':
    default: return messages.summaryEstimatedFrom;
  }
}

/**
 * Below the summary:
 *   - with zip:    "Deliver to <10038>"  (10038 editable when zipPicker=inline)
 *   - without zip + inline picker: just the "Get delivery date" CTA
 *   - without zip + no inline picker: nothing
 */
function appendDeliverToLine(
  container: HTMLElement,
  vm: ReadyViewModel,
  config: ResolvedWidgetConfig,
  onZipChange: ((zip: string) => void) | null,
): void {
  const wantsInline = config.zipPicker === 'inline' && onZipChange;
  if (!vm.postalCode && !wantsInline) return;

  const line = createElement('span', `${ROOT_CLASS}__deliver-to`);

  if (vm.postalCode) {
    line.textContent = `${config.messages.deliverTo} `;
    if (wantsInline) {
      line.appendChild(renderZipInlineButton(config, vm.postalCode, onZipChange!));
    } else {
      line.appendChild(document.createTextNode(vm.postalCode));
    }
  } else {
    line.appendChild(renderZipInlineButton(config, '', onZipChange!));
  }

  container.appendChild(line);
}

/** Render a CTA when requireZip && !postalCode — styled for the active layout. */
function renderLink(
  vm: LinkViewModel,
  config: ResolvedWidgetConfig,
  onZipChange: ((zip: string) => void) | null,
): HTMLElement {
  if (config.zipPicker === 'inline' && onZipChange) {
    return renderZipInlineButton(config, '', onZipChange);
  }

  const promptForZip = (cb: (zip: string) => void) => {
    const zip = window.prompt(config.messages.zipPromptHint, '') ?? '';
    const trimmed = zip.trim();
    if (trimmed) cb(trimmed);
  };

  if (config.layout === 'card') {
    const card = createElement('div', `${ROOT_CLASS}__card`);
    const iconWrap = createElement('span', `${ROOT_CLASS}__card-icon`);
    const icon = iconForKind(config.icon === 'none' ? 'calendar' : config.icon);
    if (icon) iconWrap.appendChild(icon);
    card.appendChild(iconWrap);
    const body = createElement('div', `${ROOT_CLASS}__card-body`);
    body.appendChild(
      createElement('div', `${ROOT_CLASS}__card-heading`, config.messages.zipPromptHint),
    );
    const btn = createElement('button', `${ROOT_CLASS}__link ${ROOT_CLASS}__card-date`);
    btn.type = 'button';
    btn.textContent = vm.cta;
    btn.style.padding = '0';
    btn.style.fontSize = 'inherit';
    if (onZipChange) {
      btn.addEventListener('click', () => promptForZip(onZipChange));
    }
    body.appendChild(btn);
    card.appendChild(body);
    return card;
  }

  if (config.layout === 'badge') {
    const badge = createElement('span', `${ROOT_CLASS}__badge`);
    if (config.icon !== 'none') {
      const icon = iconForKind(config.icon);
      if (icon) {
        icon.classList.add(`${ROOT_CLASS}__badge-icon`);
        badge.appendChild(icon);
      }
    }
    const btn = createElement('button', `${ROOT_CLASS}__link`);
    btn.type = 'button';
    btn.style.color = 'inherit';
    btn.style.textDecoration = 'underline';
    btn.style.textUnderlineOffset = '0.18em';
    btn.textContent = vm.cta;
    if (onZipChange) {
      btn.addEventListener('click', () => promptForZip(onZipChange));
    }
    badge.appendChild(btn);
    return badge;
  }

  // text
  const btn = createElement('button', `${ROOT_CLASS}__link`);
  btn.type = 'button';
  btn.setAttribute('aria-label', config.messages.zipPromptHint);

  if (config.icon !== 'none') {
    const icon = iconForKind(config.icon);
    if (icon) {
      icon.classList.add(`${ROOT_CLASS}__link-icon`);
      btn.appendChild(icon);
    }
  }

  btn.appendChild(document.createTextNode(vm.cta));

  if (onZipChange) {
    btn.addEventListener('click', () => promptForZip(onZipChange));
  }
  return btn;
}

function renderCard(
  vm: ReadyViewModel,
  config: ResolvedWidgetConfig,
  onZipChange: ((zip: string) => void) | null,
): HTMLElement {
  const card = createElement('div', `${ROOT_CLASS}__card`);
  card.setAttribute('role', 'status');

  const iconKind = config.icon === 'none' ? 'calendar' : config.icon;
  const iconWrap = createElement('span', `${ROOT_CLASS}__card-icon`);
  const icon = iconForKind(iconKind);
  if (icon) iconWrap.appendChild(icon);
  card.appendChild(iconWrap);

  const body = createElement('div', `${ROOT_CLASS}__card-body`);

  const headingWrap = createElement(
    'div',
    `${ROOT_CLASS}__card-heading`,
    pickCardHeading(config.messages, config.dateMode, vm.primary.isGuaranteed),
  );
  body.appendChild(headingWrap);

  const dateEl = createElement(
    'div',
    `${ROOT_CLASS}__card-date`,
    pickDateText(vm),
  );
  body.appendChild(dateEl);

  const meta = createElement('div', `${ROOT_CLASS}__card-meta`);
  let metaUsed = false;

  if (config.showCarrier === 'inline' && vm.primary.courierName) {
    meta.appendChild(
      createElement(
        'span',
        undefined,
        interpolate(config.messages.viaCarrier, {
          carrier: vm.primary.courierName,
        }),
      ),
    );
    metaUsed = true;
  }

  if (vm.primary.showCutoff && vm.primary.cutoffSentence) {
    const cutoff = createElement(
      'span',
      `${ROOT_CLASS}__card-cutoff${
        vm.primary.isExpress ? '' : ' ' + ROOT_CLASS + '__card-cutoff--standard'
      }`,
      vm.primary.cutoffSentence,
    );
    meta.appendChild(cutoff);
    metaUsed = true;
  }

  const wantsInline = config.zipPicker === 'inline' && onZipChange;
  if (vm.postalCode || wantsInline) {
    const zipSpan = createElement('span');
    if (vm.postalCode) {
      zipSpan.textContent = `${config.messages.deliverTo} `;
      if (wantsInline) {
        zipSpan.appendChild(renderZipInlineButton(config, vm.postalCode, onZipChange!));
      } else {
        zipSpan.appendChild(document.createTextNode(vm.postalCode));
      }
    } else {
      zipSpan.appendChild(renderZipInlineButton(config, '', onZipChange!));
    }
    meta.appendChild(zipSpan);
    metaUsed = true;
  }

  if (metaUsed) body.appendChild(meta);

  card.appendChild(body);
  return card;
}

function renderBadge(
  vm: ReadyViewModel,
  config: ResolvedWidgetConfig,
): HTMLElement {
  const urgent =
    vm.primary.cutoffUrgency === 'high' ||
    vm.primary.cutoffUrgency === 'medium';

  const badge = createElement(
    'span',
    `${ROOT_CLASS}__badge${urgent ? ` ${ROOT_CLASS}__badge--urgent` : ''}`,
  );
  badge.setAttribute('role', 'status');

  if (config.icon !== 'none') {
    const icon = iconForKind(config.icon);
    if (icon) {
      icon.classList.add(`${ROOT_CLASS}__badge-icon`);
      badge.appendChild(icon);
    }
  }

  badge.appendChild(document.createTextNode(pickDateText(vm)));
  return badge;
}

function renderFallback(
  vm: FallbackViewModel,
  config: ResolvedWidgetConfig,
): HTMLElement {
  if (config.layout === 'card') {
    const card = createElement('div', `${ROOT_CLASS}__card`);
    card.setAttribute('role', 'status');
    const iconWrap = createElement('span', `${ROOT_CLASS}__card-icon`);
    const icon = iconForKind(config.icon === 'none' ? 'calendar' : config.icon);
    if (icon) iconWrap.appendChild(icon);
    card.appendChild(iconWrap);
    const body = createElement('div', `${ROOT_CLASS}__card-body`);
    body.appendChild(
      createElement(
        'div',
        `${ROOT_CLASS}__card-heading`,
        vm.isGuaranteed
          ? config.messages.cardHeadingGuaranteedFrom
          : config.messages.cardHeadingEstimatedFrom,
      ),
    );
    body.appendChild(createElement('div', `${ROOT_CLASS}__card-date`, vm.text));
    card.appendChild(body);
    return card;
  }

  if (config.layout === 'badge') {
    const badge = createElement('span', `${ROOT_CLASS}__badge`);
    badge.setAttribute('role', 'status');
    if (config.icon !== 'none') {
      const icon = iconForKind(config.icon);
      if (icon) {
        icon.classList.add(`${ROOT_CLASS}__badge-icon`);
        badge.appendChild(icon);
      }
    }
    badge.appendChild(document.createTextNode(vm.text));
    return badge;
  }

  // text + link fall back to a plain summary span
  const span = createElement('span', `${ROOT_CLASS}__summary`);
  span.setAttribute('role', 'status');
  if (config.icon !== 'none') {
    const icon = iconForKind(config.icon);
    if (icon) {
      icon.classList.add(`${ROOT_CLASS}__summary-icon`);
      span.appendChild(icon);
    }
  }
  span.appendChild(document.createTextNode(vm.text));
  return span;
}

function renderLoading(vm: LoadingViewModel): HTMLElement {
  const el = createElement('span', `${ROOT_CLASS}__loading`);
  el.setAttribute('role', 'status');
  el.setAttribute('aria-live', 'polite');
  el.textContent = vm.text;
  return el;
}

function renderEmpty(vm: EmptyViewModel): HTMLElement {
  const el = createElement('div', `${ROOT_CLASS}__state`);
  const h = createElement('p', `${ROOT_CLASS}__state-heading`, vm.heading);
  const p = createElement('p', undefined, vm.summary);
  p.style.margin = '0';
  el.appendChild(h);
  el.appendChild(p);
  return el;
}

function renderError(vm: ErrorViewModel): HTMLElement {
  const el = createElement('div', `${ROOT_CLASS}__state`);
  const h = createElement('p', `${ROOT_CLASS}__state-heading`, vm.heading);
  const p = createElement('p', undefined, vm.summary);
  p.style.margin = '0';
  el.appendChild(h);
  el.appendChild(p);
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
      this.host.appendChild(this.root);
    }

    const root = this.root;
    root.innerHTML = '';
    root.className = ROOT_CLASS;
    root.classList.add(`${ROOT_CLASS}--layout-${config.layout}`);
    if (config.className) {
      root.classList.add(config.className);
    }
    applyTheme(root, config.theme);

    switch (viewModel.state) {
      case 'loading':
        root.appendChild(renderLoading(viewModel));
        break;

      case 'ready':
        if (config.layout === 'card') {
          root.appendChild(renderCard(viewModel, config, this.onZipChange));
        } else if (config.layout === 'badge') {
          root.appendChild(renderBadge(viewModel, config));
        } else {
          root.appendChild(renderText(viewModel, config, this.onZipChange));
        }
        break;

      case 'link':
        root.appendChild(renderLink(viewModel, config, this.onZipChange));
        break;

      case 'fallback':
        root.appendChild(renderFallback(viewModel, config));
        break;

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
