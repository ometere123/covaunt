/**
 * Read-only audit for the isolated Work & Trust contract.
 * It never signs, submits transactions or inspects private keys.
 */
const contract = process.env.COVAUNT_WORK_ACCOUNT;
const dao = process.env.COVAUNT_WORK_DAO;
const rpc = process.env.NEAR_RPC || 'https://rpc.testnet.near.org';
const expectedCodeHash = process.env.COVAUNT_WORK_CODE_HASH || '6SmBmxFQQaAhnP19yadMa1A5eroNg98jh1qYgQm2yNsh';
if (!contract || !dao) {
  console.error('Set COVAUNT_WORK_ACCOUNT and COVAUNT_WORK_DAO to the deployed Work account and existing Sputnik DAO.');
  process.exit(2);
}

async function call(method, params) {
  const response = await fetch(rpc, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 'covaunt-work-audit', method, params }),
  });
  const json = await response.json();
  if (json.error) throw new Error(JSON.stringify(json.error));
  return json.result;
}

async function view(method, args = {}) {
  const result = await call('query', {
    request_type: 'call_function',
    account_id: contract,
    method_name: method,
    args_base64: Buffer.from(JSON.stringify(args)).toString('base64'),
    finality: 'final',
  });
  return JSON.parse(Buffer.from(result.result).toString('utf8'));
}

try {
  const [summary, account, keys, code] = await Promise.all([
    view('get_summary'),
    call('query', { request_type: 'view_account', account_id: contract, finality: 'final' }),
    call('query', { request_type: 'view_access_key_list', account_id: contract, finality: 'final' }),
    call('query', { request_type: 'view_code', account_id: contract, finality: 'final' }),
  ]);
  const codeHash = code.hash || code.code_hash;
  const storageStake = BigInt(account.storage_usage) * 10_000_000_000_000_000_000n;
  const minimumReserve = 1_000_000_000_000_000_000_000_000n;
  const liabilities = BigInt(summary.available_budget) + BigInt(summary.pending_rewards) + BigInt(summary.pending_refunds);
  const estimatedLiquid = BigInt(account.amount) - storageStake;
  const result = {
    network: 'testnet',
    contract,
    dao,
    code_hash: codeHash,
    code_hash_matches_expected: codeHash === expectedCodeHash,
    account_balance_yocto: String(account.amount),
    storage_usage_bytes: account.storage_usage,
    estimated_storage_staked_yocto: String(storageStake),
    estimated_liquid_yocto: String(estimatedLiquid),
    minimum_storage_reserve_yocto: String(minimumReserve),
    estimated_reward_liabilities_yocto: String(liabilities),
    estimated_liabilities_backed: estimatedLiquid >= minimumReserve + liabilities,
    dao_matches_initializer: summary.dao_id === dao,
    accounting_balanced: summary.is_balanced,
    summary,
    access_keys: keys.keys.map((key) => ({ public_key: key.public_key, permission: key.access_key.permission })),
  };
  console.log(JSON.stringify(result, null, 2));
  if (!result.code_hash_matches_expected || !result.dao_matches_initializer || !result.accounting_balanced || !result.estimated_liabilities_backed) {
    console.error('Work contract identity, accounting, DAO binding or estimated solvency check failed.');
    process.exitCode = 1;
  }
} catch (error) {
  console.error(`WORK AUDIT FAILED: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
}
