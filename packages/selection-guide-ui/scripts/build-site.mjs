import { cp, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const cwd = fileURLToPath(new URL('..', import.meta.url));
const siteDir = path.join(cwd, 'site');
const distDir = path.join(siteDir, 'dist');
const devDir = path.join(siteDir, 'dev');

await rm(siteDir, { force: true, recursive: true });
await mkdir(distDir, { recursive: true });
await mkdir(devDir, { recursive: true });

await cp(path.join(cwd, 'dist', 'size-recommender.iife.js'), path.join(distDir, 'size-recommender.iife.js'));
await cp(path.join(cwd, 'dist', 'size-recommender.esm.js'), path.join(distDir, 'size-recommender.esm.js'));
await cp(path.join(cwd, 'dev', 'index.html'), path.join(siteDir, 'index.html'));
await cp(path.join(cwd, 'dev', 'main.js'), path.join(devDir, 'main.js'));
