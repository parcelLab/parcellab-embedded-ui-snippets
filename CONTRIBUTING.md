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
