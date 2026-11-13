import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';

const cwd = process.cwd();
const needed = [
  'contract/src/lib.rs', 'contract/Cargo.toml', 'contract/artifacts/covaunt.wasm',
  'web/app/layout.tsx', 'web/app/page.tsx', 'web/app/treasury/page.tsx', 'web/app/covenants/page.tsx',
  'web/app/mandates/page.tsx', 'web/app/journal/page.tsx', 'web/app/governance/page.tsx', 'web/app/about/page.tsx',
  'web/components/DataProvider.tsx', 'web/components/WalletProvider.tsx', 'web/components/ContributionForm.tsx',
  'web/components/MandateWorkbench.tsx', 'web/components/Docket.tsx', 'web/lib/near.ts', 'web/lib/config.ts',
  'web/tests/preview.spec.mjs', 'web/tests/live.spec.mjs', 'docs/THREAT_MODEL.md', 'docs/DEPLOYMENT.md',
  'docs/ACCEPTANCE.md', 'tests/engine.test.mjs', 'tests/sandbox.test.mjs', 'docs/live-evidence/evidence.json',
];
for (const file of needed) assert.ok(existsSync(resolve(cwd, file)), `Missing ${file}`);

const rust = readFileSync(resolve(cwd, 'contract/src/lib.rs'), 'utf8');
for (const snippet of ['ERR_DAO_ONLY', 'ERR_REPLAY', 'ERR_NOT_ENOUGH_ELIGIBLE_CAPITAL', 'request_refund', 'on_spend_complete', 'on_refund_complete', 'compute_allocation', 'pending_spend', 'pending_refund']) {
  assert.ok(rust.includes(snippet), `Missing contract guard ${snippet}`);
}

const sourceFiles = [
  'web/lib/near.ts', 'web/lib/wallet.ts', 'web/components/ContributionForm.tsx',
  'web/components/MandateWorkbench.tsx', 'web/components/Docket.tsx', 'web/components/DataProvider.tsx',
].map((file) => readFileSync(resolve(cwd, file), 'utf8')).join('\n');
for (const snippet of ['signCall', 'get_policy', 'get_proposals', 'Vote', 'ContributionForm', 'previewQuote', 'mode === \'preview\'']) {
  assert.ok(sourceFiles.includes(snippet), `Missing UI workflow ${snippet}`);
}

const config = readFileSync(resolve(cwd, 'web/lib/config.ts'), 'utf8');
assert.ok(config.includes('vault.covauntops26.testnet') && config.includes('covaunt26.sputnikv2.testnet'), 'Source config must identify the verified vault and DAO');
assert.ok(config.includes("network: 'testnet'"), 'Frontend network must remain testnet');
console.log(`Preflight PASS: ${needed.length} required files, contract guards, live config and Next workflow paths present.`);
console.log('NOTICE: This is static validation only, not Rust compile, browser testing, sandbox or live deployment.');
