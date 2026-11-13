export type SpendStatus = 'InFlight' | 'Settled' | 'Failed';

export type Contribution = {
  id: number;
  donor: string;
  principal: string;
  available: string;
  pending_spend: string;
  pending_refund: string;
  paid: string;
  refunded: string;
  allowed_purposes: number;
  recipients: string[];
  created_at_ns: string;
  withdraw_after_ns: string;
  note: string;
};

export type Allocation = { contribution_id: number; amount: string };

export type Spend = {
  id: string;
  recipient: string;
  purpose: number;
  amount: string;
  title: string;
  reference: string;
  allocations: Allocation[];
  created_at_ns: string;
  completed_at_ns: string | null;
  status: SpendStatus;
};

export type Summary = {
  name: string;
  dao_id: string;
  reserve: string;
  total_deposited: string;
  total_paid: string;
  total_refunded: string;
  available: string;
  pending_spend: string;
  pending_refund: string;
  contributions: number;
  spends: number;
  is_balanced: boolean;
};

export type Quote = {
  permitted: boolean;
  requested: string;
  shortfall: string;
  allocations: Allocation[];
  reason: string;
};

export type DaoRole = {
  name: string;
  kind: string | { Group?: string[] } | { Everyone?: null };
  permissions: string[];
  vote_policy?: unknown;
};

export type DaoPolicy = {
  roles: DaoRole[];
  default_vote_policy?: { weight_kind?: string; quorum?: string; threshold?: unknown };
  proposal_bond: string;
  proposal_period: string;
};

export type DaoProposal = {
  id: number;
  proposer: string;
  description: string;
  kind: { FunctionCall?: { receiver_id: string; actions: DaoAction[] } };
  status: string;
  votes?: Record<string, string>;
  vote_counts?: number[];
  submission_time?: string;
};

export type DaoAction = {
  method_name: string;
  args: string;
  deposit: string;
  gas: string;
};

export type Ledger = { summary: Summary; contributions: Contribution[]; spends: Spend[] };

export type Snapshot = {
  mode: 'live' | 'preview';
  ledger: Ledger | null;
  policy: DaoPolicy | null;
  proposals: DaoProposal[];
  error: string | null;
};
