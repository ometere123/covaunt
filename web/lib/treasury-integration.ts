export type TreasuryIntegrationBoundary = {
  provider: 'Trezu';
  status: 'not-integrated';
  network: 'mainnet-oriented';
  compatibility: 'unverified';
  reason: string;
};

// This boundary is deliberately descriptive. It prevents a link or a label from
// being mistaken for an adapter that can execute proposals or move funds.
export const trezuBoundary: TreasuryIntegrationBoundary = Object.freeze({
  provider: 'Trezu',
  status: 'not-integrated',
  network: 'mainnet-oriented',
  compatibility: 'unverified',
  reason: 'The existing COVAUNT Sputnik testnet DAO has no verified Trezu adapter or execution path.',
});
