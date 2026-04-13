# parcelLab Embedded UI Snippets

Lightweight, zero-dependency UI widgets that bring parcelLab product features directly into retailer pages. Drop a single `<script>` tag onto any page — no build step required.

## Packages

### [`selection-guide-ui`](./packages/selection-guide-ui/)

Size recommendation widget for product detail pages. Displays fit guidance, confidence scores, and customer feedback summaries powered by the parcelLab Size Recommender API.

| | |
|---|---|
| **Source** | [`packages/selection-guide-ui/`](./packages/selection-guide-ui/) |
| **Demo** | [Staging playground](https://cdn.parcellab.com/playground/selection-guide-ui/) |
| **CDN (latest)** | `https://cdn.parcellab.com/js/selection-guide-ui/v1/size-recommender.iife.js` |
| **npm** | `@parcellab/selection-guide-ui` |

```html
<div data-size-recommender data-account-id="123" data-product-id="SKU-001"></div>
<script src="https://cdn.parcellab.com/js/selection-guide-ui/v1/size-recommender.iife.js" defer></script>
```

---

### [`promise-ui`](./packages/promise-ui/)

Delivery promise widget for product and checkout pages. Shows estimated delivery dates, courier options, and order cutoff urgency powered by the parcelLab Promise API (v4).

| | |
|---|---|
| **Source** | [`packages/promise-ui/`](./packages/promise-ui/) |
| **Demo** | [Staging playground](https://cdn.parcellab.com/playground/promise-ui/) |
| **CDN (latest)** | `https://cdn.parcellab.com/js/promise-ui/v1/promise.iife.js` |
| **npm** | `@parcellab/promise-ui` |

```html
<div data-promise data-account-id="123" data-country="DEU"></div>
<script src="https://cdn.parcellab.com/js/promise-ui/v1/promise.iife.js" defer></script>
```

## Development

This is an [npm workspace](https://docs.npmjs.com/cli/using-npm/workspaces) monorepo.

```bash
# Install all dependencies
npm install

# Build every package
npm run build

# Run all tests
npm test

# Dev server (pick one)
npm run dev:selection-guide   # → localhost:4173
npm run dev:promise           # → localhost:4174
```

### Package layout

Each package follows the same structure:

```
packages/<name>/
  src/           TypeScript source
  src/locales/   i18n strings (en, de, fr, it, es)
  dev/           Demo / playground page
  test/          Vitest tests (jsdom)
  scripts/       esbuild build + dev server
  dist/          Built output (git-ignored)
```

### Build output

Every package produces two bundles — no runtime dependencies:

| Format | File | Use case |
|--------|------|----------|
| **IIFE** | `dist/<name>.iife.js` | Script-tag embed. Auto-initialises from `data-*` attributes. |
| **ESM** | `dist/<name>.esm.js` | Bundler import (`import { init } from '...'`). |

Type declarations are emitted to `dist/types/`.

## CI / CD

| Workflow | Trigger | What it does |
|----------|---------|-------------|
| **Selection Guide → staging** | Push to `main` (path filter) | Builds & uploads demo to `s3://…/playground/selection-guide-ui` |
| **Selection Guide → prod** | Release `selection-guide-ui/*` | Uploads versioned + latest bundles to CDN |
| **Promise → staging** | Push to `main` (path filter) | Builds & uploads demo to `s3://…/playground/promise-ui` |
| **Promise → prod** | Release `promise-ui/*` | Uploads versioned + latest bundles to CDN |
| **Demo pages → staging** | Push to `main` | Builds both demos, uploads index to `s3://…/playground/embedded-ui-snippets` |
| **PR preview** | Add `preview` label | Deploys to `…/playground/{pkg}/pr-{number}/`, posts URLs on the PR |
| **PR preview cleanup** | Close PR / remove label | Removes preview files from S3 |

## Architecture

- **Zero dependencies** — each widget ships as a single self-contained JS file
- **CSS-in-JS** — styles injected at runtime via `<style>` tag, no external stylesheet
- **Theming** — all visuals customisable through CSS custom properties or config object
- **i18n** — built-in locale support (en, de, fr, it, es)
- **Accessible** — semantic HTML, keyboard navigation, ARIA attributes

## License

[MIT](./packages/selection-guide-ui/LICENSE)
