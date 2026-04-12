const SAMPLE_REQUESTS = {
  pants: {
    productId: "Men's Iver Pants (tailored fit)",
    accountId: '1617954',
  },
  shirt: {
    productId: '6792154579016',
    accountId: '1619013',
  },
  'pants-large': {
    productId: "Men's Pro 3L 3.0 Pants",
    accountId: '1617954',
  },
  'pants-small': {
    productId: "Men's Iver 5-Pocket Pants",
    accountId: '1617954',
  },
};

const DEFAULT_SAMPLE = SAMPLE_REQUESTS.pants;
const DEFAULT_PRODUCT_ID = DEFAULT_SAMPLE.productId;
const DEFAULT_ACCOUNT_ID = DEFAULT_SAMPLE.accountId;

const productIdInput = document.querySelector('#product-id');
const accountIdInput = document.querySelector('#account-id');
const notFoundModeSelect = document.querySelector('#not-found-mode');
const appearanceSelect = document.querySelector('#appearance');
const densitySelect = document.querySelector('#density');
const surfaceSelect = document.querySelector('#surface');
const localeSelect = document.querySelector('#locale');
const showPillCheckbox = document.querySelector('#show-pill');
const showScaleCheckbox = document.querySelector('#show-scale');
const showRecommendationCheckbox = document.querySelector('#show-recommendation');
const showSummaryCheckbox = document.querySelector('#show-summary');
const renderButton = document.querySelector('#render-widget');
const simulateMissingButton = document.querySelector('#simulate-missing');
const sampleButtons = document.querySelectorAll('[data-sample]');
const embedModeButtons = document.querySelectorAll('[data-embed-mode]');
const mount = document.querySelector('#size-recommender-demo');
const embedCode = document.querySelector('#embed-code');
const copyCodeButton = document.querySelector('#copy-code');

let widget;
let embedMode = 'html';
let copyCodeTimeoutId;

function currentConfig() {
  return {
    target: mount,
    accountId: accountIdInput.value || DEFAULT_ACCOUNT_ID,
    productId: productIdInput.value || DEFAULT_PRODUCT_ID,
    notFoundMode: notFoundModeSelect.value,
    appearance: appearanceSelect.value,
    density: densitySelect.value,
    surface: surfaceSelect.value,
    locale: localeSelect.value,
    showPill: showPillCheckbox.checked,
    showScale: showScaleCheckbox.checked,
    showRecommendation: showRecommendationCheckbox.checked,
    showSummary: showSummaryCheckbox.checked,
  };
}

function escapeAttribute(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function embedBundleUrl() {
  return new URL('./dist/size-recommender.iife.js', window.location.href).toString();
}

function scriptAttributes() {
  return `src="${embedBundleUrl()}" defer`;
}

function htmlEmbedSnippet(config) {
  const attrs = [
    `data-size-recommender`,
    `data-account-id="${escapeAttribute(config.accountId)}"`,
    `data-product-id="${escapeAttribute(config.productId)}"`,
    `data-not-found-mode="${escapeAttribute(config.notFoundMode)}"`,
    `data-appearance="${escapeAttribute(config.appearance)}"`,
    `data-density="${escapeAttribute(config.density)}"`,
    `data-surface="${escapeAttribute(config.surface)}"`,
  ];

  if (config.locale && config.locale !== 'en') {
    attrs.push(`data-locale="${escapeAttribute(config.locale)}"`);
  }
  if (!config.showPill) attrs.push(`data-show-pill="false"`);
  if (!config.showScale) attrs.push(`data-show-scale="false"`);
  if (!config.showRecommendation) attrs.push(`data-show-recommendation="false"`);
  if (!config.showSummary) attrs.push(`data-show-summary="false"`);

  return `<div\n  ${attrs.join('\n  ')}\n></div>\n<script ${scriptAttributes()}><\/script>`;
}

function jsEmbedSnippet(config) {
  const options = [
    `    target: '#size-recommender'`,
    `    accountId: ${JSON.stringify(config.accountId)}`,
    `    productId: ${JSON.stringify(config.productId)}`,
    `    notFoundMode: ${JSON.stringify(config.notFoundMode)}`,
    `    appearance: ${JSON.stringify(config.appearance)}`,
    `    density: ${JSON.stringify(config.density)}`,
    `    surface: ${JSON.stringify(config.surface)}`,
  ];

  if (config.locale && config.locale !== 'en') {
    options.push(`    locale: ${JSON.stringify(config.locale)}`);
  }
  if (!config.showPill) options.push(`    showPill: false`);
  if (!config.showScale) options.push(`    showScale: false`);
  if (!config.showRecommendation) options.push(`    showRecommendation: false`);
  if (!config.showSummary) options.push(`    showSummary: false`);

  return `<div id="size-recommender"></div>
<script src="${embedBundleUrl()}"><\/script>
<script>
  window.SizeRecommender.init({
${options.join(',\n')}
  });
<\/script>`;
}

function updateEmbedModeButtons() {
  const activeClasses = ['bg-navy-800', 'border-navy-800', 'text-white'];
  const inactiveClasses = ['bg-white', 'border-navy-200', 'text-navy-500', 'hover:bg-navy-50'];

  embedModeButtons.forEach((button) => {
    const isActive = button.dataset.embedMode === embedMode;
    button.setAttribute('aria-pressed', String(isActive));

    if (isActive) {
      button.classList.remove(...inactiveClasses);
      button.classList.add(...activeClasses);
    } else {
      button.classList.remove(...activeClasses);
      button.classList.add(...inactiveClasses);
    }
  });
}

function updateEmbedCodePreview(overrides = {}) {
  if (!embedCode) {
    return;
  }

  const config = {
    ...currentConfig(),
    ...overrides,
  };
  const snippet =
    embedMode === 'js' ? jsEmbedSnippet(config) : htmlEmbedSnippet(config);

  embedCode.textContent = snippet;
}

async function copyEmbedCode() {
  if (!embedCode || !copyCodeButton) {
    return;
  }

  const text = embedCode.textContent ?? '';

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'absolute';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      textarea.remove();
    }
  } catch (error) {
    console.error('Failed to copy embed code.', error);
    return;
  }

  copyCodeButton.dataset.copied = 'true';
  copyCodeButton.setAttribute('title', 'Copied');
  copyCodeButton.setAttribute('aria-label', 'Embed code copied');

  window.clearTimeout(copyCodeTimeoutId);
  copyCodeTimeoutId = window.setTimeout(() => {
    copyCodeButton.dataset.copied = 'false';
    copyCodeButton.setAttribute('title', 'Copy embed code');
    copyCodeButton.setAttribute('aria-label', 'Copy embed code');
  }, 1200);
}

async function renderWidget(overrides = {}) {
  const config = {
    ...currentConfig(),
    ...overrides,
  };

  productIdInput.value = config.productId;
  accountIdInput.value = config.accountId;
  notFoundModeSelect.value = config.notFoundMode;
  appearanceSelect.value = config.appearance;
  densitySelect.value = config.density;
  surfaceSelect.value = config.surface;
  localeSelect.value = config.locale || 'en';
  showPillCheckbox.checked = config.showPill !== false;
  showScaleCheckbox.checked = config.showScale !== false;
  showRecommendationCheckbox.checked = config.showRecommendation !== false;
  showSummaryCheckbox.checked = config.showSummary !== false;
  updateEmbedCodePreview(config);

  if (!widget) {
    widget = window.SizeRecommender.init(config);
    return;
  }

  await widget.update(config);
}

renderButton.addEventListener('click', () => {
  void renderWidget();
});

simulateMissingButton.addEventListener('click', () => {
  void renderWidget({
    productId: 'This product does not exist',
  });
});

sampleButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const sample = SAMPLE_REQUESTS[button.dataset.sample];

    if (!sample) {
      return;
    }

    void renderWidget(sample);
  });
});

embedModeButtons.forEach((button) => {
  button.addEventListener('click', () => {
    embedMode = button.dataset.embedMode === 'js' ? 'js' : 'html';
    updateEmbedModeButtons();
    updateEmbedCodePreview();
  });
});

copyCodeButton?.addEventListener('click', () => {
  void copyEmbedCode();
});

[productIdInput, accountIdInput, notFoundModeSelect, appearanceSelect, densitySelect, surfaceSelect, localeSelect, showPillCheckbox, showScaleCheckbox, showRecommendationCheckbox, showSummaryCheckbox]
  .filter(Boolean)
  .forEach((element) => {
    element.addEventListener('input', () => {
      updateEmbedCodePreview();
    });
    element.addEventListener('change', () => {
      updateEmbedCodePreview();
    });
  });

updateEmbedModeButtons();
updateEmbedCodePreview();
void renderWidget();