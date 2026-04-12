const SAMPLE_REQUESTS = {
  'deu': {
    accountId: '1612197',
    destinationCountry: 'DEU',
    postalCode: '',
  },
  'usa': {
    accountId: '1612197',
    destinationCountry: 'USA',
    postalCode: '',
  },
  'usa-home': {
    accountId: '1612197',
    destinationCountry: 'USA',
    postalCode: '',
    serviceLevel: 'home-delivery',
  },
};

const DEFAULT_SAMPLE = SAMPLE_REQUESTS.germany;

const accountIdInput = document.querySelector('#account-id');
const countryInput = document.querySelector('#country');
const postalCodeInput = document.querySelector('#postal-code');
const localeSelect = document.querySelector('#locale');
const layoutSelect = document.querySelector('#layout');
const densitySelect = document.querySelector('#density');
const surfaceSelect = document.querySelector('#surface');
const showCutoffCheckbox = document.querySelector('#show-cutoff');
const showCourierCheckbox = document.querySelector('#show-courier');
const showDateRangeCheckbox = document.querySelector('#show-date-range');
const showIconCheckbox = document.querySelector('#show-icon');
const zipEditableCheckbox = document.querySelector('#zip-editable');
const courierInput = document.querySelector('#courier');
const serviceLevelInput = document.querySelector('#service-level');
const warehouseInput = document.querySelector('#warehouse');
const renderButton = document.querySelector('#render-widget');
const simulateMissingButton = document.querySelector('#simulate-missing');
const sampleButtons = document.querySelectorAll('[data-sample]');
const embedModeButtons = document.querySelectorAll('[data-embed-mode]');
const mount = document.querySelector('#promise-demo');
const embedCode = document.querySelector('#embed-code');
const copyCodeButton = document.querySelector('#copy-code');

let widget;
let embedMode = 'html';
let copyCodeTimeoutId;

function currentConfig() {
  return {
    target: mount,
    accountId: accountIdInput.value || '1612197',
    destinationCountry: countryInput.value || 'DEU',
    postalCode: postalCodeInput.value || '',
    locale: localeSelect.value,
    layout: layoutSelect.value,
    density: densitySelect.value,
    surface: surfaceSelect.value,
    showCutoff: showCutoffCheckbox.checked,
    showCourier: showCourierCheckbox.checked,
    showDateRange: showDateRangeCheckbox.checked,
    showIcon: showIconCheckbox.checked,
    zipEditable: zipEditableCheckbox.checked,
    courier: courierInput.value || undefined,
    serviceLevel: serviceLevelInput.value || undefined,
    warehouse: warehouseInput.value || undefined,
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
  return new URL('./dist/promise.iife.js', window.location.href).toString();
}

function scriptAttributes() {
  return `src="${embedBundleUrl()}" defer`;
}

function htmlEmbedSnippet(config) {
  const attrs = [
    `data-promise`,
    `data-account-id="${escapeAttribute(config.accountId)}"`,
    `data-country="${escapeAttribute(config.destinationCountry)}"`,
  ];

  if (config.postalCode) attrs.push(`data-postal-code="${escapeAttribute(config.postalCode)}"`);
  if (config.locale && config.locale !== 'en') attrs.push(`data-locale="${escapeAttribute(config.locale)}"`);
  if (config.layout !== 'list') attrs.push(`data-layout="${escapeAttribute(config.layout)}"`);
  if (config.density !== 'comfortable') attrs.push(`data-density="${escapeAttribute(config.density)}"`);
  if (config.surface !== 'plain') attrs.push(`data-surface="${escapeAttribute(config.surface)}"`);
  if (!config.showCutoff) attrs.push(`data-show-cutoff="false"`);
  if (!config.showCourier) attrs.push(`data-show-courier="false"`);
  if (!config.showDateRange) attrs.push(`data-show-date-range="false"`);
  if (!config.showIcon) attrs.push(`data-show-icon="false"`);
  if (config.zipEditable) attrs.push(`data-zip-editable="true"`);
  if (config.courier) attrs.push(`data-courier="${escapeAttribute(config.courier)}"`);
  if (config.serviceLevel) attrs.push(`data-service-level="${escapeAttribute(config.serviceLevel)}"`);
  if (config.warehouse) attrs.push(`data-warehouse="${escapeAttribute(config.warehouse)}"`);

  return `<div\n  ${attrs.join('\n  ')}\n></div>\n<script ${scriptAttributes()}><\/script>`;
}

function jsEmbedSnippet(config) {
  const options = [
    `    target: '#delivery-promise'`,
    `    accountId: ${JSON.stringify(config.accountId)}`,
    `    destinationCountry: ${JSON.stringify(config.destinationCountry)}`,
  ];

  if (config.postalCode) options.push(`    postalCode: ${JSON.stringify(config.postalCode)}`);
  if (config.locale && config.locale !== 'en') options.push(`    locale: ${JSON.stringify(config.locale)}`);
  if (config.layout !== 'list') options.push(`    layout: ${JSON.stringify(config.layout)}`);
  if (config.density !== 'comfortable') options.push(`    density: ${JSON.stringify(config.density)}`);
  if (config.surface !== 'plain') options.push(`    surface: ${JSON.stringify(config.surface)}`);
  if (!config.showCutoff) options.push(`    showCutoff: false`);
  if (!config.showCourier) options.push(`    showCourier: false`);
  if (!config.showDateRange) options.push(`    showDateRange: false`);
  if (!config.showIcon) options.push(`    showIcon: false`);
  if (config.zipEditable) options.push(`    zipEditable: true`);
  if (config.courier) options.push(`    courier: ${JSON.stringify(config.courier)}`);
  if (config.serviceLevel) options.push(`    serviceLevel: ${JSON.stringify(config.serviceLevel)}`);
  if (config.warehouse) options.push(`    warehouse: ${JSON.stringify(config.warehouse)}`);

  return `<div id="delivery-promise"></div>
<script src="${embedBundleUrl()}"><\/script>
<script>
  window.DeliveryPromise.init({
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

  accountIdInput.value = config.accountId;
  countryInput.value = config.destinationCountry;
  postalCodeInput.value = config.postalCode || '';
  localeSelect.value = config.locale || 'en';
  layoutSelect.value = config.layout || 'list';
  densitySelect.value = config.density || 'comfortable';
  surfaceSelect.value = config.surface || 'plain';
  showCutoffCheckbox.checked = config.showCutoff !== false;
  showCourierCheckbox.checked = config.showCourier !== false;
  showDateRangeCheckbox.checked = config.showDateRange !== false;
  showIconCheckbox.checked = config.showIcon !== false;
  zipEditableCheckbox.checked = config.zipEditable === true;
  courierInput.value = config.courier || '';
  serviceLevelInput.value = config.serviceLevel || '';
  warehouseInput.value = config.warehouse || '';
  updateEmbedCodePreview(config);

  if (!widget) {
    widget = window.DeliveryPromise.init(config);
    return;
  }

  await widget.update(config);
}

renderButton.addEventListener('click', () => {
  void renderWidget();
});

simulateMissingButton.addEventListener('click', () => {
  void renderWidget({
    destinationCountry: 'XYZ',
    postalCode: '00000',
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

[accountIdInput, countryInput, postalCodeInput, localeSelect, layoutSelect, densitySelect, surfaceSelect, showCutoffCheckbox, showCourierCheckbox, showDateRangeCheckbox, showIconCheckbox, zipEditableCheckbox, courierInput, serviceLevelInput, warehouseInput]
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
