import { mkdir, readFile } from 'node:fs/promises';
import { build } from 'esbuild';

const packageJson = JSON.parse(
  await readFile(new URL('../package.json', import.meta.url), 'utf8'),
);

await mkdir(new URL('../dist', import.meta.url), { recursive: true });

const shared = {
  bundle: true,
  entryPoints: ['src/index.ts'],
  legalComments: 'none',
  minifyWhitespace: true,
  sourcemap: true,
  target: ['es2018'],
  define: {
    __VERSION__: JSON.stringify(packageJson.version),
  },
};

await build({
  ...shared,
  format: 'esm',
  outfile: 'dist/size-recommender.esm.js',
  define: {
    ...shared.define,
    __AUTO_INIT__: 'false',
  },
});

await build({
  ...shared,
  format: 'iife',
  globalName: 'SizeRecommender',
  minify: true,
  outfile: 'dist/size-recommender.iife.js',
  define: {
    ...shared.define,
    __AUTO_INIT__: 'true',
  },
});
