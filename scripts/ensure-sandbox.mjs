/**
 * Prepare a protocol-compatible NEAR Sandbox binary for near-workspaces.
 *
 * near-workspaces 5.0.0 still declares the legacy near-sandbox 0.1.x
 * package, whose postinstall binary is NEAR Sandbox 2.6.2. COVAUNT is
 * compiled for the current NEAR protocol through near-sdk 5.30.1, so the
 * test harness must pin the runtime used for receipt-level verification.
 */
import {chmod, mkdir, writeFile} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {dirname, resolve} from 'node:path';
import {spawnSync} from 'node:child_process';

const VERSION = process.env.COVAUNT_SANDBOX_VERSION || '2.14.0';
const root = resolve('contract', 'target', 'sandbox', `near-sandbox-${VERSION}`);
const binary = resolve(root, 'near-sandbox');
const archive = resolve(root, 'near-sandbox.tar.gz');

if (process.platform !== 'linux' || process.arch !== 'x64') {
  throw new Error('NEAR Sandbox receipt tests require Linux x64. Run npm run test:sandbox inside WSL or CI; the contract and web checks remain runnable on Windows.');
}

await mkdir(root, {recursive: true});
if (!existsSync(binary)) {
  const url = `https://s3-us-west-1.amazonaws.com/build.nearprotocol.com/nearcore/Linux-x86_64/${VERSION}/near-sandbox.tar.gz`;
  console.log(`Downloading NEAR Sandbox ${VERSION} from the official build archive`);
  const response = await fetch(url);
  if (!response.ok) throw new Error(`NEAR Sandbox download failed: HTTP ${response.status}`);
  await writeFile(archive, Buffer.from(await response.arrayBuffer()));
  const extracted = spawnSync('tar', ['-xzf', archive, '--strip-components=1', '-C', root], {stdio: 'inherit'});
  if (extracted.status !== 0) throw new Error(`tar failed with exit code ${extracted.status}`);
  await chmod(binary, 0o755);
}

const version = spawnSync(binary, ['--version'], {encoding: 'utf8'});
if (version.status !== 0 || !version.stdout.includes(VERSION)) {
  throw new Error(`Expected NEAR Sandbox ${VERSION}, got: ${version.stdout || version.stderr}`);
}

console.log(`NEAR Sandbox ${VERSION} ready at ${binary}`);
