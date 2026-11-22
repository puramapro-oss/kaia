import { copyFileSync, mkdirSync, readFileSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const require = createRequire(resolve(root, 'package.json'));
const manifestPath = require.resolve('maplibre-gl/package.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
if (manifest.version !== '6.19.0') throw new Error('Unexpected MapLibre version: review the worker path with its dependency update.');
const source = resolve(dirname(manifestPath), 'dist/maplibre-gl-worker.mjs');
const information = statSync(source);
if (!information.isFile() || information.size === 0 || information.size > 8 * 1024 * 1024) throw new Error('Invalid MapLibre worker file.');
const destination = resolve(root, 'public/vendor/maplibre-gl-6.19.0');
mkdirSync(destination, { recursive: true });
copyFileSync(source, resolve(destination, 'worker.mjs'));
process.stdout.write(`Prepared MapLibre ${manifest.version} worker (${information.size} bytes).\n`);
