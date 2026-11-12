/**
 * Collect REAL NEAR testnet transaction outcomes by hash and known signer.
 * Syntax: node scripts/collect-evidence.mjs deposit-a=TXHASH@SIGNER spend=TXHASH@SIGNER
 * Does not fabricate, mint, sign, or submit transactions; only records RPC results.
 */
import {writeFileSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
const args=process.argv.slice(2);
if(!args.length){console.error('Usage: node scripts/collect-evidence.mjs label=TXHASH@SIGNER [...]');process.exit(2);}
const rpc=process.env.NEAR_RPC||'https://rpc.testnet.near.org';
async function fetchTransaction(hash,signer){
 const response=await fetch(rpc,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:hash,method:'tx',params:[hash,signer]})});
 if(!response.ok)throw Error(`RPC HTTP ${response.status}`);
 const json=await response.json();if(json.error)throw Error(JSON.stringify(json.error));
 if(!json.result?.transaction?.hash)throw Error('Transaction not finalized or not found');
 return json.result;
}
const output={network:'testnet',retrieved_at:new Date().toISOString(),rpc,records:[]};
for(const arg of args){
 const m=/^([a-z0-9-]{2,64})=([^@\s]+)@([a-z0-9._-]+)$/.exec(arg);
 if(!m)throw Error(`Malformed argument: ${arg}`);
 const [,label,hash,signer]=m;
 const actual=await fetchTransaction(hash,signer);
 const item={label,hash,signer,status:actual.status,transaction:actual.transaction,transaction_outcome:actual.transaction_outcome,receipts_outcome:actual.receipts_outcome,explorer:`https://testnet.nearblocks.io/txns/${hash}`};
 output.records.push(item);
 console.log(`${label}: fetched tx ${hash} — status ${JSON.stringify(actual.status).slice(0,180)}`);
}
mkdirSync(resolve('docs/live-evidence'),{recursive:true});
const path=resolve('docs/live-evidence/evidence.json');writeFileSync(path,JSON.stringify(output,null,2));
console.log(`Real RPC receipts saved: ${path}`);
