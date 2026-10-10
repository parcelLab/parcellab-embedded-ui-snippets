# Promise UI

Open-source reference implementation of an embeddable delivery promise widget for retailer product detail pages, cart summaries, and checkout flows. Displays estimated delivery dates, courier options, and order cutoff urgency — powered by the [parcelLab Promise API](https://docs.parcellab.com/docs/developers/promise/api).

Use this widget as-is, or as a starting point for building your own custom integration against the API.

**[Live demo](https://cdn.parcellab.com/playground/promise-ui/index.html)**

## Overview

The widget fetches delivery predictions for a given destination and account, then renders a compact, customizable UI that shows:

- **Delivery date** — the most likely delivery date, prominently displayed
- **Date range** — earliest to latest estimated delivery window
- **Courier name** — which carrier handles the shipment (DHL, UPS, etc.)
- **Cutoff urgency** — a countdown showing how long the customer has to order for the shown delivery date (with high/medium/low visual urgency)
- **Primary delivery option** — selects one delivery method from the available predictions
- **Optional IP Fetch** — estimates the country and postal code before the shopper enters a destination

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
  data-ip-fetch="true"
  data-zip-picker="inline"
  data-country-picker="true"
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
  ipFetch: true,
  locale: 'de',
  layout: 'text',
  dateMode: 'range',
  showCutoff: 'auto',
  showCarrier: 'inline',
  icon: 'truck',
  zipPicker: 'inline',
  countryPicker: true,
  theme: {
    accentColor: '#3D3AD3',
    urgentColor: '#F4373D',
    radius: '12px',
  },
  messages: {
    deliverTo: 'Lieferung nach',
  },
});

// Update for a different destination without re-mounting
widget.update({ destinationCountry: 'FRA', postalCode: '75001' });

// Tear down the widget
widget.destroy();
```

### Location requests and pickers

The widget sends one of these three location requests:

| Location input | Promise query | Picker behavior |
|----------------|---------------|-----------------|
| ZIP + country | `destination=81549_DEU` | Show the supplied ZIP in the ZIP picker. |
| Country only | `destination=DEU` | Show an empty ZIP picker. |
| IP + fallback country | `destination=8.8.8.8&fallbackCountry=DEU` | Use the ZIP and country from the response. If IP lookup or resolution fails, use the fallback country and an empty ZIP. |

`destinationCountry` is the only country setting. It supplies the country for ZIP and country-only requests, and the `fallbackCountry` query parameter for IP requests.

### Sample requests

These examples use account `1612197`. The IP addresses are examples; the demo fetches your public IP. Each data preset shows a sample request and updates the preview. Data and presentation presets can be combined.

| Use case | Sample request |
|----------|----------------|
| PDP · Germany, no ZIP | `GET /v2/prediction?user=1612197&destination=DEU&lang=en` |
| PDP · United States, no ZIP | `GET /v2/prediction?user=1612197&destination=USA&lang=en` |
| Checkout · Germany + ZIP | `GET /v2/prediction?user=1612197&destination=81371_DEU&lang=de` |
| Checkout · US + ZIP | `GET /v2/prediction?user=1612197&destination=10038_USA&lang=en` |
| PDP · IP, Germany fallback | `GET /v2/prediction?user=1612197&destination=8.8.8.8&fallbackCountry=DEU&lang=en` |
| PDP · IP, US fallback | `GET /v2/prediction?user=1612197&destination=8.8.8.8&fallbackCountry=USA&lang=en` |
| PDP · IPv6, Germany fallback | `GET /v2/prediction?user=1612197&destination=2001:4860:4860::8888&fallbackCountry=DEU&lang=en` |

For an IP response with a ZIP, the preview shows the ZIP and country with the approximate-location icon. A country-only or fallback response shows the country and **Add ZIP**. Select **ZIP required · PDP** to see the ZIP prompt without a delivery date when the response has no ZIP. Select **Minimal PDP** to hide the location row while keeping the estimate.

### Location display

Set `zipPicker: 'inline'` to show the location row in all three layouts, including loading, no-data, and error states. Set `countryPicker: true` to add an inline country control to that row. It shows only the localized country name, fits the displayed text, and opens the native country menu on click or with the keyboard. ISO3 codes remain in the option values and prediction requests. Country names use the browser's `Intl.DisplayNames`; older browsers show codes.

Set `zipPicker: 'none'` to hide the entire location row, including the ZIP picker, country dropdown, and automatic-location icon. The widget still uses the supplied, resolved, or fallback country internally. With the row hidden, `requireZip` does not block country-level predictions.

A ZIP correction keeps the country shown in the row. A country selection clears the previous ZIP. Both actions remove the automatic-location icon and skip further IP lookups. Shopper selections are saved with their country in local storage, including country selections without a ZIP. ZIP values saved by earlier versions remain supported.

When no ZIP is available, the row shows the country followed by a separate **Add ZIP** action, for example, "Deliver to United States · Add ZIP". The action opens an empty ZIP editor. A returned or entered ZIP appears as an editable destination value.

### IP Fetch

IP Fetch remains explicit in the SDK. Set `ipFetch: true` in JavaScript or `data-ip-fetch="true"` in HTML to enable it. The demo and quick-start examples use IP Fetch with country fallback:

```html
<div
  data-promise
  data-account-id="YOUR_ACCOUNT_ID"
  data-country="DEU"
  data-ip-fetch="true"
  data-zip-picker="inline"
  data-country-picker="true"
></div>
<script src="https://cdn.parcellab.com/js/promise-ui/v1/promise.iife.js" defer></script>
```

The widget requests the shopper's public IP from `https://api64.ipify.org?format=json`, which supports IPv4 and IPv6. See the [ipify API documentation](https://www.ipify.org/). It sends this value as `destination`, with the configured `destinationCountry` as the ISO3 `fallbackCountry` query parameter. A configured, entered, or saved ZIP takes priority and skips the IP lookup.

The address version depends on the shopper's network. Both IPv4 and IPv6 are supported by the widget and Backend. In the request URL, IPv6 colons appear as `%3A` because the query value is URL-encoded.

The Promise response supplies `location.country`, `location.region`, and `location.zip`. The widget displays and reuses the returned ZIP and country, even when no prediction is available. The current-location icon marks this automatic selection. Its tooltip and localized accessible label say "Approximate location based on your IP data or default country" because the response does not distinguish IP resolution from country fallback. ZIP values of `null` and `"0"` leave the ZIP picker empty. The country control selects the returned country. If the control is off, automatic selections show the country name next to the ZIP control.

The public IP request has a three-second timeout. If it fails, the widget uses `destinationCountry` with an empty ZIP. If the Backend cannot resolve the IP and returns no location, the widget retries with that same country. With the location row visible and `requireZip: true`, IP Fetch runs first; an empty resolved ZIP then requires shopper input. Public IP values and automatic locations remain in memory and are not saved in local storage.

`widget.update({ ipFetch: false })` clears the estimate and restores the configured destination. `refresh()` and presentation updates keep the estimate until a shopper or host supplies a destination.

The widget uses `GET /v2/prediction` directly. [Backend PR #52546](https://github.com/parcelLab/Backend/pull/52546) adds IP resolution and the `location` response. No Product API change is required.

IP resolution requires `IPAPI_TOKEN` in the Backend runtime, as described in the [Backend geolocation setup](https://github.com/parcelLab/Backend/blob/main/docs/endpoints/prediction-ip-geolocation.md). If the provider is unavailable or the resolved destination is unusable, the Backend can return the configured fallback country with `zip: null`. IP data can also lack a postal code. Check the Backend configuration and geolocation logs when IP requests do not return the expected location.

When enabled, the browser contacts ipify and sends the public IP to parcelLab. Backend uses ip-api Pro to resolve the location. Allow `https://api64.ipify.org` and the configured Promise API origin in your site's CSP `connect-src` directive.

### IP country fallback

Set `destinationCountry: 'USA'` in JavaScript or `data-country="USA"` in HTML to choose the country for manual requests and the Backend's IP fallback from [PR #52555](https://github.com/parcelLab/Backend/pull/52555). The value is an ISO3 country code. There is no separate fallback country setting.

Every IP request includes `fallbackCountry=destinationCountry`; there is no no-fallback mode. The fallback supplies a country-level destination, so a missing IP location does not hide the widget. Delivery methods, prediction data, and API availability still determine whether a delivery date can be shown.

```js
DeliveryPromise.init({
  target: '#delivery-promise',
  accountId: 1612197,
  destinationCountry: 'USA',
  ipFetch: true,
  countryPicker: true,
  zipPicker: 'inline',
});
```

The widget sends `fallbackCountry` only when `destination` is an IP address. The Backend uses the fallback if the IP cannot resolve or has no matching delivery methods. A usable IP location takes priority, including when it is in a different country. The fallback uses country-level delivery methods and does not retain the IP's postal code or region. Courier, service level, warehouse, and other filters still apply.

Postal codes and manual country selections bypass IP resolution and omit the fallback parameter. Supplying `destinationCountry` through `update()` clears the automatic location and requests that country directly.

## API

The widget calls the parcelLab Backend Promise API (v2):

```
GET {apiBaseUrl}/v2/prediction?user={accountId}&destination={destination}&lang={locale}
```

Default base URL: `https://api.parcellab.com`

Backend destination contract: [IP geolocation for delivery predictions](https://github.com/parcelLab/Backend/blob/main/docs/endpoints/prediction-ip-geolocation.md)

### Query Parameters

| Parameter | Source | Description |
|-----------|--------|-------------|
| `user` | `accountId` config | parcelLab account identifier |
| `destination` | Destination config or IP Fetch | Postal code and country joined with `_` (for example, `81549_DEU`), country alone (`DEU`), or the fetched IPv4/IPv6 address. A postal code takes priority over IP Fetch. |
| `fallbackCountry` | `destinationCountry` config | ISO3 fallback, sent with every IP destination and omitted for ZIP or country destinations. |
| `courier` | `courier` config | Filter to a specific logistics provider |
| `courierServiceLevel` | `serviceLevel` config | Filter to a specific service tier (e.g. `home-delivery`) |
| `warehouse` | `warehouse` config | Specify shipping origin warehouse |
| `calibration` | `calibration` config | Prediction confidence model: `conservative`, `balanced`, `aggressive` |
| `lang` | `locale` config | Localize date formatting |
| `tag` | `tag` config | Target specific adjustment rules |
| `draft` | `draft` config | Use unpublished Promise configuration (for staging) |

### Response Fields Used

| Field | Description |
|-------|-------------|
| `location` | Resolved `{ country, region, zip }`, or `null`. IP Fetch uses this location for display and later requests. |
| `prediction[].id` | Delivery method name (e.g. "DHL Standard") |
| `prediction[].courierName` | Human-readable carrier name |
| `prediction[].courierServiceLevel` | Service level tags (e.g. `home-delivery`, `express`) |
| `prediction[].prediction.earliest` | Earliest expected delivery (ISO date) |
| `prediction[].prediction.latest` | Latest expected delivery (ISO date) |
| `prediction[].prediction.mostLikely` | Most probable delivery (ISO date) |
| `prediction[].prediction.earliestLocale` | Localized earliest date string |
| `prediction[].prediction.latestLocale` | Localized latest date string |
| `prediction[].prediction.mostLikelyLocale` | Localized most likely date string |
| `prediction[].prediction.min` / `max` / `likely` | Working day estimates |
| `prediction[].prediction.cutoff` | Minutes until the delivery date shifts |
| `prediction[].prediction.cutoffLocale` | Human-readable cutoff (e.g. "2 hours") |

## Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `target` | `string \| HTMLElement` | — | **Required** for JS init. CSS selector or DOM element. |
| `accountId` | `number \| string` | — | **Required.** parcelLab account identifier. |
| `destinationCountry` | `string` | — | **Required.** ISO 3166-1 alpha-3 country code for manual requests and the IP fallback. |
| `postalCode` | `string` | — | Destination postal code for more precise estimates. Takes priority over IP Fetch. |
| `ipFetch` | `boolean` | `false` | Fetch the public IP and use the resolved destination when no postal code is available. |
| `courier` | `string` | — | Filter results to a specific courier. |
| `serviceLevel` | `string` | — | Filter results to a specific service level. |
| `warehouse` | `string` | — | Specify the shipping origin warehouse. |
| `calibration` | `'conservative' \| 'balanced' \| 'aggressive'` | — | Prediction confidence model. |
| `locale` | `string` | `'en'` | Language for default messages. Supported: `en`, `de`, `fr`, `it`, `es`. |
| `messages` | `Partial<WidgetMessages>` | — | Override any default message string. |
| `apiBaseUrl` | `string` | `'https://api.parcellab.com'` | Override the API base URL. |
| `layout` | `'text' \| 'card' \| 'badge'` | `'text'` | Layout mode (see below). |
| `dateMode` | `'from' \| 'on' \| 'by' \| 'range'` | `'from'` | Which delivery date or range to display. |
| `showCutoff` | `'auto' \| 'always' \| 'never' \| 'express-only'` | `'auto'` | Control the order cutoff line. |
| `showCarrier` | `'none' \| 'inline' \| boolean` | `'none'` | Show the courier name next to the prediction. |
| `icon` | `'none' \| 'truck' \| 'calendar'` | `'none'` | Summary icon. Automatic location selections have a separate icon when the location row is visible. |
| `zipPicker` | `'none' \| 'inline' \| 'link'` | `'none'` | `none` hides the full location row. `inline` shows an editable ZIP, including when empty. `link` retains the legacy postal code prompt. |
| `countryPicker` | `boolean` | `false` | Add an inline country name that opens the native country menu when the location row is visible. Selection skips IP Fetch and clears the previous ZIP. |
| `requireZip` | `boolean` | `false` | Require a ZIP when the location row is visible. With IP Fetch, try to resolve it first. Ignored when `zipPicker` is `none`. |
| `confidence` | `'auto' \| 'estimated' \| 'guaranteed'` | `'auto'` | Delivery wording. `auto` uses guaranteed wording for express services. |
| `dateFormat` | `'long' \| 'longWithYear' \| 'short' \| 'shortWithYear' \| 'relative'` | `'long'` | Format of delivery dates. |
| `fallbackDays` | `number \| [number, number]` | — | Static delivery time when predictions are unavailable. |
| `maxPredictions` | `number` | `5` | Maximum delivery options to display. |
| `selectionReferenceDate` | `'earliest' \| 'latest' \| 'mostLikely'` | `'mostLikely'` | Which API date field is compared across predictions when picking the primary. |
| `selectionPick` | `'earliest' \| 'latest'` | `'earliest'` | Pick the prediction with the smallest (`earliest`) or largest (`latest`) reference date. |
| `draft` | `boolean` | `false` | Use unpublished Promise configuration. |
| `tag` | `string` | — | Target specific adjustment rules. |
| `className` | `string` | — | Extra CSS class added to the root element. |
| `theme` | `Partial<WidgetTheme>` | — | CSS token overrides (colors, radius, etc.). |

### Layout Modes

| Mode | Description | Best for |
|------|-------------|----------|
| `text` | Delivery sentence with an optional destination and cutoff line | Product pages |
| `card` | Prominent date with destination and delivery details | Product pages with space |
| `badge` | Compact date chip with the optional location row | Checkout summaries |

### Selecting the Primary Prediction

The Promise API can return several predictions (one per courier / service level). The widget renders one as the primary headline and uses two options to decide which:

- **`selectionReferenceDate`** — which date field on each prediction is the basis for comparison: `earliest` uses `prediction.earliest`, `latest` uses `prediction.latest`, `mostLikely` uses `prediction.mostLikely`.
- **`selectionPick`** — once predictions are sorted by that reference date, take the one with the smallest (`earliest`) or largest (`latest`) value.

Common combinations:

| Goal | `selectionReferenceDate` | `selectionPick` |
|------|--------------------------|-----------------|
| Show the option that arrives soonest (default) | `mostLikely` | `earliest` |
| Show the option whose worst case is best (most reliable upper bound) | `latest` | `earliest` |
| Show the option that delivers earliest in the best case | `earliest` | `earliest` |
| Show the slowest option | `mostLikely` | `latest` |

Pre-filtering (`courier`, `serviceLevel`, `warehouse`) is applied server-side before this selection runs, so the two work together: filter for the eligible options, then pick one.

### HTML Data Attributes

When using the IIFE auto-init, configure via `data-*` attributes:

```html
<div
  data-promise
  data-account-id="1612197"
  data-country="DEU"
  data-postal-code="80469"
  data-locale="de"
  data-layout="text"
  data-date-mode="range"
  data-show-cutoff="auto"
  data-show-carrier="inline"
  data-icon="truck"
  data-zip-picker="inline"
  data-country-picker="true"
  data-ip-fetch="false"
  data-courier="dhl-germany"
  data-service-level="home-delivery"
  data-warehouse="EU-1"
  data-max-predictions="3"
  data-selection-reference-date="latest"
  data-selection-pick="earliest"
  data-messages='{"deliverTo":"Lieferung nach"}'
  data-theme='{"accentColor":"#3D3AD3","radius":"8px"}'
></div>
```

## Styling

The widget renders in **light DOM** (not Shadow DOM), so host-page typography inherits naturally and you can target the markup directly with CSS.

### Root Classes

```
.pl-promise
.pl-promise--layout-{text|card|badge}
```

### Element Classes

```
.pl-promise__summary               — delivery sentence
.pl-promise__summary-date          — main delivery date
.pl-promise__summary-icon          — summary icon
.pl-promise__deliver-to            — destination display
.pl-promise__location-estimated    — accessible automatic-location marker
.pl-promise__location-icon         — current-location SVG
.pl-promise__country-inline        — country name styled like the ZIP edit control
.pl-promise__country-select        — native country selector over the inline name
.pl-promise__zip-inline            — postal code edit button
.pl-promise__zip-form              — postal code editor
.pl-promise__zip-input             — postal code input
.pl-promise__zip-apply             — Apply button
.pl-promise__via                   — courier annotation
.pl-promise__cutoff-line           — text layout cutoff
.pl-promise__card                  — card layout
.pl-promise__card-date             — card delivery date
.pl-promise__card-meta             — courier, cutoff, destination
.pl-promise__badge                 — badge layout
.pl-promise__link                  — postal code prompt
.pl-promise__loading               — loading state
.pl-promise__state                 — empty and error states
.pl-promise__state-heading         — empty and error headings
```

### CSS Overrides

```css
/* Change the accent color */
.pl-promise { --plp-accent: #3D3AD3; }

/* Make urgency less alarming */
.pl-promise { --plp-urgent: #c05600; }

/* Hide courier names */
.pl-promise__via { display: none; }

/* Hide the text cutoff line */
.pl-promise__cutoff-line { display: none; }

/* Hide the summary icon */
.pl-promise__summary-icon { display: none; }

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
# From the repository root
npm install
npm run dev:promise
```

Open the HTTP demo at `http://localhost:4174/`. Opening `dev/index.html` with `file://` does not load the widget correctly. Select one location request type: ZIP + country, country only, or IP Fetch + fallback country. Presentation controls set the location row visibility, country picker, layout, locale, and other display options. The demo generates copyable HTML and JavaScript embeds.

The demo starts with **PDP · IP (Germany fallback)** and **Standard PDP**. The **PDP · IP (US fallback)** data preset uses the same lookup with a US fallback. Both send the configured country as `fallbackCountry` in the request URL. The single country field stays visible for all request types.

Data preset labels identify PDP and checkout use cases. Hover over a preset for a short explanation. The **Sample request** below the data presets shows the current query, including any filters. Its IP address is an example; use **Show API response** to inspect the actual request and returned location.

| Presentation preset | Behavior |
|---------------------|----------|
| **Standard PDP** | Date range, carrier, cutoff, and inline ZIP and country controls. Country-level predictions remain available when no ZIP resolves. |
| **Minimal PDP** | Delivery estimate and cutoff, with the destination row hidden. IP resolution and country fallback still apply. |
| **ZIP required · PDP** | Require a returned or entered ZIP before showing a date. An empty ZIP keeps the country and **Add ZIP** action visible. |
| **Card · PDP** | Prominent delivery date and carrier in a card. |
| **Badge · Checkout** | Compact delivery date with the destination row hidden. |

### Build

```bash
# From the repository root
npm run build --workspace=packages/promise-ui
npm run build:site --workspace=packages/promise-ui
```

The package build produces `dist/promise.iife.js` and `dist/promise.esm.js` with TypeScript type declarations in `dist/types/`. The site build produces the demo and its bundle in `site/`.

### Test

```bash
# From the repository root
npm test --workspace=packages/promise-ui
npx tsc -p packages/promise-ui/tsconfig.json --noEmit
```

Runs the Vitest widget and demo tests with jsdom, then checks TypeScript without emitting files.

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

- [Promise API Reference](https://docs.parcellab.com/docs/developers/promise/api) — product documentation
- [Legacy Promise Plugin](https://github.com/parcelLab/parcellab-promise-plugin) — previous Svelte-based implementation (v2 API)
- [Selection Guide UI](../selection-guide-ui/) — companion widget for size recommendations

## License

[MIT](LICENSE)
