# parcelLab Embedded UI Snippets

Lightweight, dependency-free UI widgets that bring parcelLab product features directly into retailer pages. Each snippet is a self-contained embeddable component — drop a single `<script>` tag and go.

## Packages

| Package | Description | CDN |
|---------|-------------|-----|
| [`selection-guide-ui`](./packages/selection-guide-ui/) | Size recommendation widget for product detail pages. Shows fit guidance, confidence scores, and customer feedback summaries. | `cdn.parcellab.com/js/selection-guide-ui/v1/` |
| [`promise-ui`](./packages/promise-ui/) | Delivery promise widget for product and checkout pages. Displays estimated delivery dates, courier options, and order cutoff urgency. | `cdn.parcellab.com/js/promise-ui/v1/` |

## Quick Start

Each widget can be embedded in two ways:

### 1. Script tag (zero-config)

```html
<!-- Selection Guide -->
<div data-size-recommender data-account-id="123" data-product-id="SKU-001"></div>
<script src="https://cdn.parcellab.com/js/selection-guide-ui/v1/size-recommender.iife.js" defer></script>

<!-- Promise -->
<div data-promise data-account-id="123" data-country="DEU" data-postal-code="80469"></div>
<script src="https://cdn.parcellab.com/js/promise-ui/v1/promise.iife.js" defer></script>
```

### 2. JavaScript API (programmatic)

```js
import { init } from '@parcellab/selection-guide-ui';

const widget = init({
  target: '#size-guide',
  accountId: 123,
  productId: 'SKU-001',
});
```

```js
import { init } from '@parcellab/promise-ui';

const widget = init({
  target: '#delivery-promise',
  accountId: 123,
  destinationCountry: 'DEU',
  postalCode: '80469',
});
```

## Development

This is an npm workspace monorepo. All packages share the same development conventions.

```bash
# Install all dependencies
npm install

# Build all packages
npm run build

# Dev server for a specific package
npm run dev:selection-guide
npm run dev:promise

# Run all tests
npm test
```

### Package structure

Each package follows the same layout:

```
packages/<name>/
  src/           TypeScript source
  dev/           Demo page for local development
  test/          Vitest tests
  scripts/       Build and dev server scripts (esbuild)
  dist/          Built output (git-ignored)
```

### Build output

Each package produces two bundles:

- **ESM** — for bundler-based integrations (`import { init } from '...'`)
- **IIFE** — for script tag drops (auto-initializes from `data-*` attributes)

### Deployment

- Push to `main` → deploys demo to staging CDN
- Create a GitHub release → publishes versioned + latest bundles to production CDN

## Architecture

- **Zero dependencies** — each widget is a single self-contained JS file
- **CSS-in-JS** — styles are injected at runtime, no external stylesheet needed
- **Theming** — all visuals are customizable via CSS custom properties or config
- **i18n** — built-in locale support (en, de, fr, it, es)
- **Accessible** — semantic HTML, keyboard navigation, ARIA attributes

## License

MIT
