/* Two preset banks. Each only touches its own group of fields, so users can
   mix-and-match (e.g. "US ZIP" data + "Card" presentation). */

const DATA_FIELDS = ['accountId', 'country', 'postalCode', 'locationMode', 'ipAddress', 'courier', 'serviceLevel', 'warehouse', 'locale', 'fallbackDays'];
const PRESENTATION_FIELDS = [
  'layout', 'dateMode', 'zipPicker', 'countryPicker', 'showCutoff', 'icon',
  'confidence', 'dateFormat', 'showCarrier', 'requireZip',
  'selectionReferenceDate', 'selectionPick',
];

const DATA_PRESETS = {
  minimal: {
    name: 'PDP · Germany',
    notes: 'For product pages before a ZIP is known. Request a country-level estimate for Germany; the ZIP picker stays empty.',
    cfg: {
      country: 'DEU',
      postalCode: '',
      courier: '',
      serviceLevel: '',
      warehouse: '',
      locale: 'en',
      fallbackDays: '',
    },
  },
  'pdp-range': {
    name: 'Checkout · Germany + ZIP',
    notes: 'For checkout with a known delivery address. Request an estimate for ZIP 81371 in Germany.',
    cfg: {
      country: 'DEU',
      postalCode: '81371',
      courier: '',
      serviceLevel: '',
      warehouse: '',
      locale: 'de',
      fallbackDays: '',
    },
  },
  'usa-no-zip': {
    name: 'PDP · United States',
    notes: 'For product pages before a ZIP is known. Request a country-level estimate for the United States; the ZIP picker stays empty.',
    cfg: {
      country: 'USA',
      postalCode: '',
      courier: '',
      serviceLevel: '',
      warehouse: '',
      locale: 'en',
      fallbackDays: '',
    },
  },
  'pdp-inline-zip': {
    name: 'Checkout · US + ZIP',
    notes: 'For checkout with a known delivery address. Request an estimate for ZIP 10038 in the United States.',
    cfg: {
      country: 'USA',
      postalCode: '10038',
      courier: '',
      serviceLevel: '',
      warehouse: '',
      locale: 'en',
      fallbackDays: '',
    },
  },
  'ip-germany': {
    name: 'PDP · IP (Germany fallback)',
    notes: 'For product pages before an address is known. Estimate the ZIP and country from your public IP; use Germany if resolution fails or no delivery method matches.',
    cfg: {
      locationMode: 'ip',
      country: 'DEU',
      postalCode: '',
      courier: '',
      serviceLevel: '',
      warehouse: '',
      locale: 'en',
      fallbackDays: '',
    },
  },
  'ip-usa': {
    name: 'PDP · IP (US fallback)',
    notes: 'For product pages before an address is known. Estimate the ZIP and country from your public IP; use the United States if resolution fails or no delivery method matches.',
    cfg: {
      locationMode: 'ip',
      country: 'USA',
      postalCode: '',
      courier: '',
      serviceLevel: '',
      warehouse: '',
      locale: 'en',
      fallbackDays: '',
    },
  },
  'fallback-static': {
    name: 'Test · Invalid destination',
    notes: 'Test an invalid ZIP and country. Show the configured static fallback of 2–3 business days.',
    cfg: {
      country: 'ZZZ',
      postalCode: '000000',
      courier: '',
      serviceLevel: '',
      warehouse: '',
      locale: 'en',
      fallbackDays: '2-3',
    },
  },
};

const PRESENTATION_PRESETS = {
  'text-default': {
    name: 'Minimal PDP',
    notes: 'Delivery estimate and cutoff. Destination controls are hidden; the selected location still applies.',
    cfg: {
      layout: 'text',
      dateMode: 'from',
      zipPicker: 'none',
      showCutoff: 'always',
      icon: 'calendar',
      confidence: 'estimated',
      dateFormat: 'long',
      showCarrier: 'none',
      requireZip: 'false',
    },
  },
  'text-zip-editor': {
    name: 'Standard PDP',
    notes: 'Delivery date range, carrier, cutoff, and editable ZIP and country. IP estimates use a country fallback when needed.',
    cfg: {
      layout: 'text',
      dateMode: 'range',
      zipPicker: 'inline',
      countryPicker: 'true',
      showCutoff: 'auto',
      icon: 'truck',
      confidence: 'estimated',
      dateFormat: 'short',
      showCarrier: 'inline',
      requireZip: 'false',
    },
  },
  'require-zip': {
    name: 'ZIP required · PDP',
    notes: 'Show a delivery date after a ZIP is resolved or entered. A country-only fallback keeps the ZIP entry visible.',
    cfg: {
      layout: "text",
      dateMode: "by",
      zipPicker: "inline",
      countryPicker: 'true',
      showCutoff: "auto",
      locale: "en",
      icon: "none",
      confidence: "guaranteed",
      dateFormat: "long",
      showCarrier: "inline",
      requireZip: "true",
    },
  },
  card: {
    name: 'Card · PDP',
    notes: 'Hero card with carrier annotation that displays Promise very prominently.',
    cfg: {
      layout: 'card',
      dateMode: 'on',
      zipPicker: 'none',
      showCutoff: 'always',
      icon: 'calendar',
      confidence: 'auto',
      dateFormat: 'short',
      showCarrier: 'inline',
      requireZip: 'false',
    },
  },
  'badge-urgent': {
    name: 'Badge · Checkout',
    notes: 'Minimal chip with most likely delivery date.',
    cfg: {
      layout: "badge",
      dateMode: "on",
      zipPicker: "none",
      showCutoff: "never",
      locale: "en",
      icon: "truck",
      confidence: "auto",
      dateFormat: "short",
      showCarrier: "none",
      requireZip: "true",
    },
  },
};

const el = (id) => document.getElementById(id);
const mount = el('promise-demo');
const embedCode = el('embed-code');
const copyCodeButton = el('copy-code');
const embedModeButtons = document.querySelectorAll('[data-embed-mode]');
const previewNotes = el('preview-notes');

const API_BASE_URL = 'https://api.parcellab.com';
const mainElement = document.querySelector('main');
const apiPanelToggle = el('toggle-api-panel');
const apiRefreshButton = el('api-refresh');
const apiCopyButton = el('api-copy');
const apiRequestUrlEl = el('api-request-url');
const apiMethodEl = el('api-method');
const apiResponseEl = el('api-response');
const apiStatusEl = el('api-status');

let apiPanelOpen = false;
let apiAbortController = null;
let apiFetchTimer = null;
const apiResponseCache = new Map();

function renderPresetButtons(host, presets) {
  for (const [key, preset] of Object.entries(presets)) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.dataset.preset = key;
    btn.textContent = preset.name;
    btn.title = preset.notes;
    btn.setAttribute('aria-description', preset.notes);
    btn.className =
      'preset text-xs font-semibold px-3 h-8 rounded-lg border border-navy-200 bg-navy-50 text-navy-500 hover:bg-navy-100 transition-colors cursor-pointer';
    host.appendChild(btn);
  }
}

renderPresetButtons(el('data-preset-list'), DATA_PRESETS);
renderPresetButtons(el('presentation-preset-list'), PRESENTATION_PRESETS);

const presetButtons = document.querySelectorAll('[data-preset]');

let widget;
let widgetError = '';
let embedMode = 'html';
let activeData = null;
let activePresentation = null;

function clearPersistedZip() {
  try {
    localStorage.removeItem('pl-promise-zip');
  } catch {
    // ignore
  }
}

function parseFallbackDays(raw) {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const range = trimmed.match(/^(\d+)\s*[-–]\s*(\d+)$/);
  if (range) {
    const min = Number(range[1]);
    const max = Number(range[2]);
    if (Number.isFinite(min) && Number.isFinite(max) && min <= max) return [min, max];
    return null;
  }
  const single = Number(trimmed);
  return Number.isFinite(single) && single >= 0 ? single : null;
}

function currentConfig() {
  const mode = el('location-mode').value;
  const country = el('country').value.trim().toUpperCase() || 'DEU';
  return {
    accountId: el('account-id').value || '1612197',
    destinationCountry: country,
    postalCode: mode === 'postal' ? el('postal-code').value.trim() : '',
    ipFetch: mode === 'ip',
    ipAddress: mode === 'ip' ? el('ip-address').value.trim() : '',
    courier: el('courier').value.trim(),
    serviceLevel: el('service-level').value.trim(),
    warehouse: el('warehouse').value.trim(),
    layout: el('layout').value,
    dateMode: el('date-mode').value,
    zipPicker: el('zip-picker').value,
    countryPicker: el('country-picker').value === 'true',
    showCutoff: el('show-cutoff').value,
    locale: el('locale').value,
    icon: el('icon').value,
    confidence: el('confidence').value,
    dateFormat: el('date-format').value,
    fallbackDaysRaw: el('fallback-days').value,
    showCarrier: el('show-carrier').value,
    requireZip: el('require-zip').value === 'true' && el('zip-picker').value !== 'none',
    selectionReferenceDate: el('selection-reference-date').value,
    selectionPick: el('selection-pick').value,
  };
}

const FIELD_ID_MAP = {
  accountId: 'account-id',
  country: 'country',
  postalCode: 'postal-code',
  locationMode: 'location-mode',
  ipAddress: 'ip-address',
  courier: 'courier',
  serviceLevel: 'service-level',
  warehouse: 'warehouse',
  locale: 'locale',
  fallbackDays: 'fallback-days',
  layout: 'layout',
  dateMode: 'date-mode',
  zipPicker: 'zip-picker',
  countryPicker: 'country-picker',
  showCutoff: 'show-cutoff',
  icon: 'icon',
  confidence: 'confidence',
  dateFormat: 'date-format',
  showCarrier: 'show-carrier',
  requireZip: 'require-zip',
  selectionReferenceDate: 'selection-reference-date',
  selectionPick: 'selection-pick',
};

function applyFieldsToInputs(fields) {
  for (const [key, value] of Object.entries(fields)) {
    const id = FIELD_ID_MAP[key];
    if (!id) continue;
    const node = el(id);
    if (!node) continue;
    if (node.tagName === 'SELECT' && !Array.from(node.options).some((option) => option.value === String(value))) continue;
    node.value = value ?? '';
  }
}

function writeUrlSettings() {
  const url = new URL(window.location.href);
  for (const [key, id] of Object.entries(FIELD_ID_MAP)) {
    url.searchParams.set(key, el(id).value);
  }
  for (const [key, value] of Object.entries({ dataPreset: activeData, presentationPreset: activePresentation })) {
    if (value) url.searchParams.set(key, value);
    else url.searchParams.delete(key);
  }
  url.searchParams.set('embedMode', embedMode);
  url.searchParams.set('apiPanel', String(apiPanelOpen));
  window.history.replaceState(null, '', url);
}

function applyDataPreset(key) {
  const preset = DATA_PRESETS[key];
  if (!preset) return;
  activeData = key;
  clearPersistedZip();
  applyFieldsToInputs({ locationMode: preset.cfg.postalCode ? 'postal' : 'country', ipAddress: '', ...preset.cfg });
  refreshPresetButtons();
  previewNotes.textContent = preset.notes;
  renderWidget();
}

function applyPresentationPreset(key) {
  const preset = PRESENTATION_PRESETS[key];
  if (!preset) return;
  activePresentation = key;
  applyFieldsToInputs({ countryPicker: 'false', ...preset.cfg });
  refreshPresetButtons();
  previewNotes.textContent = preset.notes;
  renderWidget();
}

function refreshPresetButtons() {
  presetButtons.forEach((btn) => {
    const key = btn.dataset.preset;
    const isActive = key === activeData || key === activePresentation;
    btn.classList.toggle('preset-active', isActive);
  });
}

function buildInitConfig(c) {
  const out = {
    accountId: c.accountId,
    destinationCountry: c.destinationCountry,
    postalCode: c.postalCode,
    ipFetch: c.ipFetch,
    ipAddress: c.ipAddress,
    courier: c.courier,
    serviceLevel: c.serviceLevel,
    warehouse: c.warehouse,
    layout: c.layout,
    dateMode: c.dateMode,
    zipPicker: c.zipPicker,
    countryPicker: c.countryPicker,
    showCutoff: c.showCutoff,
    locale: c.locale,
    icon: c.icon,
    confidence: c.confidence,
    dateFormat: c.dateFormat,
    showCarrier: c.showCarrier,
    requireZip: c.requireZip,
    selectionReferenceDate: c.selectionReferenceDate,
    selectionPick: c.selectionPick,
  };
  const fb = parseFallbackDays(c.fallbackDaysRaw ?? '');
  if (fb != null) out.fallbackDays = fb;
  return out;
}

function renderWidget() {
  const mode = el('location-mode').value;
  el('postal-code-field').style.display = mode === 'postal' ? '' : 'none';
  el('ip-address-field').style.display = mode === 'ip' ? '' : 'none';
  el('ip-fetch-hint').style.display = mode === 'ip' ? '' : 'none';
  const config = currentConfig();

  if (widget) {
    widget.destroy();
  }
  mount.innerHTML = '';
  widgetError = '';

  try {
    widget = window.DeliveryPromise.init({
      target: mount,
      ...buildInitConfig(config),
    });
  } catch (err) {
    widgetError = err.message;
    console.error('Widget init failed:', err);
    mount.textContent = `Error: ${err.message}`;
  }

  updateEmbedCode();
  const sampleUrl = new URL(buildApiUrl(config));
  el('sample-request').textContent = `GET ${sampleUrl.pathname}${sampleUrl.search}`;
  el('sample-request-note').textContent = config.ipFetch
    ? config.ipAddress
      ? 'The preview uses the specified IP and the configured country as its fallback.'
      : 'The preview uses destination=self to resolve your connection IP, with the configured country as its fallback.'
    : config.postalCode ? 'Use a known delivery address, for example at checkout.' : 'Use a country-level estimate before a ZIP is known, for example on a product page.';
  writeUrlSettings();
  scheduleApiPanelUpdate();
}

function buildApiUrl(c) {
  const url = new URL('/v2/prediction', API_BASE_URL);
  const country = (c.destinationCountry || '').toUpperCase();
  const destination = c.postalCode
    ? `${c.postalCode}_${country}`
    : c.ipFetch
      ? c.ipAddress || 'self'
      : country;
  url.searchParams.set('user', String(c.accountId));
  url.searchParams.set('destination', destination);
  if (!c.postalCode && c.ipFetch) {
    url.searchParams.set('fallbackCountry', country);
  }
  if (c.courier) url.searchParams.set('courier', c.courier);
  if (c.serviceLevel) url.searchParams.set('courierServiceLevel', c.serviceLevel);
  if (c.warehouse) url.searchParams.set('warehouse', c.warehouse);
  if (c.locale) url.searchParams.set('lang', c.locale);
  return url.toString();
}

function setApiStatus(text, kind) {
  apiStatusEl.textContent = text;
  const colorClass =
    kind === 'error'
      ? 'text-red-500'
      : kind === 'success'
        ? 'text-green-600'
        : kind === 'loading'
          ? 'text-brand'
          : 'text-navy-400';
  apiStatusEl.className = `text-[0.7rem] font-semibold tracking-wide ${colorClass}`;
}

function scheduleApiPanelUpdate() {
  if (!apiPanelOpen) return;
  if (apiFetchTimer) clearTimeout(apiFetchTimer);
  apiFetchTimer = setTimeout(() => {
    apiFetchTimer = null;
    void updateApiPanel();
  }, 200);
}

async function updateApiPanel({ bypassCache = false } = {}) {
  if (!apiPanelOpen) return;
  const c = currentConfig();

  if (widgetError) {
    apiRequestUrlEl.textContent = '— invalid configuration —';
    apiResponseEl.textContent = widgetError;
    setApiStatus('Skipped', 'error');
    return;
  }

  if (!c.accountId || !c.destinationCountry) {
    apiMethodEl.textContent = '';
    apiRequestUrlEl.textContent = '— missing required fields —';
    apiResponseEl.textContent = '';
    setApiStatus('Skipped', 'info');
    return;
  }

  if (c.requireZip && !c.postalCode && !c.ipFetch) {
    apiMethodEl.textContent = '';
    apiRequestUrlEl.textContent = '— call skipped —';
    apiResponseEl.textContent =
      'requireZip is true and no postal code provided.\nThe widget shows the CTA without calling the API.';
    setApiStatus('Skipped', 'info');
    return;
  }

  apiAbortController?.abort();
  apiAbortController = new AbortController();
  const signal = apiAbortController.signal;
  const url = buildApiUrl(c);
  const selfRequest = !c.postalCode && c.ipFetch && !c.ipAddress;
  apiMethodEl.textContent = 'GET';
  apiRequestUrlEl.textContent = url;

  if (!bypassCache && !selfRequest) {
    const cached = apiResponseCache.get(url);
    if (cached) {
      apiResponseEl.textContent = cached.body;
      setApiStatus(
        `${cached.status} ${cached.statusText} · cached`,
        cached.status >= 200 && cached.status < 300 ? 'success' : 'error',
      );
      return;
    }
  }

  setApiStatus('Loading…', 'loading');
  apiResponseEl.textContent = '';

  let response;
  try {
    response = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal,
      ...(selfRequest ? { cache: 'no-store', credentials: 'omit', referrerPolicy: 'no-referrer' } : {}),
    });
  } catch (error) {
    if (error.name === 'AbortError') return;
    setApiStatus('Network error', 'error');
    apiResponseEl.textContent = String(error.message ?? error);
    return;
  }

  if (signal.aborted) return;

  const text = await response.text();
  let body = text;
  try {
    body = JSON.stringify(JSON.parse(text), null, 2);
  } catch {
    // not JSON — leave as-is
  }

  apiResponseEl.textContent = body || '(empty body)';
  if (!selfRequest) apiResponseCache.set(url, {
    status: response.status,
    statusText: response.statusText,
    body: apiResponseEl.textContent,
  });
  setApiStatus(`${response.status} ${response.statusText}`, response.ok ? 'success' : 'error');
}

function setApiPanelOpen(open) {
  apiPanelOpen = open;
  apiPanelToggle.setAttribute('aria-pressed', String(open));
  apiPanelToggle.textContent = open ? 'Hide API response' : 'Show API response';
  mainElement.dataset.showApi = String(open);
  writeUrlSettings();
  if (open) {
    void updateApiPanel();
  } else {
    apiAbortController?.abort();
    if (apiFetchTimer) {
      clearTimeout(apiFetchTimer);
      apiFetchTimer = null;
    }
  }
}

apiPanelToggle.addEventListener('click', () => {
  setApiPanelOpen(!apiPanelOpen);
});

apiRefreshButton.addEventListener('click', () => {
  void updateApiPanel({ bypassCache: true });
});

apiCopyButton.addEventListener('click', async () => {
  const text = apiResponseEl.textContent ?? '';
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // ignore
  }
  apiCopyButton.dataset.copied = 'true';
  setTimeout(() => {
    apiCopyButton.dataset.copied = 'false';
  }, 1200);
});

function escapeAttribute(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function embedBundleUrl() {
  return new URL('./dist/promise.iife.js', window.location.href).toString();
}

function fallbackDaysAttr(raw) {
  const fb = parseFallbackDays(raw);
  if (fb == null) return '';
  return Array.isArray(fb) ? `${fb[0]}-${fb[1]}` : String(fb);
}

function htmlEmbedSnippet(c) {
  const attrs = [
    'data-promise',
    `data-account-id="${escapeAttribute(c.accountId)}"`,
    `data-country="${escapeAttribute(c.destinationCountry)}"`,
    `data-postal-code="${escapeAttribute(c.postalCode)}"`,
    `data-ip-fetch="${c.ipFetch ? 'true' : 'false'}"`,
    ...(c.ipAddress ? [`data-ip-address="${escapeAttribute(c.ipAddress)}"`] : []),
    `data-courier="${escapeAttribute(c.courier)}"`,
    `data-service-level="${escapeAttribute(c.serviceLevel)}"`,
    `data-warehouse="${escapeAttribute(c.warehouse)}"`,
    `data-layout="${c.layout}"`,
    `data-date-mode="${c.dateMode}"`,
    `data-zip-picker="${c.zipPicker}"`,
    `data-country-picker="${c.countryPicker ? 'true' : 'false'}"`,
    `data-show-cutoff="${c.showCutoff}"`,
    `data-locale="${c.locale}"`,
    `data-icon="${c.icon}"`,
    `data-confidence="${c.confidence}"`,
    `data-date-format="${c.dateFormat}"`,
    `data-show-carrier="${c.showCarrier}"`,
    `data-require-zip="${c.requireZip ? 'true' : 'false'}"`,
    `data-selection-reference-date="${c.selectionReferenceDate}"`,
    `data-selection-pick="${c.selectionPick}"`,
    `data-fallback-days="${fallbackDaysAttr(c.fallbackDaysRaw ?? '')}"`,
  ];

  return `<div\n  ${attrs.join('\n  ')}\n></div>\n<script src="${embedBundleUrl()}" defer><\/script>`;
}

function jsEmbedSnippet(c) {
  const fb = parseFallbackDays(c.fallbackDaysRaw ?? '');
  const fallbackLiteral =
    fb == null
      ? 'null'
      : Array.isArray(fb)
        ? `[${fb[0]}, ${fb[1]}]`
        : String(fb);

  const opts = [
    `  target: '#delivery-promise'`,
    `  accountId: ${JSON.stringify(c.accountId)}`,
    `  destinationCountry: ${JSON.stringify(c.destinationCountry)}`,
    `  postalCode: ${JSON.stringify(c.postalCode)}`,
    `  ipFetch: ${c.ipFetch ? 'true' : 'false'}`,
    ...(c.ipAddress ? [`  ipAddress: ${JSON.stringify(c.ipAddress)}`] : []),
    `  courier: ${JSON.stringify(c.courier)}`,
    `  serviceLevel: ${JSON.stringify(c.serviceLevel)}`,
    `  warehouse: ${JSON.stringify(c.warehouse)}`,
    `  layout: ${JSON.stringify(c.layout)}`,
    `  dateMode: ${JSON.stringify(c.dateMode)}`,
    `  zipPicker: ${JSON.stringify(c.zipPicker)}`,
    `  countryPicker: ${c.countryPicker ? 'true' : 'false'}`,
    `  showCutoff: ${JSON.stringify(c.showCutoff)}`,
    `  locale: ${JSON.stringify(c.locale)}`,
    `  icon: ${JSON.stringify(c.icon)}`,
    `  confidence: ${JSON.stringify(c.confidence)}`,
    `  dateFormat: ${JSON.stringify(c.dateFormat)}`,
    `  showCarrier: ${JSON.stringify(c.showCarrier)}`,
    `  requireZip: ${c.requireZip ? 'true' : 'false'}`,
    `  selectionReferenceDate: ${JSON.stringify(c.selectionReferenceDate)}`,
    `  selectionPick: ${JSON.stringify(c.selectionPick)}`,
    `  fallbackDays: ${fallbackLiteral}`,
  ];

  return `<div id="delivery-promise"></div>\n<script src="${embedBundleUrl()}"><\/script>\n<script>\n  window.DeliveryPromise.init({\n${opts.join(',\n')},\n  });\n<\/script>`;
}

function updateEmbedCode() {
  const c = currentConfig();
  embedCode.textContent = embedMode === 'js' ? jsEmbedSnippet(c) : htmlEmbedSnippet(c);
}

function updateEmbedModeButtons() {
  const active = ['bg-navy-800', 'border-navy-800', 'text-white'];
  const inactive = ['bg-white', 'border-navy-200', 'text-navy-500', 'hover:bg-navy-50'];
  embedModeButtons.forEach((btn) => {
    const isActive = btn.dataset.embedMode === embedMode;
    btn.setAttribute('aria-pressed', String(isActive));
    if (isActive) {
      btn.classList.remove(...inactive);
      btn.classList.add(...active);
    } else {
      btn.classList.remove(...active);
      btn.classList.add(...inactive);
    }
  });
}

for (const id of Object.values(FIELD_ID_MAP)) {
  const element = el(id);
  if (!element) continue;
  const event = element.tagName === 'SELECT' ? 'change' : 'input';
  element.addEventListener(event, () => {
    // Manual edits clear preset highlighting for the relevant bank
    if (DATA_FIELDS.some((f) => FIELD_ID_MAP[f] === id)) {
      activeData = null;
      clearPersistedZip();
    }
    if (PRESENTATION_FIELDS.some((f) => FIELD_ID_MAP[f] === id)) {
      activePresentation = null;
    }
    refreshPresetButtons();
    renderWidget();
  });
}

presetButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    const key = btn.dataset.preset;
    if (DATA_PRESETS[key]) applyDataPreset(key);
    else if (PRESENTATION_PRESETS[key]) applyPresentationPreset(key);
  });
});

embedModeButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    embedMode = btn.dataset.embedMode === 'js' ? 'js' : 'html';
    updateEmbedModeButtons();
    updateEmbedCode();
    writeUrlSettings();
  });
});

copyCodeButton.addEventListener('click', async () => {
  const text = embedCode.textContent ?? '';
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // fallback
  }
  copyCodeButton.dataset.copied = 'true';
  setTimeout(() => {
    copyCodeButton.dataset.copied = 'false';
  }, 1200);
});

const urlSettings = new URLSearchParams(window.location.search);
activeData = Object.hasOwn(DATA_PRESETS, urlSettings.get('dataPreset'))
  ? urlSettings.get('dataPreset') : DATA_FIELDS.some((key) => urlSettings.has(key)) ? null : 'ip-germany';
activePresentation = Object.hasOwn(PRESENTATION_PRESETS, urlSettings.get('presentationPreset'))
  ? urlSettings.get('presentationPreset') : PRESENTATION_FIELDS.some((key) => urlSettings.has(key)) ? null : 'text-zip-editor';
const data = DATA_PRESETS[activeData ?? 'ip-germany'].cfg;
applyFieldsToInputs({ locationMode: data.postalCode ? 'postal' : 'country', ipAddress: '', ...data });
applyFieldsToInputs({ countryPicker: 'false', ...PRESENTATION_PRESETS[activePresentation ?? 'text-zip-editor'].cfg });
applyFieldsToInputs(Object.fromEntries(urlSettings));
embedMode = urlSettings.get('embedMode') === 'js' ? 'js' : 'html';
updateEmbedModeButtons();
refreshPresetButtons();
previewNotes.textContent = PRESENTATION_PRESETS[activePresentation]?.notes ?? DATA_PRESETS[activeData]?.notes ?? '';
renderWidget();
if (urlSettings.get('apiPanel') === 'true') setApiPanelOpen(true);
