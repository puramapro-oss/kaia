import assert from 'node:assert/strict';
import test from 'node:test';
import { publicAuditProjection } from './project-public-audit.mjs';

const publicPackage = { version: '1.2.3', resolved: 'https://registry.npmjs.org/example/-/example-1.2.3.tgz', integrity: 'sha512-YWJj' };
const project = entries => publicAuditProjection({ lockfileVersion: 3, packages: { '': { name: 'private-root', scripts: { postinstall: 'secret' } }, ...entries } });

test('removes private identities, paths, edges, scripts and unrelated metadata', () => {
  const output = project({
    'node_modules/@purama/smarana': { version: '1.0.0', resolved: 'git+ssh://git@github.com/private/secret.git', dependencies: { example: '1.2.3' } },
    'node_modules/local': { resolved: 'file:../private-dir', link: true },
    'node_modules/@purama/smarana/node_modules/example': { ...publicPackage, dependencies: { '@purama/secret': '*' }, scripts: { postinstall: 'private-command' }, description: 'private text', license: 'private license' },
  });
  assert.equal(output.counts.publicPackageVersions, 1);
  assert.equal(output.counts.omittedEntries, 2);
  assert.deepEqual(output.lock.packages['node_modules/dependency-00000'], { name: 'example', version: publicPackage.version, resolved: publicPackage.resolved });
  for (const forbidden of ['@purama', 'private-root', 'private-dir', 'private-command', 'private text', 'github.com', 'git+', 'file:']) assert.ok(!JSON.stringify(output).includes(forbidden));
});

for (const resolved of ['http://registry.npmjs.org/example/-/a.tgz', 'https://registry.npmjs.org.attacker.invalid/a', 'https://user:secret@registry.npmjs.org/example/-/a.tgz', 'https://registry.npmjs.org/example/-/a.tgz?secret=x', 'https://registry.npmjs.org/example/-/a.tgz#secret', 'git+https://github.com/a/b', 'file:../private']) {
  test(`omits noncanonical public authority ${resolved.split('?')[0]}`, () => assert.equal(project({ x: { ...publicPackage, resolved } }).counts.publicPackageVersions, 0));
}
test('deduplicates exact public versions and discards inherited private paths', () => {
  const output = project({ 'node_modules/example': publicPackage, 'node_modules/private-parent/node_modules/example': publicPackage });
  assert.equal(output.counts.publicPackageVersions, 1);
  assert.deepEqual(output.manifest.dependencies, { 'dependency-00000': 'npm:example@1.2.3' });
});
test('omits private namespace even if a registry URL is supplied', () => {
  assert.equal(project({ x: { ...publicPackage, resolved: 'https://registry.npmjs.org/@purama/hidden/-/hidden-1.2.3.tgz' } }).counts.publicPackageVersions, 0);
});
test('omits noncanonical tarball paths and fails closed for invalid versions', () => {
  assert.equal(project({ a: { ...publicPackage, resolved: 'https://registry.npmjs.org/example/-/private-secret.tgz' } }).counts.publicPackageVersions, 0);
  assert.throws(() => project({ a: { ...publicPackage, version: 'github:private/repo' } }), /version/);
});
