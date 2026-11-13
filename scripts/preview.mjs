/** Starts the real Next.js app in its explicit, read-only preview mode. */
import { spawn } from 'node:child_process';

const port = Number(process.env.COVAUNT_PREVIEW_PORT || 4174);
if (!Number.isSafeInteger(port) || port < 1024 || port > 65535) throw new Error('Set COVAUNT_PREVIEW_PORT between 1024 and 65535');

const command = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const child = spawn(command, ['--prefix', 'web', 'run', 'dev', '--', '--hostname', '127.0.0.1', '--port', String(port)], { stdio: 'inherit' });
console.log(`COVAUNT preview: http://127.0.0.1:${port}/?mode=preview`);
console.log('Preview mode is deterministic, visibly labeled and read-only. No wallet or transaction is simulated.');
child.on('exit', (code, signal) => process.exit(code ?? (signal ? 1 : 0)));
process.on('SIGINT', () => child.kill('SIGINT'));
process.on('SIGTERM', () => child.kill('SIGTERM'));
