# Promise UI

Open-source reference implementation of an embeddable delivery promise widget for retailer product detail pages, cart summaries, and checkout flows. Displays estimated delivery dates, courier options, and order cutoff urgency — powered by the [parcelLab Promise API](https://docs.parcellab.com/docs/developers/promise/api).

Use this widget as-is, or as a starting point for building your own custom integration against the API.

## Overview

The widget fetches delivery predictions for a given destination and account, then renders a compact, customizable UI that shows:

- **Delivery date** — the most likely delivery date, prominently displayed
- **Date range** — earliest to latest estimated delivery window
- **Courier name** — which carrier handles the shipment (DHL, UPS, etc.)
- **Cutoff urgency** — a countdown showing how long the customer has to order for the shown delivery date (with high/medium/low visual urgency)
- **Multiple delivery options** — shows all available shipping methods side by side

It ships as a zero-dependency bundle in two formats:

| Format | File | Use case |
|--------|------|----------|
| IIFE | `dist/promise.iife.js` | `<script>` tag embeds — auto-initializes from `data-*` attributes |
| ESM | `dist/promise.esm.js` | Module bundlers and `import` consumers |

## Quick Start

### HTML Embed (simplest)

```html
<div
  data-promise
  data-account-id="YOUR_ACCOUNT_ID"
  data-country="DEU"
  data-postal-code="80469"
></div>

<script src="https://cdn.parcellab.com/js/promise-ui/v1/promise.iife.js" defer></script>
```

The IIFE build auto-initializes every `[data-promise]` element on the page.

### JavaScript API

```js
const widget = window.DeliveryPromise.init({
  target: '#delivery-promise',
  accountId: 1612197,
  destinationCountry: 'DEU',
  postalCode: '80469',
  locale: 'de',
  layout: 'list',
  density: 'comfortable',
  surface: 'subtle',
  showCutoff: true,
  showCourier: true,
  showDateRange: true,
  showIcon: true,
  zipEditable: true,
  theme: {
    accentColor: '#3D3AD3',
    urgentColor: '#F4373D',
    radius: '12px',
  },
  messages: {
    title: 'Lieferzeit',
  },
});

// Update for a different destination without re-mounting
widget.update({ destinationCountry: 'FRA', postalCode: '75001' });

// Tear down the widget
widget.destroy();
```

## API

The widget calls the parcelLab Promise API (v4):

```
GET {apiBaseUrl}/v4/promise/prediction/predict/?account={accountId}&destination_country_iso3={country}
```

Default base URL: `https://api.parcellab.com`

Full API documentation: [Promise API Reference](https://docs.parcellab.com/docs/developers/promise/api)

### Query Parameters

| Parameter | Source | Description |
|-----------|--------|-------------|
| `account` | `accountId` config | parcelLab account identifier |
| `destination_country_iso3` | `destinationCountry` config | ISO 3166-1 alpha-3 country code (e.g. `DEU`, `USA`, `GBR`) |
| `destination_postal_code` | `postalCode` config | Destination postal code for refined estimates |
| `courier` | `courier` config | Filter to a specific logistics provider |
| `service_level` | `serviceLevel` config | Filter to a specific service tier (e.g. `home-delivery`) |
| `warehouse` | `warehouse` config | Specify shipping origin warehouse |
| `calibration` | `calibration` config | Prediction confidence model: `conservative`, `balanced`, `aggressive` |
| `language_iso2` | `locale` config | Localize date formatting |
| `tag` | `tag` config | Target specific adjustment rules |
| `draft` | `draft` config | Use unpublished Promise configuration (for staging) |

### Response Fields Used

| Field | Description |
|-------|-------------|
| `prediction[].id` | Delivery method name (e.g. "DHL Standard") |
| `prediction[].courier_name` | Human-readable carrier name |
| `prediction[].courier_service_level` | Service level tags (e.g. `home-delivery`, `express`) |
| `prediction[].prediction.earliest_date` | Earliest expected delivery (ISO date) |
| `prediction[].prediction.latest_date` | Latest expected delivery (ISO date) |
| `prediction[].prediction.most_likely_date` | Most probable delivery (ISO date) |
| `prediction[].prediction.earliest_locale` | Localized earliest date string |
| `prediction[].prediction.latest_locale` | Localized latest date string |
| `prediction[].prediction.most_likely_locale` | Localized most likely date string |
| `prediction[].prediction.min` / `max` / `likely` | Working day estimates |
| `prediction[].prediction.cutoff` | Minutes until the delivery date shifts |
| `prediction[].prediction.cutoff_locale` | Human-readable cutoff (e.g. "2 hours") |

## Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `target` | `string \| HTMLElement` | — | **Required** for JS init. CSS selector or DOM element. |
| `accountId` | `number \| string` | — | **Required.** parcelLab account identifier. |
| `destinationCountry` | `string` | — | **Required.** ISO 3166-1 alpha-3 country code. |
| `postalCode` | `string` | — | Destination postal code for more precise estimates. |
| `courier` | `string` | — | Filter results to a specific courier. |
| `serviceLevel` | `string` | — | Filter results to a specific service level. |
| `warehouse` | `string` | — | Specify the shipping origin warehouse. |
| `calibration` | `'conservative' \| 'balanced' \| 'aggressive'` | — | Prediction confidence model. |
| `locale` | `string` | `'en'` | Language for default messages. Supported: `en`, `de`, `fr`, `it`, `es`. |
| `messages` | `Partial<WidgetMessages>` | — | Override any default message string. |
| `apiBaseUrl` | `string` | `'https://api.parcellab.com'` | Override the API base URL. |
| `layout` | `'list' \| 'compact' \| 'banner'` | `'list'` | Layout mode (see below). |
| `density` | `'compact' \| 'comfortable'` | `'comfortable'` | Spacing density. |
| `surface` | `'subtle' \| 'plain'` | `'plain'` | `subtle` renders a bordered card; `plain` renders inline. |
| `showCutoff` | `boolean` | `true` | Show the order cutoff urgency line. |
| `showCourier` | `boolean` | `true` | Show the courier name on each prediction card. |
| `showDateRange` | `boolean` | `true` | Show the earliest–latest date range below the main date. |
| `showIcon` | `boolean` | `true` | Show the truck icon in the header. |
| `zipEditable` | `boolean` | `false` | Allow the user to enter or change the postal code. |
| `maxPredictions` | `number` | `5` | Maximum delivery options to display. |
| `draft` | `boolean` | `false` | Use unpublished Promise configuration. |
| `tag` | `string` | — | Target specific adjustment rules. |
| `className` | `string` | — | Extra CSS class added to the root element. |
| `theme` | `Partial<WidgetTheme>` | — | CSS token overrides (colors, radius, etc.). |

### Layout Modes

| Mode | Description | Best for |
|------|-------------|----------|
| `list` | Each delivery option as a separate card with full details | Product pages with space |
| `compact` | Stacked cards sharing borders, no gaps between them | Sidebars, compact spaces |
| `banner` | Horizontal single-line layout per option | Checkout summaries, narrow inline placements |

### HTML Data Attributes

When using the IIFE auto-init, configure via `data-*` attributes:

```html
<div
  data-promise
  data-account-id="1612197"
  data-country="DEU"
  data-postal-code="80469"
  data-locale="de"
  data-layout="compact"
  data-density="comfortable"
  data-surface="subtle"
  data-show-cutoff="true"
  data-show-courier="true"
  data-show-date-range="false"
  data-show-icon="true"
  data-zip-editable="true"
  data-courier="dhl-germany"
  data-service-level="home-delivery"
  data-warehouse="EU-1"
  data-max-predictions="3"
  data-messages='{"title":"Lieferzeit"}'
  data-theme='{"accentColor":"#3D3AD3","radius":"8px"}'
></div>
```

## Styling

The widget renders in **light DOM** (not Shadow DOM), so host-page typography inherits naturally and you can target the markup directly with CSS.

### Root Classes

```
.pl-promise
.pl-promise--layout-{list|compact|banner}
.pl-promise--density-{compact|comfortable}
.pl-promise--surface-{subtle|plain}
```

### Element Classes

```
.pl-promise__header                — header row (title + zip)
.pl-promise__title                 — "Estimated Delivery" heading
.pl-promise__title-icon            — truck SVG icon
.pl-promise__zip                   — zip code display / editor container
.pl-promise__zip-label             — "Deliver to" text
.pl-promise__zip-value             — postal code value
.pl-promise__zip-btn               — "Change" / "Enter postal code" button
.pl-promise__zip-form              — inline edit form
.pl-promise__zip-input             — postal code text input
.pl-promise__zip-submit            — "Apply" button
.pl-promise__predictions           — predictions list container
.pl-promise__card                  — single prediction card
.pl-promise__card-row              — horizontal row within a card
.pl-promise__date                  — most likely delivery date (prominent)
.pl-promise__date-range            — earliest – latest range text
.pl-promise__courier               — courier name badge
.pl-promise__days                  — "1–3 business days" text
.pl-promise__cutoff                — cutoff urgency line
.pl-promise__cutoff--high          — < 1 hour remaining (red, bold)
.pl-promise__cutoff--medium        — 1–3 hours remaining (red, medium)
.pl-promise__cutoff--low           — > 3 hours remaining (muted)
.pl-promise__cutoff-icon           — clock SVG icon
.pl-promise__loading               — loading state container
.pl-promise__spinner               — spinner SVG
.pl-promise__empty                 — empty state (no predictions found)
.pl-promise__error                 — error state (API failure)
```

### CSS Overrides

```css
/* Change the accent color */
.pl-promise { --plp-accent: #3D3AD3; }

/* Make urgency less alarming */
.pl-promise { --plp-urgent: #c05600; }

/* Hide courier names */
.pl-promise__courier { display: none; }

/* Hide cutoff on low urgency */
.pl-promise__cutoff--low { display: none; }

/* Hide the truck icon */
.pl-promise__title-icon { display: none; }

/* Custom card styling */
.pl-promise__card {
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}
```

### CSS Variables

Override these on `.pl-promise` or any ancestor:

| Variable | Description |
|----------|-------------|
| `--plp-background` | Widget background color |
| `--plp-card-background` | Prediction card background |
| `--plp-border` | Border color |
| `--plp-text` | Primary text color |
| `--plp-muted-text` | Secondary / muted text color |
| `--plp-accent` | Accent color (links, interactive elements) |
| `--plp-urgent` | Urgent cutoff color (high / medium urgency) |
| `--plp-success` | Success color |
| `--plp-icon` | Icon color (truck, clock) |
| `--plp-radius` | Border radius |

## Widget Instance API

The `init()` call returns a `WidgetInstance` with these methods:

| Method | Description |
|--------|-------------|
| `update(config)` | Update configuration and re-fetch. Cancels any in-flight request. |
| `refresh()` | Re-fetch with current configuration. |
| `destroy()` | Remove the widget from the DOM and clean up. |

## Development

```bash
npm install    # from monorepo root
npm run dev    # starts dev server at localhost:4174
```

Opens a demo page with interactive controls for country, postal code, layout, density, surface, locale, and visibility toggles. The demo generates copyable embed snippets for both HTML and JS integration styles.

### Build

```bash
npm run build
```

Produces `dist/promise.iife.js` and `dist/promise.esm.js` with TypeScript type declarations in `dist/types/`.

### Test

```bash
npm test
```

Runs the Vitest test suite with jsdom.

### Deployment

The project deploys to S3/CloudFront via GitHub Actions:

- **Staging:** automatically deployed on push to `main` (when files in `packages/promise-ui/` change)
- **Production:** deployed on GitHub release with tag `promise-ui/<version>`

## Building Your Own

This widget is an open-source reference implementation. If you need a custom integration:

1. **Use the API directly** — call the [Promise API](https://docs.parcellab.com/docs/developers/promise/api) from your own frontend code and render the response however you like.
2. **Fork this repo** — start from this codebase and customize the rendering, styling, and behavior to match your exact requirements.
3. **Use as a library** — import the ESM build and override messages, theme, and CSS to fit your design system.

The source code in `src/` is organized into clear modules (API client, config resolution, model transformation, rendering) that you can reference or reuse.

## Related

- [Promise API Reference](https://docs.parcellab.com/docs/developers/promise/api) — full v4 API documentation
- [Legacy Promise Plugin](https://github.com/parcelLab/parcellab-promise-plugin) — previous Svelte-based implementation (v2 API)
- [Selection Guide UI](../selection-guide-ui/) — companion widget for size recommendations

## License

[MIT](LICENSE)
