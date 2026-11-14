import { CONFIG } from './config';
import { decodeFunctionCallArgs, encodeJsonBase64, view } from './near';
import type { DaoPolicy, DaoProposal } from './types';
import { signCall } from './wallet';

// Verification and reward calls create a native transfer plus a private
// callback. Keep the wallet-side budget at 200 Tgas so the callback path is
// not mistaken for a successful state transition when the action runs out of gas.
export const WORK_GAS = '200000000000000';
const WORK_PAGE_SIZE = 50;

export type WorkTier = 'Small' | 'Medium' | 'Large';
export type WorkTaskStatus = 'Open' | 'Claimed' | 'Submitted' | 'Verified' | 'Rejected' | 'Settled' | 'Closed';
export type SubmissionStatus = 'Pending' | 'Verified' | 'Rejected';
export type PayoutStatus = 'InFlight' | 'Settled' | 'Failed';

export type WorkSummary = {
  name: string;
  dao_id: string;
  tasks: number;
  total_budget: string;
  total_paid: string;
  total_refunded: string;
  available_budget: string;
  pending_rewards: string;
  pending_refunds: string;
  contributors: number;
  is_balanced: boolean;
};

export type WorkDispute = {
  raised_by: string;
  reason: string;
  opened_at_ns: string;
  status: 'Open' | 'Upheld' | 'Dismissed';
  resolved_by: string | null;
  resolution: string | null;
  resolved_at_ns: string | null;
};

export type WorkTask = {
  id: number;
  creator: string;
  title: string;
  purpose: string;
  budget: string;
  available: string;
  pending_reward: string;
  pending_refund: string;
  paid: string;
  refunded: string;
  deadline_ns: string;
  eligibility: string[];
  verifier: string;
  approver: string | null;
  tier: WorkTier;
  reward_amount: string;
  status: WorkTaskStatus;
  claimant: string | null;
  submission_id: number | null;
  created_at_ns: string;
  verified_at_ns: string | null;
  closed_at_ns: string | null;
  dispute: WorkDispute | null;
};

export type WorkSubmission = {
  id: number;
  task_id: number;
  worker: string;
  evidence_uri: string;
  evidence_hash: string;
  submitted_at_ns: string;
  status: SubmissionStatus;
  verifier_note: string | null;
  verified_by: string | null;
  verification_model: string | null;
};

export type WorkPayout = {
  id: number;
  task_id: number;
  submission_id: number;
  worker: string;
  tier: WorkTier;
  amount: string;
  status: PayoutStatus;
  attempt: number;
  created_at_ns: string;
  completed_at_ns: string | null;
};

export type ContributorStats = {
  account: string;
  verified_tasks: number;
  settled_tasks: number;
  rewards_paid: string;
  reputation_points: number;
  last_settled_at_ns: string | null;
  reputation_basis: string;
};

export type WorkDaoProposal = DaoProposal & {
  work_method: 'execute_large_reward' | 'resolve_dispute';
  work_args: Record<string, string | number | boolean>;
};

export type WorkSnapshot = {
  configured: boolean;
  summary: WorkSummary | null;
  tasks: WorkTask[];
};

export function workConfigured() {
  return Boolean(CONFIG.workContractId);
}

function requireWorkContract() {
  if (!CONFIG.workContractId) {
    throw new Error('The separate Work & Trust contract is not configured for this release. No work records are being fabricated.');
  }
  return CONFIG.workContractId;
}

export async function loadWorkSnapshot(options: { allowLive?: boolean } = {}): Promise<WorkSnapshot> {
  if (options.allowLive === false) return { configured: false, summary: null, tasks: [] };
  if (!workConfigured()) return { configured: false, summary: null, tasks: [] };
  const contractId = requireWorkContract();
  const summary = await view<WorkSummary>(contractId, 'get_summary');
  const tasks: WorkTask[] = [];
  for (let from = 0; from < summary.tasks; from += WORK_PAGE_SIZE) {
    const page = await view<WorkTask[]>(contractId, 'get_tasks', { from_index: from, limit: WORK_PAGE_SIZE });
    tasks.push(...page);
    if (page.length < WORK_PAGE_SIZE) break;
  }
  return { configured: true, summary, tasks };
}

export async function loadWorkTask(taskId: number) {
  return view<WorkTask | null>(requireWorkContract(), 'get_task', { id: taskId });
}

export async function loadWorkSubmission(submissionId: number) {
  return view<WorkSubmission | null>(requireWorkContract(), 'get_submission', { id: submissionId });
}

export async function loadWorkPayouts(taskId: number) {
  const payouts: WorkPayout[] = [];
  for (let from = 0; ; from += WORK_PAGE_SIZE) {
    const page = await view<WorkPayout[]>(requireWorkContract(), 'get_payouts', { task_id: taskId, from_index: from, limit: WORK_PAGE_SIZE });
    payouts.push(...page);
    if (page.length < WORK_PAGE_SIZE) break;
  }
  return payouts;
}

export async function loadContributorStats(account: string) {
  return view<ContributorStats | null>(requireWorkContract(), 'get_contributor', { account });
}

export async function workCall(methodName: string, args: Record<string, unknown>, gas = WORK_GAS, deposit = '0') {
  return signCall(requireWorkContract(), methodName, args, gas, deposit);
}

export async function loadWorkDaoPolicy() {
  return view<DaoPolicy>(CONFIG.daoId, 'get_policy');
}

export async function loadWorkDaoProposals(taskId: number): Promise<WorkDaoProposal[]> {
  const workContract = requireWorkContract();
  const lastRaw = await view<number | string>(CONFIG.daoId, 'get_last_proposal_id');
  const last = Number(lastRaw);
  if (!Number.isSafeInteger(last) || last <= 0) return [];
  const from = Math.max(0, last - WORK_PAGE_SIZE);
  const proposals = await view<DaoProposal[]>(CONFIG.daoId, 'get_proposals', {
    from_index: from,
    limit: Math.min(WORK_PAGE_SIZE, last),
  });
  return proposals.flatMap((proposal) => {
    const kind = proposal.kind?.FunctionCall;
    if (kind?.receiver_id !== workContract) return [];
    const action = kind.actions.find((candidate) => candidate.method_name === 'execute_large_reward' || candidate.method_name === 'resolve_dispute');
    if (!action) return [];
    const args = decodeFunctionCallArgs(action.args);
    if (!args || String(args.task_id) !== String(taskId)) return [];
    return [{ ...proposal, work_method: action.method_name as WorkDaoProposal['work_method'], work_args: args as Record<string, string | number | boolean> }];
  });
}

export async function submitWorkDaoProposal(methodName: 'execute_large_reward' | 'resolve_dispute', args: Record<string, unknown>, description: string) {
  const policy = await loadWorkDaoPolicy();
  const proposal = {
    description,
    kind: {
      FunctionCall: {
        receiver_id: requireWorkContract(),
        actions: [{ method_name: methodName, args: encodeJsonBase64(args), deposit: '0', gas: WORK_GAS }],
      },
    },
  };
  return signCall(CONFIG.daoId, 'add_proposal', { proposal }, '160000000000000', policy.proposal_bond);
}

export async function voteOnWorkDaoProposal(proposal: DaoProposal, choice: 'Approve' | 'Reject') {
  return signCall(CONFIG.daoId, 'act_proposal', {
    id: proposal.id,
    action: `Vote${choice}`,
    proposal: proposal.kind,
    memo: `COVAUNT Work council ${choice.toLowerCase()}`,
  }, '300000000000000', '0');
}
