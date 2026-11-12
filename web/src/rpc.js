import {CONFIG} from './config.js';
const encoder=new TextEncoder();
const decoder=new TextDecoder();
function toBase64(s) {return btoa(String.fromCharCode(...encoder.encode(s)));}
export function bytesBase64(bytes) {let out=''; for(const b of bytes)out+=String.fromCharCode(b);return btoa(out);}
let seq=0;
export async function rpc(method,params) {
  const ctl=new AbortController();
  const timeout=setTimeout(()=>ctl.abort(),12000);
  try {
    const res=await fetch(CONFIG.rpc,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:++seq,method,params}),signal:ctl.signal});
    if(!res.ok)throw Error(`NEAR RPC HTTP ${res.status}`);
    const json=await res.json();
    if(json.error)throw Error(json.error.message||JSON.stringify(json.error));
    return json.result;
  } finally {clearTimeout(timeout);}
}
export async function view(accountId,methodName,args={}) {
  if(!accountId)throw Error('No contract configured');
  const reply=await rpc('query',{request_type:'call_function',finality:'final',account_id:accountId,method_name:methodName,args_base64:toBase64(JSON.stringify(args))});
  return JSON.parse(decoder.decode(new Uint8Array(reply.result)));
}
export async function loadLedger() {
  const summary=await view(CONFIG.contractId,'get_summary');
  const pages=async (method, total)=>{
    const output=[];
    for(let i=0;i<total;i+=40)output.push(...await view(CONFIG.contractId,method,{from_index:i,limit:40}));
    return output;
  };
  const [contributions,spends]=await Promise.all([
    pages('get_contributions',summary.contributions),pages('get_spends',summary.spends)
  ]);
  return {summary,contributions,spends};
}
