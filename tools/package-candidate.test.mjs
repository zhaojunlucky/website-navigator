import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { test } from 'node:test';
import { packageCandidate } from './package-candidate.mjs';

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'navigator-candidate-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const input = join(root, 'build');
  const output = join(root, 'candidate');
  mkdirSync(join(input, 'browser/assets'), { recursive: true });
  writeFileSync(join(input, 'browser/index.html'), '<html>Navigator</html>');
  writeFileSync(join(input, 'browser/assets/app.js'), 'app');
  writeFileSync(join(input, '3rdpartylicenses.txt'), 'licenses');
  return { input, output, runNumber: '42' };
}

test('packages the full build tree and generates a verifiable promotion manifest', t => {
  const options = fixture(t);
  const index = packageCandidate(options);
  const archive = readFileSync(join(options.output, 'website-navigator.zip'));
  const entries = execFileSync('unzip', ['-Z1', join(options.output, 'website-navigator.zip')], { encoding: 'utf8' }).split('\n');
  assert.ok(entries.includes('browser/index.html'));
  assert.ok(entries.includes('browser/assets/app.js'));
  assert.ok(entries.includes('3rdpartylicenses.txt'));
  assert.ok(!entries.some(name => name.startsWith('website-navigator/')));
  assert.equal(index.version, '1.0.42');
  assert.equal(index.artifact_layout, 'versioned-run');
  assert.equal(index.count, index.artifacts.length);
  assert.equal(index.artifacts[0].bytes, archive.length);
  const hash = createHash('sha256').update(archive).digest('hex');
  assert.equal(index.artifacts[0].sha256, hash);
  assert.deepEqual(JSON.parse(readFileSync(join(options.output, 'index.json'), 'utf8')), index);
  assert.equal(readFileSync(join(options.output, 'checksums.sha256'), 'utf8'), `${hash}  website-navigator.zip\n`);
});

test('repackaging drops files removed from the build', t => {
  const options = fixture(t);
  packageCandidate(options);
  rmSync(join(options.input, 'browser/assets/app.js'));
  packageCandidate(options);
  const entries = execFileSync('unzip', ['-Z1', join(options.output, 'website-navigator.zip')], { encoding: 'utf8' });
  assert.ok(!entries.includes('app.js'));
});

test('rejects invalid versions, missing build output, and packaging into the input', t => {
  const options = fixture(t);
  for (const runNumber of ['', '0', '-1', '1.2', '../42']) {
    assert.throws(() => packageCandidate({ ...options, runNumber }), /positive integer/);
  }
  assert.throws(() => packageCandidate({ ...options, output: join(options.input, 'candidate') }), /outside/);
  rmSync(join(options.input, 'browser/index.html'));
  assert.throws(() => packageCandidate(options), /index.html/);
});
