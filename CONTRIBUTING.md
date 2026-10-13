# Contributing

## Getting started

```bash
git clone git@github.com:parcelLab/parcellab-embedded-ui-snippets.git
cd parcellab-embedded-ui-snippets
npm install
```

## Development workflow

1. Create a branch from `main`
2. Make changes in the relevant `packages/<name>/` directory
3. Run the dev server to preview: `npm run dev:selection-guide` or `npm run dev:promise`
4. Run tests: `npm test`
5. Open a pull request — add the `preview` label for a CDN preview deployment

### Promise UI

Run these commands from the repository root. Keep the dev server running in one terminal and run the checks in another:

```bash
npm run dev:promise
npm test --workspace=packages/promise-ui
npx tsc -p packages/promise-ui/tsconfig.json --noEmit
npm run build --workspace=packages/promise-ui
npm run build:site --workspace=packages/promise-ui
```

Open `http://localhost:4174/` for the demo. Use the HTTP server instead of opening `dev/index.html` with `file://`.

Both demos serve their CSS locally. They do not load a CSS framework from an external CDN. If you change utility classes, regenerate the package's `dev/styles.css` with Tailwind CSS 3.4.19, using `dev/tailwind.config.cjs` and `dev/styles.input.css`. Retain the license header. The site build copies this stylesheet with the demo.

Keep default API calls on the parcelLab API. Do not add external lookup services or CDN scripts. The existing `apiBaseUrl` option remains an integration override; it has no domain allowlist.

Check ZIP + country, country-only, and IP + fallback country requests with the [data presets and sample requests](./packages/promise-ui/README.md#sample-requests). `destinationCountry` is the only country setting and supplies the fallback for every IP request. IP Fetch supports IPv4 and IPv6 and is off unless enabled. The widget and demo send `destination=self` to `/v2/prediction` when no IP is specified. [Backend #52571](https://github.com/parcelLab/Backend/pull/52571) must be deployed for automatic resolution. Verify that each automatic request uses this destination and sends the configured country as `fallbackCountry`. No separate IP discovery request is used.

Check the returned ZIP and country, manual corrections, and a response without a ZIP. Use the presentation presets to check visible and hidden location controls, including the ZIP-required prompt.

Change the ZIP or country in the preview, then reload to check that the shopper's choice is reused. Manual choices expire 30 days after the last change; visits do not extend expiry, and automatic locations are not saved. Selecting a data preset or changing a data field clears saved choices for a fresh demo request. The widget tests cover expiry, older saved values, and the priority of a ZIP supplied by the page.

Enter a specified IP to test a known IPv4 or IPv6 destination instead of caller-IP resolution. Copy the demo URL and reload it to check that all controls, presets, and panel settings are restored.

Preview corrections are stored locally; they do not change the Data controls, shared URL, or generated embed. The API panel makes its own request from those controls. Enter a corrected ZIP and country in Data when comparing the panel with the preview.

Before changing behavior, check the [date and confidence rules](./packages/promise-ui/README.md#date-and-confidence-wording), [loading and error states](./packages/promise-ui/README.md#loading-missing-data-and-errors), and [request cache](./packages/promise-ui/README.md#request-caching). `refresh()` can reuse a cached response; the widget has no automatic polling or live cutoff timer. Keep these docs aligned with configuration, model, renderer, widget, and demo changes.

## Adding a new package

1. Create `packages/<name>/` following the structure of existing packages
2. Add build scripts (`scripts/build.mjs`, `scripts/dev.mjs`, `scripts/build-site.mjs`)
3. Add GitHub Actions workflows in `.github/workflows/`
4. Register the dev server in the root `package.json` scripts
5. Add the package to the root `README.md`

## Conventions

- **Zero runtime dependencies** — widgets must be fully self-contained
- **CSS-in-JS** — styles are injected via `<style>` tag at runtime
- **TypeScript strict mode** — all source in `src/` is TypeScript with `strict: true`
- **Two bundle formats** — ESM (for bundlers) and IIFE (for script tags)
- **i18n** — locale files in `src/locales/`, minimum en/de/fr/it/es
- **Tests** — Vitest with jsdom environment in `test/`

## Releases

Production deploys are triggered by GitHub releases:

- Tag format: `<package-name>/<version>` (e.g. `selection-guide-ui/v0.1.7`, `promise-ui/v0.1.1`)
- The workflow uploads versioned and latest bundles to the CDN
