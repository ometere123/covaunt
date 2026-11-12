import {CONFIG} from './config.js';
import {PURPOSES, SAMPLE, allocate, parseNear, formatNear, maskLabels, isValidAccount, assertLedger} from './engine.mjs';
import {view, loadLedger, bytesBase64} from './rpc.js';

const $=id=>document.getElementById(id);
const hasConfig=Boolean(CONFIG.contractId && CONFIG.daoId);
let ledger=hasConfig?null:SAMPLE;
let connected=null;
let loading=false;
let daoProposals=[];
let selectedQuote=null;
let lastMandate=null;
const nowNs=()=>BigInt(Date.now())*1_000_000n;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const short=s=>String(s||'').length>24?String(s).slice(0,9)+'…'+String(s).slice(-11):String(s||'');
const fmt=v=>formatNear(v,2);
const toast=(msg,timeout=7000)=>{const el=$('toast');el.textContent=msg;el.hidden=false;clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.hidden=true,timeout);};
const feedback=(id,msg,ok=false)=>{const el=$(id);el.textContent=msg;el.classList.toggle('ok',ok);};
const humanDate=ns=>new Date(Number(BigInt(ns)/1_000_000n)).toLocaleDateString('en-GB',{year:'numeric',month:'short',day:'numeric'});
const roleLabel=mask=>maskLabels(mask).join(' + ');
function renderStats(){
 if(!ledger)return;
 for(const [id,key] of [['stat-total','total_deposited'],['stat-available','available'],['stat-paid','total_paid'],['stat-returned','total_refunded']]) {
   $(id).innerHTML=`${esc(fmt(ledger.summary[key]))} <small>Ⓝ</small>`;
 }
 $('ledger-count').textContent=`(${String(ledger.contributions.length).padStart(2,'0')})`;
 $('integrity-status').textContent=hasConfig?`LEDGER BALANCED: ${ledger.summary.is_balanced?'YES':'NO — INVESTIGATE'}`:'DESIGN PREVIEW / NO ON-CHAIN EXECUTION';
 $('explorer-link').href=hasConfig?`${CONFIG.explorer}/address/${encodeURIComponent(CONFIG.contractId)}`:CONFIG.explorer;
}
function renderContributions(){
 const body=$('contribution-rows');
 if(!ledger?.contributions?.length){body.innerHTML='<tr><td colspan="5">No contributions recorded.</td></tr>';return;}
 body.innerHTML=ledger.contributions.map(c=>{
   const tags=maskLabels(c.allowed_purposes).map(label=>`<span class="tag">${esc(label)}</span>`).join('');
   return `<tr><td><span class="entry-id">COV-&#35;${String(c.id).padStart(3,'0')}</span><strong>${esc(short(c.donor))}</strong></td>
   <td>${tags}</td><td><span class="muted">${esc(c.recipients.map(short).join(', '))}</span></td>
   <td class="num">${esc(fmt(c.available))} <small>Ⓝ</small></td>
   <td class="num"><button type="button" class="row-view" data-view="${c.id}" aria-label="Inspect contribution ${c.id}">↗</button></td></tr>`;
 }).join('');
 body.querySelectorAll('[data-view]').forEach(button=>button.addEventListener('click',()=>openContribution(Number(button.dataset.view))));
}
function renderSpends(){
 const el=$('spend-rows');
 if(!ledger?.spends?.length){el.innerHTML='<p class="spend-empty">The record begins with a promise.<br/>Settlement entries appear here.</p>';return;}
 el.innerHTML=[...ledger.spends].reverse().slice(0,12).map(s=>`<div class="spend-row"><div><strong>${esc(s.title)}</strong><br/><small>${esc(short(s.recipient))} · ${esc(roleLabel(s.purpose))}</small></div><div style="text-align:right"><strong>${esc(fmt(s.amount))} Ⓝ</strong><br/><span class="status ${esc(s.status)}">${esc(s.status)}</span></div></div>`).join('');
}
function parseDocketDescription(description) {
 try {const obj=JSON.parse(description);return obj?.protocol==='COVAUNT'?obj:null;} catch{return null;}
}
function renderDocket(){
 const body=$('docket-body');
 if(!hasConfig){body.innerHTML='<p>Design preview: on-chain council activity will appear here after deployment. Votes are never simulated.</p>';return;}
 if(!daoProposals.length){body.innerHTML='<p>No COVAUNT FunctionCall proposals found in the most recent DAO docket.</p>';return;}
 body.innerHTML=[...daoProposals].reverse().map(p=>{
  const d=parseDocketDescription(p.description)||{};
  const mayVote=p.status==='InProgress' && connected && !p.votes?.[connected];
  return `<div class="docket-row"><span class="docket-number">#${esc(p.id)}</span><div><h4>${esc(d.title||'Spending mandate')}</h4><p>${esc(short(d.recipient||p.proposer))} · ${esc(d.amount_yocto?fmt(d.amount_yocto):'—')} NEAR</p></div><span class="docket-state">${esc(p.status)}</span><div class="docket-actions">${mayVote?`<button type="button" data-vote="Approve" data-id="${esc(p.id)}">Approve ↗</button><button type="button" data-vote="Reject" data-id="${esc(p.id)}" class="reject">Reject</button>`:'<span class="field-help">DAO-governed outcome</span>'}</div></div>`;
 }).join('');
 body.querySelectorAll('[data-vote]').forEach(b=>b.addEventListener('click',()=>void voteOnProposal(Number(b.dataset.id),b.dataset.vote)));
}
async function loadDocket(){
 if(!hasConfig){renderDocket();return;}
 try{
  const last=Number(await view(CONFIG.daoId,'get_last_proposal_id'));
  if(!Number.isSafeInteger(last)||last<0)throw Error('Invalid DAO proposal index');
  const proposals=last===0?[]:await view(CONFIG.daoId,'get_proposals',{from_index:Math.max(0,last-40),limit:Math.min(40,last)});
  daoProposals=proposals.filter(p=>p.kind?.FunctionCall?.receiver_id===CONFIG.contractId &&
   p.kind.FunctionCall.actions?.some(a=>a.method_name==='execute_spend'));
  renderDocket();
 }catch(e){$('docket-body').innerHTML=`<p>Could not retrieve on-chain council proposals: ${esc(e.message)}</p>`;}
}
async function voteOnProposal(id,choice){
 try{
  if(!connected)throw Error('Connect a council wallet first');
  const p=daoProposals.find(x=>Number(x.id)===id);
  if(!p||p.status!=='InProgress')throw Error('Proposal is no longer open for voting');
  if(!confirm(`${choice} mandate #${id}? Sputnik DAO decides voting eligibility and threshold.`))return;
  const wallet=await getWallet();
  const result=await wallet.signCall(CONFIG.daoId,'act_proposal',{id,action:'Vote'+choice,proposal:p.kind,memo:null},'170000000000000','0');
  toast(`Council vote submitted: ${result?.transaction?.hash||'check wallet'}`);
  setTimeout(()=>{void loadDocket();void refresh();},2200);
 }catch(e){toast(`DAO vote failed: ${e.message}`);}
}
function renderMode(){
 const b=$('mode-ribbon');
 b.classList.toggle('live',Boolean(hasConfig&&ledger));
 if(hasConfig){
    b.querySelector('strong').textContent=ledger?'NEAR TESTNET / LIVE DATA':'NEAR TESTNET / CONNECTING';
    b.querySelector('span:nth-of-type(2)').textContent=ledger?`Reading ${CONFIG.contractId}`:'Fetching public contract state; no sample fallback.';
 } else {b.querySelector('strong').textContent='DESIGN PREVIEW';b.querySelector('span:nth-of-type(2)').textContent='Illustrative data only. Set contract and DAO IDs after deployment.';}
}
function renderAll(){renderStats();renderContributions();renderSpends();renderMode();renderDocket();}
function renderUnavailable(message){
  // An RPC failure must not leave HTML's illustrative 18 NEAR figures on screen.
  for(const id of ['stat-total','stat-available','stat-paid','stat-returned'])$(id).textContent='—';
  $('ledger-count').textContent='(—)';
  $('integrity-status').textContent='UNVERIFIED / DATA UNAVAILABLE';
  $('contribution-rows').innerHTML='<tr><td colspan="5">No verified on-chain ledger available. Do not transact.</td></tr>';
  $('spend-rows').textContent='Execution journal unavailable until the chain can be verified.';
  $('docket-body').textContent='DAO docket unavailable while treasury verification is offline.';
  renderMode();
  toast(`Live verification unavailable: ${message}`,10000);
}
async function refresh(){
 if(!hasConfig){ledger=SAMPLE;renderAll();return;}
 if(loading)return;
 loading=true;
 try{
   const loaded=await loadLedger();
   if(loaded.summary.dao_id!==CONFIG.daoId)throw Error(`Configured DAO mismatch; contract expects ${loaded.summary.dao_id}`);
   ledger=loaded;
   if(!loaded.summary.is_balanced)toast('CRITICAL: contract ledger accounting reports a mismatch. Do not deposit funds.',10000);
   renderAll();void loadDocket();
 }catch(e){ledger=null;daoProposals=[];renderUnavailable(e.message);}
 finally{loading=false;}
}
function makePurposeChecks(){
 $('purpose-checks').innerHTML=PURPOSES.map((p,i)=>`<label class="purpose-choice"><input type="checkbox" name="purpose-${p.bit}" value="${p.bit}" ${i===0?'checked':''}/><span>${esc(p.label)}</span></label>`).join('');
 $('mandate-purpose').innerHTML=PURPOSES.map(p=>`<option value="${p.bit}" ${p.bit===2?'selected':''}>${esc(p.label)}</option>`).join('');
}
function configurePreview(){
 if(hasConfig)return;
 for(const [buttonId,feedbackId,message] of [
   ['#contribution-form .submit-button','deposit-feedback','Design preview — real contributions are disabled until a deployed contract is configured.'],
   ['#propose-button','mandate-feedback','Design preview — real DAO proposals are disabled until deployed contract and DAO IDs are configured.'],
 ]){
   const button=document.querySelector(buttonId);
   if(!button)continue;
   button.disabled=true;
   button.title='Disabled in design preview';
   feedback(feedbackId,message);
 }
}
async function getWallet(){return await import('./wallet.js');}
async function tryConnect(){
 try{if(!hasConfig){toast('DESIGN PREVIEW: connect is disabled until real contract and DAO IDs are configured.');return;}
  const wallet=await getWallet();connected=await wallet.connect();updateWallet();toast(connected?`Connected as ${connected}`:'Wallet redirection initiated');}
 catch(e){toast(`Wallet connection: ${e.message}`);}
}
function updateWallet(){
 const b=$('wallet-button');b.classList.toggle('connected',Boolean(connected));
 b.innerHTML=`<span class="wallet-dot"></span>${esc(connected?short(connected):'Connect wallet')} <span aria-hidden="true">↗</span>`;
 renderDocket();
 b.title=connected?'Click to disconnect':'Connect My NEAR Wallet on testnet';
}
async function initializeWallet(){
 if(!hasConfig)return;
 try{connected=await (await getWallet()).account();updateWallet();}
 catch(e){console.warn('Wallet reconnect unavailable:',e);}
}
function openContribution(id){
 const c=ledger?.contributions?.find(c=>Number(c.id)===id);if(!c)return;
 const canRefund=hasConfig&&connected===c.donor && BigInt(c.available)>0n && BigInt(c.pending_refund)===0n && nowNs()>=BigInt(c.withdraw_after_ns);
 $('dialog-content').innerHTML=`<div class="section-index">COVENANT / ${String(c.id).padStart(4,'0')}</div>
   <h3>Permission is personal.</h3><div class="dialog-data">
   <p><strong>Contributor</strong><br/>${esc(c.donor)}</p>
   <p><strong>Original deposit</strong><br/>${esc(fmt(c.principal))} NEAR</p>
   <p><strong>Available</strong><br/>${esc(fmt(c.available))} NEAR</p>
   <p><strong>Permitted purposes</strong><br/>${esc(roleLabel(c.allowed_purposes))}</p>
   <p><strong>Approved recipients</strong><br/>${esc(c.recipients.join(', '))}</p>
   <p><strong>Permission expires</strong><br/>${esc(humanDate(c.withdraw_after_ns))}</p>
   <p><strong>Note</strong><br/>${esc(c.note||'No memo recorded')}</p></div>
   ${canRefund?`<button type="button" class="submit-button" id="refund-now">Reclaim expired balance <span>↗</span></button>`:''}
   <p class="field-help">An in-flight approved payout may temporarily reserve capital until its transfer callback finalizes.</p>`;
 $('info-dialog').showModal();
 $('refund-now')?.addEventListener('click',()=>sendRefund(id));
}
async function sendRefund(id){
 if(!connected||!hasConfig)return;
 if(!confirm(`Request withdrawal of this covenant's available balance? The contract will verify eligibility.`))return;
 try{
   const wallet=await getWallet();const outcome=await wallet.signCall(CONFIG.contractId,'request_refund',{id},'90000000000000','0');
   $('info-dialog').close();toast(`Refund transaction submitted: ${outcome?.transaction?.hash||'check wallet and explorer'}`);setTimeout(refresh,1800);
 }catch(e){toast(`Refund failed or declined: ${e.message}`);}
}
function onContributionSubmit(ev){ev.preventDefault();void submitContribution();}
async function submitContribution(){
 try{
   if(!hasConfig)throw Error('Design preview — configure a deployed contract before recording real contributions');
   if(!ledger?.summary?.is_balanced)throw Error('Ledger not verified; deposits disabled');
   if(!connected)throw Error('Connect your NEAR wallet first');
   const amount=$('deposit-amount').value;
   const yocto=parseNear(amount);
   if(yocto<parseNear('0.01'))throw Error('Minimum contribution is 0.01 NEAR');
   let mask=0;
   for(const p of PURPOSES)if(document.querySelector(`[name="purpose-${p.bit}"]`).checked)mask|=p.bit;
   if(!mask)throw Error('Choose at least one allowed purpose');
   const recipients=$('recipient-list').value.split(',').map(s=>s.trim()).filter(Boolean);
   if(recipients.length<1||recipients.length>8||recipients.some(a=>!isValidAccount(a)))throw Error('Provide one to eight valid NEAR recipient account IDs');
   if(new Set(recipients).size!==recipients.length)throw Error('Duplicate recipient IDs are not allowed');
   if(recipients.includes(CONFIG.daoId)||recipients.includes(CONFIG.contractId))throw Error('Sending protected capital back to the DAO or treasury is forbidden');
   const days=Number($('lock-days').value);
   if(!Number.isSafeInteger(days)||days<1||days>3650)throw Error('Choose 1 to 3650 days');
   const note=$('donor-note').value;
   if(new TextEncoder().encode(note).length>180)throw Error('Note cannot exceed 180 UTF-8 bytes');
   const unlock=(nowNs()+BigInt(days)*86400n*1_000_000_000n).toString();
   feedback('deposit-feedback','Open your wallet to approve this restricted contribution…');
   const wallet=await getWallet();
   const outcome=await wallet.signCall(CONFIG.contractId,'contribute',{allowed_purposes:mask,recipients,withdraw_after_ns:unlock,note},'90000000000000',yocto.toString());
   feedback('deposit-feedback',`Wallet submission initiated: ${outcome?.transaction?.hash||'verify final on-chain receipt after wallet redirect'}. The ledger updates only after finality.`,true);
   setTimeout(refresh,2000);
 }catch(e){feedback('deposit-feedback',e.message);}
}
function proposalParams(){
 const title=$('mandate-title-input').value.trim();
 const recipient=$('mandate-recipient').value.trim();
 const purpose=Number($('mandate-purpose').value);
 const amount=parseNear($('mandate-amount').value);
 const reference=$('mandate-ref').value.trim();
 if(!title||new TextEncoder().encode(title).length>120)throw Error('Enter a mandate title under 120 bytes');
 if(!isValidAccount(recipient))throw Error('Enter a valid beneficiary account');
 if(amount<=0n)throw Error('Amount must be greater than zero');
 if(new TextEncoder().encode(reference).length>200)throw Error('Reference is too long');
 if(hasConfig&&(recipient===CONFIG.contractId||recipient===CONFIG.daoId))throw Error('DAO and treasury are prohibited recipients');
 return {title,recipient,purpose,amount,reference};
}
async function previewQuote(){
 try{
   if(!ledger)throw Error('Live ledger unavailable');
   const params=proposalParams();
   const quote=hasConfig?
     await view(CONFIG.contractId,'quote',{recipient:params.recipient,purpose:params.purpose,amount:params.amount.toString()}):
     allocate(ledger.contributions,params.recipient,params.purpose,params.amount,nowNs());
   selectedQuote=quote;lastMandate={...params};
   const shortfall=BigInt(quote.shortfall||0);
   $('allocation-content').innerHTML=`<h4>${quote.permitted?'Capital is compatible.':'The promise prevents it.'}</h4>
     <p class="${quote.permitted?'':'allocation-warning'}">${esc(quote.reason)}</p>
     ${quote.allocations.map(a=>{const c=ledger.contributions.find(x=>Number(x.id)===Number(a.contribution_id));return `<div class="line"><span>COV-#${String(a.contribution_id).padStart(3,'0')}<br/><small>${esc(short(c?.donor||''))}</small></span><b>${esc(fmt(a.amount))} Ⓝ</b></div>`;}).join('')}
     <div class="line"><strong>Requested</strong><b>${esc(fmt(params.amount))} Ⓝ</b></div>
     <div class="line"><strong>Shortfall</strong><b>${esc(fmt(shortfall))} Ⓝ</b></div>
     <p class="field-help">${hasConfig?'Live contract quote. Executed permissions are rechecked on-chain after the DAO vote.':'ILLUSTRATIVE ONLY — this sample quote does not authorize a transaction.'}</p>`;
   feedback('mandate-feedback',quote.permitted?'Allocation preview ready. DAO approval is still required.':'Cannot fund this proposal from eligible balances.',quote.permitted);
   return quote;
 }catch(e){selectedQuote=null;feedback('mandate-feedback',e.message);return null;}
}
function mandId(){const b=new Uint8Array(12);crypto.getRandomValues(b);return 'cvt-'+Array.from(b,x=>x.toString(16).padStart(2,'0')).join('');}
async function submitMandate(ev){
 ev.preventDefault();
 try{
   if(!hasConfig)throw Error('Design preview — deploy and configure real NEAR accounts before submitting');
   if(!connected)throw Error('Connect a NEAR wallet before proposing');
   if(!ledger?.summary?.is_balanced)throw Error('Ledger unavailable or inconsistent');
   const p=proposalParams();
   // Re-read allocation rather than trusting earlier DOM / stale data.
   const quote=await view(CONFIG.contractId,'quote',{recipient:p.recipient,purpose:p.purpose,amount:p.amount.toString()});
   if(!quote.permitted)throw Error(`Contract quote rejects proposal: ${quote.reason}`);
   const policy=await view(CONFIG.daoId,'get_policy');
   const rawBond=policy?.proposal_bond??policy?.policy?.proposal_bond;
   if(rawBond==null||!/^\d+$/.test(String(rawBond)))throw Error('DAO policy bond is not readable; proposal creation blocked');
   const id=mandId();
   const args={id,recipient:p.recipient,purpose:p.purpose,amount:p.amount.toString(),title:p.title,reference:p.reference};
   const json=new TextEncoder().encode(JSON.stringify(args));
   const actions=[{method_name:'execute_spend',args:bytesBase64(json),deposit:'0',gas:'150000000000000'}];
   const description=JSON.stringify({protocol:'COVAUNT',mandate_id:id,title:p.title,purpose:p.purpose,recipient:p.recipient,amount_yocto:p.amount.toString(),reference:p.reference,contract:CONFIG.contractId});
   const proposal={description,kind:{FunctionCall:{receiver_id:CONFIG.contractId,actions}}};
   feedback('mandate-feedback',`Opening wallet for ${id}; Sputnik DAO must subsequently vote and execute.`);
   const wallet=await getWallet();
   const outcome=await wallet.signCall(CONFIG.daoId,'add_proposal',{proposal},'160000000000000',String(rawBond));
   feedback('mandate-feedback',`DAO proposal request initiated; mandate ${id}. ${outcome?.transaction?.hash||'Verify the proposal exists on-chain after wallet redirect.'}`,true);
   toast('Proposal submitted to DAO — it has NOT yet been approved or paid.');
   setTimeout(refresh,1800);
 }catch(e){feedback('mandate-feedback',e.message);}
}
function install(){
 makePurposeChecks();configurePreview();renderAll();
 $('wallet-button').addEventListener('click',async()=>{
   if(!connected){await tryConnect();return;}
   if(confirm(`Disconnect wallet ${connected}?`)){try{await (await getWallet()).disconnect();connected=null;updateWallet();}catch(e){toast(e.message);}}
 });
 $('refresh-button').addEventListener('click',()=>void refresh());
 $('contribution-form').addEventListener('submit',onContributionSubmit);
 $('quote-button').addEventListener('click',()=>void previewQuote());
 $('mandate-form').addEventListener('submit',submitMandate);
 $('close-dialog').addEventListener('click',()=>$('info-dialog').close());
 $('info-dialog').addEventListener('click',e=>{if(e.target===$('info-dialog'))$('info-dialog').close();});
 for(const id of ['mandate-title-input','mandate-purpose','mandate-recipient','mandate-amount','mandate-ref'])$(id).addEventListener('input',()=>{selectedQuote=null;});
 void refresh();void initializeWallet();
}
install();
