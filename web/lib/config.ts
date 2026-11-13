export const CONFIG = Object.freeze({
  network: 'testnet' as const,
  rpc: process.env.NEXT_PUBLIC_NEAR_RPC || 'https://rpc.testnet.near.org',
  contractId: process.env.NEXT_PUBLIC_COVAUNT_CONTRACT || 'vault.covauntops26.testnet',
  daoId: process.env.NEXT_PUBLIC_COVAUNT_DAO || 'covaunt26.sputnikv2.testnet',
  workContractId: process.env.NEXT_PUBLIC_COVAUNT_WORK_CONTRACT || '',
  nearSocialApi: process.env.NEXT_PUBLIC_NEAR_SOCIAL_API || 'https://kv.main.fastnear.com',
  explorer: process.env.NEXT_PUBLIC_NEAR_EXPLORER || 'https://explorer.testnet.near.org',
  codeHash: 'B8LetBV7jQjzL8yPjkLbvy73NALaUpAn86FVsBqTjE9u',
  appName: 'COVAUNT',
});

export function explorerTx(hash: string) {
  return `${CONFIG.explorer}/transactions/${encodeURIComponent(hash)}`;
}

export function explorerAccount(accountId: string) {
  return `${CONFIG.explorer}/accounts/${encodeURIComponent(accountId)}`;
}
