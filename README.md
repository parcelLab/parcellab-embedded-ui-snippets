# parcelLab Embedded UI Snippets

Open-source reference implementations of embeddable UI widgets that bring parcelLab product features directly into retailer pages. Each snippet is a zero-dependency, self-contained JavaScript bundle — drop a single `<script>` tag onto any page and it works.

Use these widgets as-is, or as starting points for building your own custom integrations against the parcelLab APIs.

## Packages

### [Selection Guide UI](./packages/selection-guide-ui/)

Size recommendation widget for product detail pages. Renders fit guidance — category, bar position, confidence score, and an AI-generated customer feedback summary — powered by the [parcelLab Size Recommender API](https://api.parcellab.com/v4/docs/#tag/Size-Recommender).

```html
<div data-size-recommender data-account-id="YOUR_ACCOUNT_ID" data-product-id="YOUR_PRODUCT_ID"></div>
<script src="https://cdn.parcellab.com/js/selection-guide-ui/v1/size-recommender.iife.js" defer></script>
```

[Source](./packages/selection-guide-ui/) · [Docs](./packages/selection-guide-ui/README.md) · [Live demo](https://cdn.parcellab.com/playground/selection-guide-ui/index.html)

---

### [Promise UI](./packages/promise-ui/)

Delivery promise widget for product and checkout pages. Shows estimated delivery dates, courier options, and order cutoff urgency — powered by the [parcelLab Promise API](https://docs.parcellab.com/docs/developers/promise/api).

```html
<div data-promise data-account-id="YOUR_ACCOUNT_ID" data-country="DEU"></div>
<script src="https://cdn.parcellab.com/js/promise-ui/v1/promise.iife.js" defer></script>
```

[Source](./packages/promise-ui/) · [Docs](./packages/promise-ui/README.md) · [Live demo](https://cdn.parcellab.com/playground/promise-ui/index.html)

## Development

This is an [npm workspace](https://docs.npmjs.com/cli/using-npm/workspaces) monorepo.

```bash
npm install          # Install all dependencies
npm run build        # Build every package
npm test             # Run all tests

# Dev servers
npm run dev:selection-guide   # → localhost:4173
npm run dev:promise           # → localhost:4174
```

### Package layout

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

Every package produces two bundles with no runtime dependencies:

| Format | File | Use case |
|--------|------|----------|
| **IIFE** | `dist/<name>.iife.js` | `<script>` tag embed — auto-initializes from `data-*` attributes |
| **ESM** | `dist/<name>.esm.js` | Bundler import via `import { init } from '...'` |

Type declarations are emitted to `dist/types/`.

## Deployment

Bundles are distributed via S3 + CloudFront. GitHub Actions handle everything:

| Trigger | What happens |
|---------|-------------|
| Push to `main` | Builds changed packages, deploys demo pages to staging CDN |
| GitHub release (tag `<pkg>/<version>`) | Deploys versioned + latest production bundles to CDN |
| `preview` label on a PR | Deploys both demos to `/playground/{pkg}/pr-{number}/` |

## Building Your Own

These widgets are open-source reference implementations. If you need a custom integration:

1. **Use the APIs directly** — call the [Size Recommender API](https://api.parcellab.com/v4/docs/#tag/Size-Recommender) or [Promise API](https://docs.parcellab.com/docs/developers/promise/api) from your own frontend and render the response however you like
2. **Fork and customize** — start from this codebase and modify the rendering, styling, and behavior to match your design system
3. **Use as a library** — import the ESM build and override messages, theme, and CSS to fit your needs

## License

[MIT](./packages/selection-guide-ui/LICENSE)
