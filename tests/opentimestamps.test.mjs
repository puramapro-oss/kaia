import assert from 'node:assert/strict'
import { createHash, webcrypto } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire, stripTypeScriptTypes } from 'node:module'
import vm from 'node:vm'
import test from 'node:test'

const dependencyRoot = process.env.KAIA_TEST_DEPENDENCY_ROOT ?? fileURLToPath(new URL('../', import.meta.url))
assert.ok(dependencyRoot, 'Set KAIA_TEST_DEPENDENCY_ROOT to the locked isolated dependencies')
const require = createRequire(resolve(dependencyRoot, 'package.json'))
const upstreamRequire = createRequire(require.resolve('opentimestamps/package.json'))
const primitives = Object.fromEntries(Object.entries({ DetachedTimestampFile: 'detached-timestamp-file', Ops: 'ops', Context: 'context', Timestamp: 'timestamp', Notary: 'notary' }).map(([key, name]) => [key, require(`opentimestamps/src/${name}.js`)]))
const libRoot = fileURLToPath(new URL('../src/lib/', import.meta.url))
const calendar = 'https://alice.btc.calendar.opentimestamps.org'
const digest = data => createHash('sha256').update(data).digest()
const decode = proof => primitives.DetachedTimestampFile.deserialize([...Buffer.from(proof, 'base64')])
function serializeTimestamp(timestamp) { const writer = new primitives.Context.StreamSerialization(); timestamp.serialize(writer); return new Uint8Array(writer.getOutput()) }
function pendingResponse(init) {
  const timestamp = new primitives.Timestamp(Array.from(init.body))
  timestamp.attestations.push(new primitives.Notary.PendingAttestation(calendar))
  return new Response(serializeTimestamp(timestamp))
}
function proofFor(data, attestation = new primitives.Notary.PendingAttestation(calendar)) {
  const proof = primitives.DetachedTimestampFile.fromHash(new primitives.Ops.OpSHA256(), [...digest(data)])
  if (attestation) proof.timestamp.attestations.push(attestation)
  return Buffer.from(proof.serializeToBytes()).toString('base64')
}
async function library({ fetch: providerFetch, globals = {} } = {}) {
  const calls = []
  const context = vm.createContext({
    TextEncoder, TextDecoder, Uint8Array, ArrayBuffer, Array, atob, btoa, URL, Response, Buffer,
    AbortController, setTimeout, clearTimeout, crypto: webcrypto, performance,
    fetch: async (input, init = {}) => {
      const url = new URL(String(input)); calls.push({ url, init })
      assert.equal(init.redirect, 'error'); assert.equal(init.credentials, 'omit')
      if (providerFetch) return providerFetch(url, init)
      if (url.pathname === '/digest') return pendingResponse(init)
      if (url.pathname.startsWith('/timestamp/')) return new Response(null, { status: 404 })
      throw new Error('Unplanned HTTP is forbidden in this fixture')
    }, ...globals,
  })
  const cache = new Map()
  function load(file) {
    if (!cache.has(file)) cache.set(file, new vm.SourceTextModule(stripTypeScriptTypes(readFileSync(file, 'utf8'), { mode: 'transform' }), { context, identifier: file }))
    return cache.get(file)
  }
  const entry = load(resolve(libRoot, 'opentimestamps.ts'))
  await entry.link((specifier, parent) => {
    if (specifier === 'node:crypto') return new vm.SyntheticModule(['createHash'], function () { this.setExport('createHash', createHash) }, { context })
    if (specifier.startsWith('opentimestamps/src/')) return new vm.SyntheticModule(['default'], function () { this.setExport('default', require(specifier)) }, { context })
    assert.ok(specifier.startsWith('.')); return load(resolve(dirname(parent.identifier), specifier))
  })
  await entry.evaluate()
  return { ots: entry.namespace, core: cache.get(resolve(libRoot, 'ots-core.ts')).namespace, calls }
}

const fixtures = JSON.parse(readFileSync(new URL('./opentimestamps-official-fixtures.json', import.meta.url), 'utf8'))
for (const fixture of fixtures.fixtures) test(`official receipt ${fixture.name} remains byte-for-byte compatible`, () => {
  const bytes = Buffer.from(fixture.proof_base64, 'base64')
  assert.equal(digest(bytes).toString('hex'), fixture.proof_sha256)
  const proof = decode(fixture.proof_base64)
  assert.equal(Buffer.from(proof.fileDigest()).toString('hex'), fixture.content_sha256)
  assert.deepEqual(Buffer.from(proof.serializeToBytes()), bytes)
})

test('stampData binds UTF-8 data and preserves the public result shape', async () => {
  const { ots, calls } = await library()
  for (const content of ['Contrat — café ☀', 'abcdef0123456789'.repeat(4)]) {
    const stamp = await ots.stampData(content)
    assert.equal(stamp.method, 'opentimestamps')
    assert.equal(stamp.sha256, digest(content).toString('hex'))
    assert.equal(typeof stamp.timestamp, 'number')
    assert.equal(Buffer.from(decode(stamp.ots).fileDigest()).toString('hex'), stamp.sha256)
    assert.ok(decode(stamp.ots).timestamp.allAttestations().size >= 1)
  }
  assert.equal(calls.length, 8)
})
test('the contest signature is stamped as a digest without hashing twice', async () => {
  const { ots } = await library()
  const signature = digest('contest result').toString('hex')
  const proof = await ots.stampHashHex(signature.toUpperCase())
  assert.equal(Buffer.from(decode(proof).fileDigest()).toString('hex'), signature)
})
for (const value of ['', 'z'.repeat(64), 'a'.repeat(63), 'a'.repeat(65), null]) test(`invalid digest ${String(value).slice(0, 8)} makes no network request`, async () => {
  const { ots, calls } = await library()
  assert.equal(await ots.stampHashHex(value), null)
  assert.equal(calls.length, 0)
})
for (const variant of ['all fail', 'one accepts', 'bare trees']) test(`calendar failure ${variant} returns only the honest hash fallback`, async () => {
  let count = 0
  const { ots, calls } = await library({ fetch: async (_url, init) => {
    count++
    if (variant === 'one accepts' && count === 1) return pendingResponse(init)
    if (variant === 'bare trees') return new Response(serializeTimestamp(new primitives.Timestamp(Array.from(init.body))))
    throw new Error('synthetic outage')
  } })
  const stamp = await ots.stampData('content')
  assert.equal(stamp.method, 'sha256_fallback')
  assert.equal(stamp.ots, undefined)
  assert.equal(stamp.sha256, digest('content').toString('hex'))
  assert.equal(calls.length, 4)
})
test('hash fallback checks content without claiming an external timestamp', async () => {
  const { ots, calls } = await library()
  const stamp = { method: 'sha256_fallback', sha256: digest('content').toString('hex'), timestamp: 0 }
  assert.equal((await ots.verifyStamp('content', stamp)).valid, true)
  assert.equal((await ots.verifyStamp('changed', stamp)).valid, false)
  assert.equal(calls.length, 0)
})
for (const [name, proof] of [
  ['missing', undefined], ['empty', ''], ['invalid base64', 'not base64!'],
  ['oversize', Buffer.alloc(64001).toString('base64')], ['wrong bytes', 'bm90IGFuIG90cyBwcm9vZg=='],
  ['other document', proofFor('other content')], ['bare receipt', proofFor('content', null)],
]) test(`verification rejects ${name} before any HTTP`, async () => {
  const { ots, calls } = await library()
  const result = await ots.verifyStamp('content', { method: 'opentimestamps', sha256: digest('content').toString('hex'), timestamp: 0, ots: proof })
  assert.equal(result.valid, false)
  assert.ok(result.error)
  assert.equal(calls.length, 0)
})
test('a pending receipt is never reported as a verified Bitcoin proof', async () => {
  const { ots } = await library()
  const result = await ots.verifyStamp('content', { method: 'opentimestamps', sha256: digest('content').toString('hex'), timestamp: 0, ots: proofFor('content') })
  assert.equal(result.valid, false)
  assert.equal(result.error, 'OTS_PENDING')
})
for (const uri of ['http://127.0.0.1', 'https://127.0.0.1', 'https://alice.btc.calendar.opentimestamps.org.attacker.invalid', 'https://alice.btc.calendar.opentimestamps.org:8443', 'https://user:password@alice.btc.calendar.opentimestamps.org']) {
  test(`untrusted calendar ${new URL(uri).hostname} is never fetched`, async () => {
    const { ots, calls } = await library()
    const proof = proofFor('content', new primitives.Notary.PendingAttestation(uri))
    const result = await ots.verifyStamp('content', { method: 'opentimestamps', sha256: digest('content').toString('hex'), timestamp: 0, ots: proof })
    assert.equal(result.valid, false)
    assert.equal(calls.length, 0)
  })
}
test('a Bitcoin attestation must match the explicitly fetched block data', async () => {
  const hash = 'a'.repeat(64), height = 123, timestamp = 1700000000
  const { ots, calls } = await library({ fetch: async url => {
    if (url.pathname === `/api/block-height/${height}`) return new Response(hash)
    if (url.pathname === `/api/block/${hash}`) return Response.json({ id: hash, height, timestamp, merkle_root: Buffer.from(digest('content')).reverse().toString('hex') })
    throw new Error('unexpected HTTP')
  } })
  const proof = proofFor('content', new primitives.Notary.BitcoinBlockHeaderAttestation(height))
  const result = await ots.verifyStamp('content', { method: 'opentimestamps', sha256: digest('content').toString('hex'), timestamp: 0, ots: proof })
  assert.equal(result.valid, true)
  assert.equal(calls.length, 2)
  assert.ok(calls.every(call => call.url.origin === 'https://blockstream.info'))
})
test('a mismatched block never verifies an otherwise well-formed receipt', async () => {
  const hash = 'a'.repeat(64)
  const { ots } = await library({ fetch: async url => url.pathname.includes('/block-height/') ? new Response(hash) : Response.json({ id: hash, height: 123, timestamp: 1700000000, merkle_root: 'b'.repeat(64) }) })
  const proof = proofFor('content', new primitives.Notary.BitcoinBlockHeaderAttestation(123))
  const result = await ots.verifyStamp('content', { method: 'opentimestamps', sha256: digest('content').toString('hex'), timestamp: 0, ots: proof })
  assert.equal(result.valid, false)
  assert.equal(result.error, 'OTS_INVALID_ATTESTATION')
})
for (const mode of ['oversize', 'redirect', 'wrong length', 'malformed']) test(`calendar ${mode} is refused and falls back`, async () => {
  const { ots } = await library({ fetch: async (_url, init) => {
    if (mode === 'oversize') return new Response(new Uint8Array(10001))
    if (mode === 'redirect') { const response = pendingResponse(init); Object.defineProperty(response, 'redirected', { value: true }); return response }
    if (mode === 'wrong length') return new Response(new Uint8Array(2), { headers: { 'content-length': '3' } })
    return new Response(new Uint8Array([255, 1, 2]))
  } })
  assert.equal((await ots.stampData('content')).method, 'sha256_fallback')
})
for (const stalled of ['headers', 'body']) test(`a noncooperative ${stalled} promise is bounded by the deadline`, async () => {
  const { ots } = await library({
    globals: { setTimeout: fn => setTimeout(fn, 5) },
    fetch: async () => stalled === 'headers' ? new Promise(() => {}) : new Response(new ReadableStream({ pull() { return new Promise(() => {}) } })),
  })
  const result = await ots.stampData('content')
  assert.equal(result.method, 'sha256_fallback')
})
test('the deprecated request transport is not loaded', async () => {
  await library()
  for (const dependency of ['request', 'request-promise', 'opentimestamps']) assert.equal(require.cache[upstreamRequire.resolve(dependency)], undefined)
})
