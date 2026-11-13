import { YOCTO } from './format';
import type { Contribution, Ledger, Quote, Summary } from './types';

const summary: Summary = {
  name: 'COVAUNT',
  dao_id: 'covaunt26.sputnikv2.testnet',
  reserve: (BigInt(5) * YOCTO).toString(),
  total_deposited: (BigInt(18) * YOCTO).toString(),
  total_paid: '0',
  total_refunded: '0',
  available: (BigInt(18) * YOCTO).toString(),
  pending_spend: '0',
  pending_refund: '0',
  contributions: 3,
  spends: 0,
  is_balanced: true,
};

export const PREVIEW_CONTRIBUTIONS: Contribution[] = [
  { id: 0, donor: 'atlas.testnet', principal: (BigInt(8) * YOCTO).toString(), available: (BigInt(8) * YOCTO).toString(), pending_spend: '0', pending_refund: '0', paid: '0', refunded: '0', allowed_purposes: 1, recipients: ['school.testnet'], created_at_ns: '1760000000000000000', withdraw_after_ns: '4760000000000000000', note: 'A promise to learning' },
  { id: 1, donor: 'mira.testnet', principal: (BigInt(6) * YOCTO).toString(), available: (BigInt(6) * YOCTO).toString(), pending_spend: '0', pending_refund: '0', paid: '0', refunded: '0', allowed_purposes: 2, recipients: ['clinic.testnet'], created_at_ns: '1760000000000000000', withdraw_after_ns: '4760000000000000000', note: 'For urgent care' },
  { id: 2, donor: 'solace.testnet', principal: (BigInt(4) * YOCTO).toString(), available: (BigInt(4) * YOCTO).toString(), pending_spend: '0', pending_refund: '0', paid: '0', refunded: '0', allowed_purposes: 3, recipients: ['clinic.testnet', 'school.testnet'], created_at_ns: '1760000000000000000', withdraw_after_ns: '4760000000000000000', note: 'Where the need is greatest' },
];

export const PREVIEW_LEDGER: Ledger = { summary, contributions: PREVIEW_CONTRIBUTIONS, spends: [] };

export const PREVIEW_QUOTE: Quote = {
  permitted: true,
  requested: (BigInt(9) * YOCTO).toString(),
  shortfall: '0',
  allocations: [
    { contribution_id: 1, amount: (BigInt(6) * YOCTO).toString() },
    { contribution_id: 2, amount: (BigInt(3) * YOCTO).toString() },
  ],
  reason: 'Illustrative preview only. A live contract quote is required before a transaction.',
};
