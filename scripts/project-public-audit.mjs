import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

/** A flat public package set, never the application's dependency graph. */
export function publicAuditProjection(lock) {
  if (lock?.lockfileVersion !== 3 || !lock.packages || typeof lock.packages !== 'object') throw new Error('Expected a v3 lock.');
  const versions = new Map();
  let omitted = 0;
  for (const [location, item] of Object.entries(lock.packages)) {
    if (!location) continue;
    if (!item || item.link || typeof item.resolved !== 'string' || typeof item.version !== 'string') { omitted++; continue; }
    let url;
    try { url = new URL(item.resolved); } catch { omitted++; continue; }
    if (url.protocol !== 'https:' || url.hostname !== 'registry.npmjs.org' || url.port || url.username || url.password || url.search || url.hash) { omitted++; continue; }
    const name = decodeURIComponent(url.pathname).split('/-/')[0].slice(1);
    if (!/^(?:@[a-z0-9._-]+\/)?[a-z0-9._-]+$/.test(name) || name.startsWith('@purama/')) { omitted++; continue; }
    if (!/^\d+\.\d+\.\d+(?:-[A-Za-z0-9.-]+)?(?:\+[A-Za-z0-9.-]+)?$/.test(item.version)) throw new Error('Invalid public version.');
    const tarball = `${name.split('/').at(-1)}-${item.version}.tgz`;
    const canonical = `https://registry.npmjs.org/${name}/-/${tarball}`;
    if (decodeURIComponent(url.href) !== canonical) { omitted++; continue; }
    // No opaque metadata (even hashes), original graph paths or URL extras survive.
    const value = { name, version: item.version, resolved: canonical };
    const key = `${name}@${item.version}`;
    if (versions.has(key) && JSON.stringify(versions.get(key)) !== JSON.stringify(value)) throw new Error('Conflicting public package identity.');
    versions.set(key, value);
  }
  const manifest = { name: 'public-package-security-check', version: '1.0.0', private: true, dependencies: {} };
  const packages = { '': { name: manifest.name, version: manifest.version, dependencies: manifest.dependencies } };
  const ordered = [...versions.entries()].sort(([a], [b]) => a.localeCompare(b));
  ordered.forEach(([, item], index) => {
    const alias = `dependency-${String(index).padStart(5, '0')}`;
    manifest.dependencies[alias] = `npm:${item.name}@${item.version}`;
    // No original location, dependencies, parent edge, script or extra metadata survives.
    packages[`node_modules/${alias}`] = item;
  });
  const projected = { name: manifest.name, version: manifest.version, lockfileVersion: 3, requires: true, packages };
  const serialized = JSON.stringify({ manifest, lock: projected });
  if (/@purama|git\+|github\.com|file:|ssh:|kaia|smarana/i.test(serialized)) throw new Error('Non-public application identity in projection.');
  return { manifest, lock: projected, counts: { publicPackageVersions: ordered.length, omittedEntries: omitted }, scope: 'Flat registry.npmjs.org package/version set only; no private packages or application dependency edges; not a full application audit.' };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const destination = process.argv[2];
  if (!destination) throw new Error('Provide a new destination directory.');
  const source = process.argv[3] ?? new URL('../package-lock.json', import.meta.url);
  const projection = publicAuditProjection(JSON.parse(readFileSync(source, 'utf8')));
  mkdirSync(destination, { mode: 0o700 });
  for (const [file, data] of [['package.json', projection.manifest], ['package-lock.json', projection.lock]]) {
    writeFileSync(resolve(destination, file), `${JSON.stringify(data, null, 2)}\n`, { flag: 'wx', mode: 0o600 });
  }
  process.stdout.write(`${JSON.stringify({ ...projection.counts, scope: projection.scope })}\n`);
}
