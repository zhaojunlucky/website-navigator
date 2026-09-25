import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, relative, resolve, sep } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

export function packageCandidate({
  input = resolve(root, 'dist/website-navigator'),
  output = resolve(root, 'dist/candidate'),
  runNumber = process.env.GITHUB_RUN_NUMBER,
} = {}) {
  if (!/^[1-9]\d*$/.test(String(runNumber))) {
    throw new Error('GITHUB_RUN_NUMBER must be a positive integer (set it explicitly for local packaging).');
  }
  input = resolve(input);
  output = resolve(output);
  const outputRelative = relative(input, output);
  if (!outputRelative || (!outputRelative.startsWith(`..${sep}`) && outputRelative !== '..')) {
    throw new Error('Candidate output must be outside the build directory.');
  }
  if (!statSync(resolve(input, 'browser/index.html')).isFile()) {
    throw new Error('Build output must contain browser/index.html. Run the production build first.');
  }

  const version = `1.0.${runNumber}`;
  const file = 'website-navigator.zip';
  mkdirSync(output, { recursive: true });
  // Repack from scratch so removed build files cannot survive in an old ZIP.
  for (const name of [file, 'index.json', 'checksums.sha256']) {
    rmSync(resolve(output, name), { force: true });
  }
  const archive = resolve(output, file);
  const zip = spawnSync('zip', ['-qr', archive, '.'], { cwd: input, encoding: 'utf8' });
  if (zip.error) throw zip.error;
  if (zip.status !== 0) throw new Error(`Packaging failed: ${zip.stderr.trim()}`);

  const bytes = readFileSync(archive);
  const sha256 = createHash('sha256').update(bytes).digest('hex');
  const index = {
    version,
    artifact_layout: 'versioned-run',
    generated_at: new Date().toISOString(),
    count: 1,
    artifacts: [{ name: 'website-navigator', version, file, bytes: bytes.length, sha256 }],
  };
  writeFileSync(resolve(output, 'checksums.sha256'), `${sha256}  ${file}\n`);
  writeFileSync(resolve(output, 'index.json'), `${JSON.stringify(index, null, 2)}\n`);
  return index;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    console.log(JSON.stringify(packageCandidate(), null, 2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
