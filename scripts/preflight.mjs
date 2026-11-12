import {readFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
const cwd=process.cwd();
const needed=[
 'contract/src/lib.rs','contract/Cargo.toml','web/index.html','web/src/app.js',
 'web/src/style.css','web/src/wallet.js','web/src/engine.mjs','web/src/rpc.js',
 'docs/THREAT_MODEL.md','docs/DEPLOYMENT.md','docs/ACCEPTANCE.md',
 'tests/engine.test.mjs','tests/sandbox.test.mjs'
];
for(const file of needed)assert.ok(existsSync(resolve(cwd,file)),`Missing ${file}`);
const rust=readFileSync(resolve(cwd,'contract/src/lib.rs'),'utf8');
for(const snippet of ['ERR_DAO_ONLY','ERR_REPLAY','ERR_NOT_ENOUGH_ELIGIBLE_CAPITAL','request_refund','on_spend_complete','on_refund_complete','compute_allocation','pending_spend','pending_refund']){
 assert.ok(rust.includes(snippet),`Missing contract guard ${snippet}`);
}
const app=readFileSync(resolve(cwd,'web/src/app.js'),'utf8');
for(const snippet of ['signCall','get_policy','get_proposals','VoteApprove','renderSpends','previewQuote','submitContribution']){
 assert.ok(app.includes(snippet)|| (snippet==='VoteApprove'&&app.includes("'Vote'+choice")),`Missing UI workflow ${snippet}`);
}
const config=readFileSync(resolve(cwd,'web/src/config.js'),'utf8');
assert.ok(/contractId: ['\"][^'\"]*['\"]/.test(config)&&/daoId: ['\"][^'\"]*['\"]/.test(config),'Source config must include explicit contract and DAO IDs (blank before deployment is valid)');
console.log(`Preflight PASS: ${needed.length} required files, contract hooks, and UI paths present.`);
console.log('NOTICE: This is static validation only, not Rust compile, browser testing, sandbox or live deployment.');
