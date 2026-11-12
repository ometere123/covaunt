// Replace these values only after real testnet deployment.
// No secrets or wallet seed phrases belong in frontend configuration.
export const CONFIG = Object.freeze({
  network: 'testnet',
  rpc: 'https://rpc.testnet.near.org',
  contractId: '',
  daoId: '',
  daoProposalBondNear: '1', // VERIFY from DAO's live `get_policy` before enabling proposals
  explorer: 'https://testnet.nearblocks.io',
  appName: 'COVAUNT',
});
