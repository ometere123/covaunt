/**
 * Exercises the separately compiled Work & Trust contract on NEAR Sandbox.
 * This contract is not connected to the deployed donor vault and this test
 * does not authorize or perform a testnet deployment.
 */
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {dirname, resolve} from 'node:path';
import {YOCTO} from '../web/src/engine.mjs';

const wasm = resolve('work-contract/target/near/covaunt_work.wasm');
const sandboxBinary = resolve('contract/target/sandbox/near-sandbox-2.14.0/near-sandbox');
const N = n => BigInt(n) * YOCTO;
const TENTH = YOCTO / 10n;
const WORK_GAS = '200000000000000';

process.env.NEAR_SANDBOX_BIN_PATH = sandboxBinary;
process.env.NEAR_SANDBOX_BINARY_PATH = dirname(sandboxBinary);

test('sandbox work contract settles a verified small reward and blocks direct large execution', {timeout: 240_000}, async t => {
  assert.ok(existsSync(wasm), 'Compiled work-contract/target/near/covaunt_work.wasm not present; run cargo near build in work-contract first');
  assert.ok(existsSync(sandboxBinary), 'Protocol-compatible NEAR Sandbox binary not present; run npm run test:sandbox first');
  const {Worker} = await import('near-workspaces');
  const worker = await Worker.init();
  t.after(async () => worker.tearDown());

  const root = worker.rootAccount;
  const dao = await root.createSubAccount('work-dao');
  const creator = await root.createSubAccount('work-creator');
  const verifier = await root.createSubAccount('work-verifier');
  const workerAccount = await root.createSubAccount('work-worker');
  const approver = await root.createSubAccount('work-approver');
  const attacker = await root.createSubAccount('work-attacker');
  const contract = await root.devDeploy(wasm);

  await contract.call(contract, 'new', {dao_id: dao.accountId, name: 'COVAUNT Work'}, {attachedDeposit: N(1).toString()});
  await creator.call(contract, 'create_task', {
    title: 'Verify a neighborhood need',
    purpose: 'Publish a source-linked community brief',
    deadline_ns: '3000000000000000000',
    eligibility: [workerAccount.accountId],
    verifier: verifier.accountId,
    approver: null,
    tier: 'Small',
    reward_amount: TENTH.toString(),
  }, {attachedDeposit: N(1).toString()});

  await workerAccount.call(contract, 'claim_task', {task_id: 0});
  await workerAccount.call(contract, 'submit_completion', {
    task_id: 0,
    evidence_uri: 'https://example.invalid/evidence/0',
    evidence_hash: 'sha256:fixture-chain-receipt',
  });
  await verifier.call(contract, 'verify_submission', {task_id: 0, approved: true, note: 'Verified against the submitted reference'}, {gas: WORK_GAS});

  const settled = await contract.view('get_task', {id: 0});
  const contributor = await contract.view('get_contributor', {account: workerAccount.accountId});
  assert.equal(settled.status, 'Settled');
  assert.equal(settled.paid, TENTH.toString());
  assert.equal(settled.pending_reward, '0');
  assert.equal(contributor.settled_tasks, 1);
  assert.equal(contributor.reputation_points, 10);
  assert.equal((await contract.view('get_summary', {})).is_balanced, true);

  await creator.call(contract, 'create_task', {
    title: 'DAO-gated community grant',
    purpose: 'Fund an approved larger work package',
    deadline_ns: '3000000000000000000',
    eligibility: [],
    verifier: verifier.accountId,
    approver: null,
    tier: 'Large',
    reward_amount: TENTH.toString(),
  }, {attachedDeposit: N(1).toString()});
  await workerAccount.call(contract, 'claim_task', {task_id: 1});
  await workerAccount.call(contract, 'submit_completion', {
    task_id: 1,
    evidence_uri: 'https://example.invalid/evidence/1',
    evidence_hash: 'sha256:large-fixture',
  });
  await verifier.call(contract, 'verify_submission', {task_id: 1, approved: true, note: 'Verified'}, {gas: WORK_GAS});
  await assert.rejects(attacker.call(contract, 'execute_large_reward', {task_id: 1, mandate_id: 'cvt-large-0001'}, {gas: WORK_GAS}));
  const pending = await contract.view('get_task', {id: 1});
  assert.equal(pending.status, 'Verified');
  assert.equal(pending.paid, '0');
});
