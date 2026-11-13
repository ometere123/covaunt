/** Deterministic mirror of the on-chain allocator. NOT authoritative for funds. */
export const PURPOSES = Object.freeze([
  { bit: 1, label: 'Education', code: 'EDU', desc: 'Scholarships, learning and access' },
  { bit: 2, label: 'Healthcare', code: 'CARE', desc: 'Treatment, medical support and relief' },
  { bit: 4, label: 'Emergency relief', code: 'AID', desc: 'Time-sensitive community assistance' },
  { bit: 8, label: 'Public works', code: 'CIVIC', desc: 'Community infrastructure' },
  { bit: 16, label: 'Culture', code: 'ART', desc: 'Arts and local heritage' },
]);
export const YOCTO = 10n ** 24n;
export function parseNear(value) {
  const v = String(value).trim();
  if (!/^(?:0|[1-9]\d*)(?:\.\d{1,24})?$/.test(v)) throw Error('Enter a positive decimal amount with up to 24 places');
  const [whole, frac=''] = v.split('.');
  return BigInt(whole) * YOCTO + BigInt((frac + '0'.repeat(24)).slice(0,24));
}
export function formatNear(yocto, decimals=2) {
  const n = BigInt(yocto || 0);
  const negative = n < 0n;
  const x = negative ? -n : n;
  const whole = x / YOCTO;
  const fractional = ((x % YOCTO).toString().padStart(24,'0')).slice(0, decimals);
  return (negative ? '-' : '') + whole.toLocaleString('en-US') + (decimals ? '.'+fractional : '');
}
export function maskLabels(mask) { return PURPOSES.filter(p => Number(mask) & p.bit).map(p => p.label); }
export function isSinglePurpose(bit) {return Number.isInteger(bit) && bit > 0 && bit <= 16 && (bit & (bit-1))===0;}
export function isValidAccount(a) {return typeof a==='string' && a.length>=2 && a.length<=64 && /^(?:[a-z\d]+(?:[-_.][a-z\d]+)*)$/.test(a) && !a.includes('..');}
export function allocate(grants, recipient, purpose, amount, nowNs=0n, maxAllocations=24) {
  amount = BigInt(amount);
  if (!isSinglePurpose(purpose) || amount<=0n || !isValidAccount(recipient)) {
    return {permitted:false, shortfall:amount, allocations:[], reason:'Invalid request'};
  }
  const candidates = grants.filter(c =>
    BigInt(c.available)>0n && BigInt(c.withdraw_after_ns)>nowNs &&
    (Number(c.allowed_purposes)&purpose)!==0 && c.recipients.includes(recipient)
  ).sort((a,b) => {
    const bits=x=>x.toString(2).replace(/0/g,'').length;
    return bits(Number(a.allowed_purposes))-bits(Number(b.allowed_purposes)) ||
      a.recipients.length-b.recipients.length || Number(a.id)-Number(b.id);
  });
  let left=amount;
  const allocations=[];
  for (const c of candidates.slice(0,maxAllocations)) {
    if(left===0n)break;
    const used = left < BigInt(c.available) ? left : BigInt(c.available);
    allocations.push({contribution_id:Number(c.id), amount:used.toString()});
    left-=used;
  }
  return {permitted:left===0n, shortfall:left.toString(), allocations,
    reason:left===0n?'Eligible capital can cover this proposal':'Insufficient eligible capital or allocation capacity'};
}
export function assertLedger(grants, stats) {
  const available=grants.reduce((a,c)=>a+BigInt(c.available),0n);
  const pending=grants.reduce((a,c)=>a+BigInt(c.pending_spend||0)+BigInt(c.pending_refund||0),0n);
  const total=BigInt(stats.total_paid)+BigInt(stats.total_refunded)+available+pending;
  return total === BigInt(stats.total_deposited);
}
export const SAMPLE = Object.freeze({
  summary: {
    name:'COVAUNT',dao_id:'council.sputnik-v2.testnet',reserve:(5n*YOCTO).toString(),
    total_deposited:(18n*YOCTO).toString(),total_paid:'0',total_refunded:'0',
    available:(18n*YOCTO).toString(),pending_spend:'0',pending_refund:'0',
    contributions:3,spends:0,is_balanced:true,
  },
  contributions: [
    {id:0,donor:'atlas.testnet',principal:(8n*YOCTO).toString(),available:(8n*YOCTO).toString(),paid:'0',refunded:'0',pending_spend:'0',pending_refund:'0',allowed_purposes:1,recipients:['school.testnet'],withdraw_after_ns:'2000000000000000000',note:'A promise to learning'},
    {id:1,donor:'mira.testnet',principal:(6n*YOCTO).toString(),available:(6n*YOCTO).toString(),paid:'0',refunded:'0',pending_spend:'0',pending_refund:'0',allowed_purposes:2,recipients:['clinic.testnet'],withdraw_after_ns:'2000000000000000000',note:'For urgent care'},
    {id:2,donor:'solace.testnet',principal:(4n*YOCTO).toString(),available:(4n*YOCTO).toString(),paid:'0',refunded:'0',pending_spend:'0',pending_refund:'0',allowed_purposes:3,recipients:['clinic.testnet','school.testnet'],withdraw_after_ns:'2000000000000000000',note:'Where the need is greatest'},
  ],
  spends:[],
});
