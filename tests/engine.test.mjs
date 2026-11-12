import test from 'node:test';
import assert from 'node:assert/strict';
import {allocate,parseNear,formatNear,maskLabels,isValidAccount,isSinglePurpose,assertLedger,SAMPLE,YOCTO} from '../web/src/engine.mjs';
const c=SAMPLE.contributions;
const now=1_800_000_000_000_000_000n;
test('exact decimal amounts roundtrip without floating-point loss',()=>{
 assert.equal(parseNear('1.123456789123456789123456').toString(),'1123456789123456789123456');
 assert.equal(formatNear(parseNear('123456.89')),'123,456.89');
 assert.equal(parseNear('0.01'),YOCTO/100n);
 for(const invalid of ['1.0000000000000000000000001','1e3','-1','1.','', '0x12'])assert.throws(()=>parseNear(invalid));
});
test('8/6/4 demo: the medical request spends specific funds first',()=>{
 const r=allocate(c,'clinic.testnet',2,parseNear('9'),now);
 assert.equal(r.permitted,true);
 assert.deepEqual(r.allocations.map(x=>[x.contribution_id,formatNear(x.amount)]),[[1,'6.00'],[2,'3.00']]);
 assert.equal(r.shortfall,'0');
});
test('education cannot be redirected to clinic even if majority votes',()=>{
 const r=allocate([c[0]],'clinic.testnet',2,parseNear('1'),now);
 assert.equal(r.permitted,false);assert.equal(r.allocations.length,0);
});
test('purpose and recipient are both mandatory',()=>{
 assert.equal(allocate([c[0]],'school.testnet',2,parseNear('1'),now).permitted,false);
 assert.equal(allocate([c[0]],'scholarship.testnet',1,parseNear('1'),now).permitted,false);
});
test('all grants become ineligible when expired',()=>{
 assert.equal(allocate(c,'clinic.testnet',2,parseNear('1'),2_000_000_000_000_000_001n).permitted,false);
});
test('no valid request for multi-purpose proposal',()=>{
 assert.equal(isSinglePurpose(3),false);
 assert.equal(allocate(c,'clinic.testnet',3,parseNear('2'),now).permitted,false);
});
test('ledger conservation holds and detects corruption',()=>{
 assertLedger(c,SAMPLE.summary);
 assert.equal(assertLedger(c,{...SAMPLE.summary,total_paid:parseNear('1').toString()}),false);
});
test('recipient validators reject invalid IDs',()=>{
 for(const bad of ['A.testnet','admin..testnet','a ','','&','a/'.repeat(50)])assert.equal(isValidAccount(bad),false);
 for(const good of ['clinic.testnet','alice.testnet','my-dao.sputnik-v2.testnet'])assert.equal(isValidAccount(good),true);
});
test('bounded allocations never over-allocate or bypass destination',()=>{
 for(let i=0;i<80;i++){
   const requested=BigInt(i+1)*YOCTO/10n;
   const q=allocate(c,'clinic.testnet',2,requested,now);
   const sum=q.allocations.reduce((a,x)=>a+BigInt(x.amount),0n);
   assert.equal(sum+BigInt(q.shortfall),requested);
   assert.ok(sum<=requested);
   assert.ok(q.allocations.every(x=>c[x.contribution_id].recipients.includes('clinic.testnet')));
 }
});
test('allocation cap is explicit and enforced',()=>{
 const many=Array.from({length:30},(_,id)=>({id,available:YOCTO.toString(),withdraw_after_ns:(now+100n).toString(),recipients:['clinic.testnet'],allowed_purposes:2}));
 const q=allocate(many,'clinic.testnet',2,25n*YOCTO,now);
 assert.equal(q.permitted,false);
 assert.equal(q.allocations.length,24);
 assert.equal(q.shortfall,YOCTO.toString());
});
test('broad purpose grant remains in use but never replaces incompatible restriction',()=>{
 const q=allocate(c,'school.testnet',1,parseNear('10'),now);
 assert.equal(q.permitted,true);
 assert.deepEqual(q.allocations.map(x=>x.contribution_id),[0,2]);
});
test('purpose descriptions map to correct bits',()=>{
 assert.deepEqual(maskLabels(3),['Education','Healthcare']);
 assert.deepEqual(maskLabels(0),[]);
});
