import { createServer } from 'node:http';
import { mkdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { context } from 'esbuild';

const cwd = fileURLToPath(new URL('..', import.meta.url));
const distDir = path.join(cwd, 'dist');
const devDir = path.join(cwd, 'dev');

const portArgIndex = process.argv.findIndex((value) => value === '--port');
const port =
  Number(
    portArgIndex >= 0 ? process.argv[portArgIndex + 1] : process.env.PORT,
  ) || 4173;

const shared = {
  bundle: true,
  entryPoints: ['src/index.ts'],
  legalComments: 'none',
  logLevel: 'info',
  sourcemap: true,
  target: ['es2018'],
  define: {
    __VERSION__: JSON.stringify('dev'),
  },
};

const buildContexts = await Promise.all([
  context({
    ...shared,
    format: 'esm',
    outfile: 'dist/size-recommender.esm.js',
    define: {
      ...shared.define,
      __AUTO_INIT__: 'false',
    },
  }),
  context({
    ...shared,
    format: 'iife',
    globalName: 'SizeRecommender',
    outfile: 'dist/size-recommender.iife.js',
    define: {
      ...shared.define,
      __AUTO_INIT__: 'true',
    },
  }),
]);

await mkdir(distDir, { recursive: true });
await Promise.all(buildContexts.map((buildContext) => buildContext.rebuild()));
await Promise.all(buildContexts.map((buildContext) => buildContext.watch()));

const MIME_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
};

function contentType(filePath) {
  return MIME_TYPES[path.extname(filePath)] ?? 'text/plain; charset=utf-8';
}

function resolvePath(urlPath) {
  if (urlPath === '/' || urlPath === '/index.html') {
    return path.join(devDir, 'index.html');
  }

  if (urlPath.startsWith('/dist/')) {
    return path.join(cwd, urlPath.slice(1));
  }

  if (urlPath.startsWith('/dev/')) {
    return path.join(cwd, urlPath.slice(1));
  }

  return null;
}

async function fileExists(filePath) {
  try {
    const fileStats = await stat(filePath);
    return fileStats.isFile();
  } catch {
    return false;
  }
}

const server = createServer(async (request, response) => {
  const requestUrl = new URL(request.url ?? '/', `http://${request.headers.host}`);
  const filePath = resolvePath(requestUrl.pathname);

  if (!filePath || !(await fileExists(filePath))) {
    response.writeHead(404, {
      'Content-Type': 'text/plain; charset=utf-8',
    });
    response.end('Not found');
    return;
  }

  const file = await readFile(filePath);

  response.writeHead(200, {
    'Cache-Control': 'no-store',
    'Content-Type': contentType(filePath),
  });
  response.end(file);
});

server.listen(port, () => {
  console.log(`Dev server running at http://localhost:${port}`);
  console.log('Serving demo page from /dev/index.html');
});

async function shutdown(signal) {
  console.log(`\nReceived ${signal}, shutting down...`);
  server.close();
  await Promise.all(buildContexts.map((buildContext) => buildContext.dispose()));
  process.exit(0);
}

process.on('SIGINT', () => {
  void shutdown('SIGINT');
});

process.on('SIGTERM', () => {
  void shutdown('SIGTERM');
});
