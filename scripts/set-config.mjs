import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { isValidAccount } from '../web/src/engine.mjs';

const [contract, dao] = process.argv.slice(2);
if (!isValidAccount(contract) || !isValidAccount(dao) || contract === dao) {
  console.error('Usage: node scripts/set-config.mjs vault-account.testnet verified-dao.testnet');
  process.exit(2);
}

const path = 'web/.env.local';
mkdirSync(dirname(path), { recursive: true });
writeFileSync(path, [
  'NEXT_PUBLIC_NEAR_RPC=https://rpc.testnet.near.org',
  `NEXT_PUBLIC_COVAUNT_CONTRACT=${contract}`,
  `NEXT_PUBLIC_COVAUNT_DAO=${dao}`,
  'NEXT_PUBLIC_NEAR_EXPLORER=https://explorer.testnet.near.org',
  '',
].join('\n'));
console.log(`Wrote public Next.js configuration to ${path}. No keys or credentials were written.`);
console.log('Verify the on-chain DAO binding and proposal bond before enabling any wallet write flow.');
