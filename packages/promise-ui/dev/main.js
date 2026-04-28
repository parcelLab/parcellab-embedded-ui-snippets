/* Two preset banks. Each only touches its own group of fields, so users can
   mix-and-match (e.g. "US ZIP" data + "Card" presentation). */

const DATA_FIELDS = ['country', 'postalCode', 'courier', 'serviceLevel', 'warehouse', 'locale', 'fallbackDays'];
const PRESENTATION_FIELDS = [
  'layout', 'dateMode', 'zipPicker', 'showCutoff', 'icon',
  'confidence', 'dateFormat', 'showCarrier', 'requireZip',
];

const DATA_PRESETS = {
  minimal: {
    name: 'Germany no zip',
    notes: null,
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
    name: 'Germany w/ zip',
    notes: null,
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
    name: 'US no zip',
    notes: null,
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
    name: 'US w/ zip',
    notes: null,
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
  'fallback-static': {
    name: 'Invalid data',
    notes: null,
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
    name: 'Create urgency · PDP',
    notes: 'Simple display with "as early as" with count down to create urgency.',
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
    name: 'Detailed info · PDP',
    notes: 'Show detailed overview on PDP for maximum transparency.',
    cfg: {
      layout: 'text',
      dateMode: 'range',
      zipPicker: 'inline',
      showCutoff: 'auto',
      icon: 'truck',
      confidence: 'estimated',
      dateFormat: 'short',
      showCarrier: 'inline',
      requireZip: 'false',
    },
  },
  'require-zip': {
    name: 'Delivery promise · PDP',
    notes: '',
    cfg: {
      layout: "text",
      dateMode: "by",
      zipPicker: "inline",
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

function renderPresetButtons(host, presets) {
  for (const [key, preset] of Object.entries(presets)) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.dataset.preset = key;
    btn.textContent = preset.name;
    btn.className =
      'preset text-xs font-semibold px-3 h-8 rounded-lg border border-navy-200 bg-navy-50 text-navy-500 hover:bg-navy-100 transition-colors cursor-pointer';
    host.appendChild(btn);
  }
}

renderPresetButtons(el('data-preset-list'), DATA_PRESETS);
renderPresetButtons(el('presentation-preset-list'), PRESENTATION_PRESETS);

const presetButtons = document.querySelectorAll('[data-preset]');

let widget;
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
  return {
    accountId: el('account-id').value || '1612197',
    destinationCountry: el('country').value || 'DEU',
    postalCode: el('postal-code').value.trim(),
    courier: el('courier').value.trim(),
    serviceLevel: el('service-level').value.trim(),
    warehouse: el('warehouse').value.trim(),
    layout: el('layout').value,
    dateMode: el('date-mode').value,
    zipPicker: el('zip-picker').value,
    showCutoff: el('show-cutoff').value,
    locale: el('locale').value,
    icon: el('icon').value,
    confidence: el('confidence').value,
    dateFormat: el('date-format').value,
    fallbackDaysRaw: el('fallback-days').value,
    showCarrier: el('show-carrier').value,
    requireZip: el('require-zip').value === 'true',
  };
}

const FIELD_ID_MAP = {
  country: 'country',
  postalCode: 'postal-code',
  courier: 'courier',
  serviceLevel: 'service-level',
  warehouse: 'warehouse',
  locale: 'locale',
  fallbackDays: 'fallback-days',
  layout: 'layout',
  dateMode: 'date-mode',
  zipPicker: 'zip-picker',
  showCutoff: 'show-cutoff',
  icon: 'icon',
  confidence: 'confidence',
  dateFormat: 'date-format',
  showCarrier: 'show-carrier',
  requireZip: 'require-zip',
};

function applyFieldsToInputs(fields) {
  for (const [key, value] of Object.entries(fields)) {
    const id = FIELD_ID_MAP[key];
    if (!id) continue;
    const node = el(id);
    if (!node) continue;
    node.value = value ?? '';
  }
}

function applyDataPreset(key) {
  const preset = DATA_PRESETS[key];
  if (!preset) return;
  activeData = key;
  clearPersistedZip();
  applyFieldsToInputs(preset.cfg);
  refreshPresetButtons();
  previewNotes.textContent = preset.notes;
  renderWidget();
}

function applyPresentationPreset(key) {
  const preset = PRESENTATION_PRESETS[key];
  if (!preset) return;
  activePresentation = key;
  applyFieldsToInputs(preset.cfg);
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
    courier: c.courier,
    serviceLevel: c.serviceLevel,
    warehouse: c.warehouse,
    layout: c.layout,
    dateMode: c.dateMode,
    zipPicker: c.zipPicker,
    showCutoff: c.showCutoff,
    locale: c.locale,
    icon: c.icon,
    confidence: c.confidence,
    dateFormat: c.dateFormat,
    showCarrier: c.showCarrier,
    requireZip: c.requireZip,
  };
  const fb = parseFallbackDays(c.fallbackDaysRaw ?? '');
  if (fb != null) out.fallbackDays = fb;
  return out;
}

function renderWidget() {
  const config = currentConfig();

  if (widget) {
    widget.destroy();
  }
  mount.innerHTML = '';

  try {
    widget = window.DeliveryPromise.init({
      target: mount,
      ...buildInitConfig(config),
    });
  } catch (err) {
    console.error('Widget init failed:', err);
    mount.textContent = `Error: ${err.message}`;
  }

  updateEmbedCode();
}

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
    `data-courier="${escapeAttribute(c.courier)}"`,
    `data-service-level="${escapeAttribute(c.serviceLevel)}"`,
    `data-warehouse="${escapeAttribute(c.warehouse)}"`,
    `data-layout="${c.layout}"`,
    `data-date-mode="${c.dateMode}"`,
    `data-zip-picker="${c.zipPicker}"`,
    `data-show-cutoff="${c.showCutoff}"`,
    `data-locale="${c.locale}"`,
    `data-icon="${c.icon}"`,
    `data-confidence="${c.confidence}"`,
    `data-date-format="${c.dateFormat}"`,
    `data-show-carrier="${c.showCarrier}"`,
    `data-require-zip="${c.requireZip ? 'true' : 'false'}"`,
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
    `  courier: ${JSON.stringify(c.courier)}`,
    `  serviceLevel: ${JSON.stringify(c.serviceLevel)}`,
    `  warehouse: ${JSON.stringify(c.warehouse)}`,
    `  layout: ${JSON.stringify(c.layout)}`,
    `  dateMode: ${JSON.stringify(c.dateMode)}`,
    `  zipPicker: ${JSON.stringify(c.zipPicker)}`,
    `  showCutoff: ${JSON.stringify(c.showCutoff)}`,
    `  locale: ${JSON.stringify(c.locale)}`,
    `  icon: ${JSON.stringify(c.icon)}`,
    `  confidence: ${JSON.stringify(c.confidence)}`,
    `  dateFormat: ${JSON.stringify(c.dateFormat)}`,
    `  showCarrier: ${JSON.stringify(c.showCarrier)}`,
    `  requireZip: ${c.requireZip ? 'true' : 'false'}`,
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

const controlIds = [
  'account-id', 'country', 'postal-code',
  'courier', 'service-level', 'warehouse',
  'layout', 'date-mode',
  'zip-picker', 'show-cutoff', 'locale',
  'icon', 'confidence', 'date-format',
  'fallback-days', 'show-carrier',
  'require-zip',
];
for (const id of controlIds) {
  const element = el(id);
  if (!element) continue;
  const event = element.tagName === 'SELECT' ? 'change' : 'input';
  element.addEventListener(event, () => {
    // Manual edits clear preset highlighting for the relevant bank
    if (DATA_FIELDS.some((f) => FIELD_ID_MAP[f] === id) || id === 'account-id') {
      activeData = null;
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

updateEmbedModeButtons();
applyDataPreset('minimal');
applyPresentationPreset('text-default');
