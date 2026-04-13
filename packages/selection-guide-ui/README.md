# @parcellab/selection-guide-ui

Embeddable size recommendation widget for retailer product detail pages. Displays fit guidance, confidence scores, and customer feedback summaries powered by the parcelLab Size Recommender API.

## Usage

### Script tag

```html
<div data-size-recommender
     data-account-id="YOUR_ACCOUNT_ID"
     data-product-id="YOUR_PRODUCT_ID">
</div>

<script src="https://cdn.parcellab.com/js/selection-guide-ui/v1/size-recommender.iife.js" defer></script>
```

### JavaScript API

```js
import { init } from '@parcellab/selection-guide-ui';

const widget = init({
  target: '#size-guide',
  accountId: 123,
  productId: 'SKU-001',
  locale: 'en',
  appearance: 'colored',
  density: 'comfortable',
});

// Update later
widget.update({ productId: 'SKU-002' });

// Clean up
widget.destroy();
```

## Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `target` | `string \| HTMLElement` | — | CSS selector or element to mount into (required) |
| `accountId` | `number \| string` | — | parcelLab account ID (required) |
| `productId` | `string` | — | Product identifier (required) |
| `locale` | `string` | `'en'` | Language code (`en`, `de`, `fr`, `it`, `es`) |
| `appearance` | `string` | `'colored'` | Visual mode: `colored`, `neutral`, `alert` |
| `density` | `string` | `'comfortable'` | Layout density: `comfortable`, `compact` |
| `surface` | `string` | `'plain'` | Background: `plain` (transparent), `subtle` (filled) |
| `notFoundMode` | `string` | `'true-to-size'` | Fallback: `true-to-size`, `empty`, `hidden` |
| `theme` | `object` | — | Override CSS custom properties |
| `messages` | `object` | — | Override i18n strings |
| `showPill` | `boolean` | `true` | Show fit category pill |
| `showScale` | `boolean` | `true` | Show fit scale visualization |
| `showRecommendation` | `boolean` | `true` | Show recommendation heading |
| `showSummary` | `boolean` | `true` | Show summary text |

## Development

```bash
npm run dev    # Start dev server at localhost:4173
npm run build  # Build ESM + IIFE bundles
npm test       # Run tests
```

## License

MIT
