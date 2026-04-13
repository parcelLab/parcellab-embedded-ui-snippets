# @parcellab/promise-ui

Embeddable delivery promise widget for retailer product and checkout pages. Displays estimated delivery dates, courier options, and order cutoff urgency powered by the parcelLab Promise API.

## Usage

### Script tag

```html
<div data-promise
     data-account-id="YOUR_ACCOUNT_ID"
     data-country="DEU"
     data-postal-code="80469">
</div>

<script src="https://cdn.parcellab.com/js/promise-ui/v1/promise.iife.js" defer></script>
```

### JavaScript API

```js
import { init } from '@parcellab/promise-ui';

const widget = init({
  target: '#delivery-promise',
  accountId: 123,
  destinationCountry: 'DEU',
  postalCode: '80469',
  locale: 'en',
  layout: 'list',
});

// Update later
widget.update({ postalCode: '10115' });

// Clean up
widget.destroy();
```

## Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `target` | `string \| HTMLElement` | — | CSS selector or element to mount into (required) |
| `accountId` | `number \| string` | — | parcelLab account ID (required) |
| `destinationCountry` | `string` | — | ISO 3166-1 alpha-3 country code (required) |
| `postalCode` | `string` | — | Destination postal code for refined estimates |
| `courier` | `string` | — | Filter to specific courier |
| `serviceLevel` | `string` | — | Filter to specific service level |
| `warehouse` | `string` | — | Specify shipping origin |
| `calibration` | `string` | — | `conservative`, `balanced`, or `aggressive` |
| `locale` | `string` | `'en'` | Language code (`en`, `de`, `fr`, `it`, `es`) |
| `layout` | `string` | `'list'` | Layout mode: `list`, `compact`, `banner` |
| `density` | `string` | `'comfortable'` | Layout density: `comfortable`, `compact` |
| `surface` | `string` | `'plain'` | Background: `plain` (transparent), `subtle` (filled) |
| `theme` | `object` | — | Override CSS custom properties |
| `messages` | `object` | — | Override i18n strings |
| `showCutoff` | `boolean` | `true` | Show order cutoff urgency |
| `showCourier` | `boolean` | `true` | Show courier name |
| `showDateRange` | `boolean` | `true` | Show earliest–latest range |
| `showIcon` | `boolean` | `true` | Show truck icon in header |
| `zipEditable` | `boolean` | `false` | Allow user to change postal code |
| `maxPredictions` | `number` | `5` | Maximum delivery options to show |
| `draft` | `boolean` | `false` | Use unpublished Promise configuration |
| `tag` | `string` | — | Target specific adjustment rules |

## Layout modes

- **`list`** — Each delivery option as a separate card with full details. Best for product pages where space allows.
- **`compact`** — Stacked cards without gaps, sharing borders. Denser layout for sidebars or compact spaces.
- **`banner`** — Horizontal single-line layout. Best for checkout summaries or narrow inline placements.

## Development

```bash
npm run dev    # Start dev server at localhost:4174
npm run build  # Build ESM + IIFE bundles
npm test       # Run tests
```

## License

MIT
