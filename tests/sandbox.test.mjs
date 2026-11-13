/**
 * Runs only after contract WASM is compiled and near-workspaces installed.
 * Exercises real NEAR sandbox receipts and transfer callbacks.
 * The DAO caller here is a controlled account, NOT a simulated Sputnik vote.
 * Complete real-Sputnik integration is required separately on testnet.
 */
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {dirname, resolve} from 'node:path';
import {YOCTO} from '../web/src/engine.mjs';

const wasm=resolve('contract/target/near/covaunt.wasm');
const sandboxBinary=resolve('contract/target/sandbox/near-sandbox-2.14.0/near-sandbox');
const N=n=>BigInt(n)*YOCTO;
const FUTURE='2000000000000000000';

// near-workspaces 5.0.0 imports the legacy near-sandbox helper directly.
// Point that helper at the protocol-compatible binary prepared by the npm
// script instead of allowing it to silently select an older runtime.
process.env.NEAR_SANDBOX_BIN_PATH=sandboxBinary;
process.env.NEAR_SANDBOX_BINARY_PATH=dirname(sandboxBinary);

test('sandbox actual NEAR transfer and vote-incompatible rejection', {timeout:240_000}, async t=>{
  assert.ok(existsSync(wasm), 'Compiled contract/target/near/covaunt.wasm not present; run cargo near build first');
  assert.ok(existsSync(sandboxBinary), 'Protocol-compatible NEAR Sandbox binary not present; run npm run test:sandbox first');
  const {Worker}=await import('near-workspaces');
  const worker=await Worker.init();
  t.after(async()=>{await worker.tearDown();});
  const root=worker.rootAccount;
  // Sequential creation avoids nonce contention in near-workspaces and makes
  // the receipt test deterministic on slower CI hosts.
  const dao=await root.createSubAccount('council');
  const donorA=await root.createSubAccount('atlas');
  const donorB=await root.createSubAccount('mira');
  const donorC=await root.createSubAccount('solace');
  const school=await root.createSubAccount('school');
  const clinic=await root.createSubAccount('clinic');
  const contract=await root.devDeploy(wasm);
  await contract.call(contract,'new',{dao_id:dao.accountId,name:'COVAUNT'},{attachedDeposit:N(5).toString()});
  await donorA.call(contract,'contribute',{allowed_purposes:1,recipients:[school.accountId],withdraw_after_ns:FUTURE,note:'Learning only'},{attachedDeposit:N(8).toString()});
  await donorB.call(contract,'contribute',{allowed_purposes:2,recipients:[clinic.accountId],withdraw_after_ns:FUTURE,note:'Medical only'},{attachedDeposit:N(6).toString()});
  await donorC.call(contract,'contribute',{allowed_purposes:3,recipients:[clinic.accountId,school.accountId],withdraw_after_ns:FUTURE,note:'Flexible'},{attachedDeposit:N(4).toString()});
  const before=await contract.view('get_summary',{});
  assert.equal(before.total_deposited,N(18).toString());
  assert.equal(before.is_balanced,true);
  const quote=await contract.view('quote',{recipient:clinic.accountId,purpose:2,amount:N(9).toString()});
  assert.equal(quote.permitted,true);
  assert.deepEqual(quote.allocations.map(a=>a.contribution_id),[1,2]);
  await assert.rejects(root.call(contract,'execute_spend',{id:'cvt-direct-attack',recipient:clinic.accountId,purpose:2,amount:N(9).toString(),title:'Bypass',reference:''}));
  // The next call is authorized by predecessor identity. The real Sputnik vote
  // must still be tested on a real testnet DAO before a submission claim.
  await dao.call(contract,'execute_spend',{id:'cvt-medical-payment',recipient:clinic.accountId,purpose:2,amount:N(9).toString(),title:'Medical equipment',reference:'sandbox-1'},{gas:'200000000000000'});
  const after=await contract.view('get_summary',{});
  const spend=await contract.view('get_spend',{id:'cvt-medical-payment'});
  assert.equal(after.is_balanced,true);
  assert.equal(after.total_paid,N(9).toString());
  assert.equal(spend.status,'Settled');
  const education=await contract.view('get_contribution',{id:0});
  assert.equal(education.available,N(8).toString());
  await assert.rejects(dao.call(contract,'execute_spend',{id:'cvt-forbidden-vote',recipient:clinic.accountId,purpose:2,amount:N(2).toString(),title:'Misappropriation',reference:'sandbox-2'},{gas:'200000000000000'}));
  await assert.rejects(dao.call(contract,'execute_spend',{id:'cvt-medical-payment',recipient:clinic.accountId,purpose:2,amount:N(1).toString(),title:'Replay',reference:'sandbox-3'},{gas:'200000000000000'}));

  // A valid allocation whose native transfer cannot reach its recipient must
  // complete as Failed and restore every reserved donor balance.
  await donorA.call(contract,'contribute',{allowed_purposes:1,recipients:['ghost.test.near'],withdraw_after_ns:FUTURE,note:'Callback recovery'},{attachedDeposit:N(1).toString()});
  await dao.call(contract,'execute_spend',{id:'cvt-failed-transfer',recipient:'ghost.test.near',purpose:1,amount:N(1).toString(),title:'Missing recipient',reference:'sandbox-failure'},{gas:'200000000000000'});
  const failedSpend=await contract.view('get_spend',{id:'cvt-failed-transfer'});
  const restored=await contract.view('get_contribution',{id:3});
  assert.equal(failedSpend.status,'Failed');
  assert.equal(restored.available,N(1).toString());
  assert.equal(restored.pending_spend,'0');

  // Advance sandbox time past the minimum lock, then prove expiry refund is a
  // real transfer/callback transition rather than a client-side balance edit.
  const block=await worker.provider.block({finality:'final'});
  // Leave headroom for the contribution transaction to land after the view.
  const expiry=(BigInt(block.header.timestamp)+120_000_000_000n).toString();
  await donorB.call(contract,'contribute',{allowed_purposes:1,recipients:[school.accountId],withdraw_after_ns:expiry,note:'Expiry refund'},{attachedDeposit:N(1).toString()});
  await worker.provider.fastForward(200);
  await donorB.call(contract,'request_refund',{id:4},{gas:'100000000000000'});
  const refunded=await contract.view('get_contribution',{id:4});
  assert.equal(refunded.pending_refund,'0');
  assert.equal(refunded.refunded,N(1).toString());
  assert.equal(refunded.available,'0');
  const final=await contract.view('get_summary',{});
  assert.equal(final.is_balanced,true);
  assert.equal(final.total_paid,N(9).toString());
  assert.equal(final.total_refunded,N(1).toString());
});
