/** Read-only testnet audit; requires real deployment IDs via environment. */
import {parseNear} from '../web/src/engine.mjs';
const contract=process.env.COVAUNT_ACCOUNT;
const dao=process.env.DAO_ACCOUNT;
const rpc=process.env.NEAR_RPC||'https://rpc.testnet.near.org';
if(!contract||!dao){console.error('Set COVAUNT_ACCOUNT and DAO_ACCOUNT to deployed testnet accounts');process.exit(2);}
async function call(method,params){
 const res=await fetch(rpc,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method,params})});
 const json=await res.json();if(json.error)throw Error(JSON.stringify(json.error));return json.result;
}
async function view(id,method,args={}){
 const result=await call('query',{request_type:'call_function',account_id:id,method_name:method,args_base64:Buffer.from(JSON.stringify(args)).toString('base64'),finality:'final'});
 return JSON.parse(Buffer.from(result.result).toString('utf8'));
}
try{
 const [summary,policy,keys,code,account]=await Promise.all([
  view(contract,'get_summary'),view(dao,'get_policy'),
  call('query',{request_type:'view_access_key_list',account_id:contract,finality:'final'}),
  call('query',{request_type:'view_code',account_id:contract,finality:'final'}),
  call('query',{request_type:'view_account',account_id:contract,finality:'final'}),
 ]);
 const full=keys.keys.filter(k=>k.access_key.permission==='FullAccess');
 const requiredUnpaid=BigInt(summary.available)+BigInt(summary.pending_spend)+BigInt(summary.pending_refund);
 // NEAR storage byte price is currently conventionally 10^19 yocto per byte.
 // This is an estimate; verify against live protocol configuration.
 const stakingEstimate=BigInt(account.storage_usage)*10_000_000_000_000_000_000n;
 const liquidEstimate=BigInt(account.amount)-stakingEstimate;
 const principalBacked=liquidEstimate>=requiredUnpaid;
 const results={
   network:'testnet',contract,dao,code_hash:code.code_hash||code.hash,
   ledger_balanced:summary.is_balanced,
   dao_match:summary.dao_id===dao,
   full_access_keys:full.map(k=>k.public_key),
   proposal_bond_yocto:policy.proposal_bond,
   contract_balance_yocto:String(account.amount),storage_usage_bytes:account.storage_usage,
   estimated_storage_staked_yocto:String(stakingEstimate),
   estimated_liquid_yocto:String(liquidEstimate),
   outstanding_donor_principal_yocto:String(requiredUnpaid),
   estimated_donor_principal_backed:principalBacked,
   storage_price_assumption_yocto_per_byte:'10000000000000000000',
   totals:{contributed:summary.total_deposited,paid:summary.total_paid,refunded:summary.total_refunded,available:summary.available,pending_spend:summary.pending_spend,pending_refund:summary.pending_refund},
 };
 console.log(JSON.stringify(results,null,2));
 if(!results.ledger_balanced||!results.dao_match||!principalBacked){console.error('Ledger, DAO, or estimated liquid coverage check failed');process.exitCode=1;}
 if(full.length){console.error('\nSECURITY BLOCKER: contract has FullAccess key(s) that can replace code. No immutable-permission claim is warranted until removed after testing.');process.exitCode=1;}
 if(BigInt(summary.reserve)<parseNear('5')){console.error('Unexpected storage reserve');process.exitCode=1;}
}catch(e){console.error(`LIVE AUDIT FAILED: ${e.message}`);process.exitCode=1;}
