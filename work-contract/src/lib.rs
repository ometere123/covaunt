//! COVAUNT Work & Trust.
//!
//! This contract is intentionally separate from the deployed consent-bound vault.
//! It escrows only task-specific reward capital attached by the task creator. It
//! cannot call the vault, read donor balances, or withdraw existing COVAUNT funds.
//! Reputation is derived only from callback-settled work rewards.

use near_sdk::borsh::{BorshDeserialize, BorshSerialize};
use near_sdk::collections::{LookupMap, Vector};
use near_sdk::json_types::{U128, U64};
use near_sdk::serde::{Deserialize, Serialize};
use near_sdk::{env, ext_contract, near, require, AccountId, BorshStorageKey, Gas, NearToken, PanicOnDefault, Promise};

const YOCTO: u128 = 1_000_000_000_000_000_000_000_000;
const MIN_STORAGE_RESERVE: u128 = YOCTO;
const MIN_TASK_BUDGET: u128 = YOCTO / 100;
const MIN_TASK_LEAD_NS: u64 = 60_000_000_000;
const MAX_TASKS: u64 = 1_024;
const MAX_SUBMISSIONS: u64 = 2_048;
const MAX_ELIGIBILITY: usize = 32;
const MAX_TITLE_BYTES: usize = 120;
const MAX_PURPOSE_BYTES: usize = 240;
const MAX_EVIDENCE_BYTES: usize = 1_024;
const MAX_NOTE_BYTES: usize = 500;
const MAX_PAGE_LIMIT: u64 = 50;
const MAX_PAYOUT_ATTEMPTS: u32 = 8;
const MAX_PAYOUTS: u64 = 8_192;
const MAX_SMALL_REWARD: u128 = YOCTO;
const MAX_MEDIUM_REWARD: u128 = 10 * YOCTO;
const MAX_LARGE_REWARD: u128 = 100 * YOCTO;
const GAS_CALLBACK: Gas = Gas::from_tgas(30);

#[derive(BorshStorageKey, BorshSerialize)]
#[borsh(crate = "near_sdk::borsh")]
enum Keys {
    Tasks,
    Submissions,
    Payouts,
    PayoutKeys,
    Mandates,
    Contributors,
}

#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize, Clone, Copy, Debug, PartialEq, Eq)]
#[borsh(crate = "near_sdk::borsh")]
#[serde(crate = "near_sdk::serde")]
pub enum TaskStatus {
    Open,
    Claimed,
    Submitted,
    Verified,
    Rejected,
    Settled,
    Closed,
}

#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize, Clone, Copy, Debug, PartialEq, Eq)]
#[borsh(crate = "near_sdk::borsh")]
#[serde(crate = "near_sdk::serde")]
pub enum RewardTier {
    Small,
    Medium,
    Large,
}

#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize, Clone, Copy, Debug, PartialEq, Eq)]
#[borsh(crate = "near_sdk::borsh")]
#[serde(crate = "near_sdk::serde")]
pub enum SubmissionStatus {
    Pending,
    Verified,
    Rejected,
}

#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize, Clone, Copy, Debug, PartialEq, Eq)]
#[borsh(crate = "near_sdk::borsh")]
#[serde(crate = "near_sdk::serde")]
pub enum DisputeStatus {
    Open,
    Upheld,
    Dismissed,
}

#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize, Clone, Copy, Debug, PartialEq, Eq)]
#[borsh(crate = "near_sdk::borsh")]
#[serde(crate = "near_sdk::serde")]
pub enum PayoutStatus {
    InFlight,
    Settled,
    Failed,
}

#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize, Clone)]
#[borsh(crate = "near_sdk::borsh")]
#[serde(crate = "near_sdk::serde")]
pub struct Dispute {
    pub raised_by: AccountId,
    pub reason: String,
    pub opened_at_ns: u64,
    pub status: DisputeStatus,
    pub resolved_by: Option<AccountId>,
    pub resolution: Option<String>,
    pub resolved_at_ns: Option<u64>,
}

#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize, Clone)]
#[borsh(crate = "near_sdk::borsh")]
#[serde(crate = "near_sdk::serde")]
pub struct Task {
    pub id: u64,
    pub creator: AccountId,
    pub title: String,
    pub purpose: String,
    pub budget: u128,
    pub available: u128,
    pub pending_reward: u128,
    pub pending_refund: u128,
    pub paid: u128,
    pub refunded: u128,
    pub deadline_ns: u64,
    pub eligibility: Vec<AccountId>,
    pub verifier: AccountId,
    pub approver: Option<AccountId>,
    pub tier: RewardTier,
    pub reward_amount: u128,
    pub status: TaskStatus,
    pub claimant: Option<AccountId>,
    pub submission_id: Option<u64>,
    pub created_at_ns: u64,
    pub verified_at_ns: Option<u64>,
    pub closed_at_ns: Option<u64>,
    pub dispute: Option<Dispute>,
}

#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize, Clone)]
#[borsh(crate = "near_sdk::borsh")]
#[serde(crate = "near_sdk::serde")]
pub struct Submission {
    pub id: u64,
    pub task_id: u64,
    pub worker: AccountId,
    pub evidence_uri: String,
    pub evidence_hash: String,
    pub submitted_at_ns: u64,
    pub status: SubmissionStatus,
    pub verifier_note: Option<String>,
}

#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize, Clone)]
#[borsh(crate = "near_sdk::borsh")]
#[serde(crate = "near_sdk::serde")]
pub struct Payout {
    pub id: u64,
    pub task_id: u64,
    pub submission_id: u64,
    pub worker: AccountId,
    pub tier: RewardTier,
    pub amount: u128,
    pub status: PayoutStatus,
    pub attempt: u32,
    pub created_at_ns: u64,
    pub completed_at_ns: Option<u64>,
}

#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize, Clone)]
#[borsh(crate = "near_sdk::borsh")]
#[serde(crate = "near_sdk::serde")]
pub struct ContributorStats {
    pub account: AccountId,
    pub verified_tasks: u64,
    pub settled_tasks: u64,
    pub rewards_paid: u128,
    pub reputation_points: u64,
    pub last_settled_at_ns: Option<u64>,
}

#[derive(Serialize)]
#[serde(crate = "near_sdk::serde")]
pub struct DisputeView {
    pub raised_by: AccountId,
    pub reason: String,
    pub opened_at_ns: U64,
    pub status: DisputeStatus,
    pub resolved_by: Option<AccountId>,
    pub resolution: Option<String>,
    pub resolved_at_ns: Option<U64>,
}

impl From<Dispute> for DisputeView {
    fn from(value: Dispute) -> Self {
        Self {
            raised_by: value.raised_by,
            reason: value.reason,
            opened_at_ns: U64(value.opened_at_ns),
            status: value.status,
            resolved_by: value.resolved_by,
            resolution: value.resolution,
            resolved_at_ns: value.resolved_at_ns.map(U64),
        }
    }
}

#[derive(Serialize)]
#[serde(crate = "near_sdk::serde")]
pub struct TaskView {
    pub id: u64,
    pub creator: AccountId,
    pub title: String,
    pub purpose: String,
    pub budget: U128,
    pub available: U128,
    pub pending_reward: U128,
    pub pending_refund: U128,
    pub paid: U128,
    pub refunded: U128,
    pub deadline_ns: U64,
    pub eligibility: Vec<AccountId>,
    pub verifier: AccountId,
    pub approver: Option<AccountId>,
    pub tier: RewardTier,
    pub reward_amount: U128,
    pub status: TaskStatus,
    pub claimant: Option<AccountId>,
    pub submission_id: Option<u64>,
    pub created_at_ns: U64,
    pub verified_at_ns: Option<U64>,
    pub closed_at_ns: Option<U64>,
    pub dispute: Option<DisputeView>,
}

impl From<Task> for TaskView {
    fn from(value: Task) -> Self {
        Self {
            id: value.id,
            creator: value.creator,
            title: value.title,
            purpose: value.purpose,
            budget: U128(value.budget),
            available: U128(value.available),
            pending_reward: U128(value.pending_reward),
            pending_refund: U128(value.pending_refund),
            paid: U128(value.paid),
            refunded: U128(value.refunded),
            deadline_ns: U64(value.deadline_ns),
            eligibility: value.eligibility,
            verifier: value.verifier,
            approver: value.approver,
            tier: value.tier,
            reward_amount: U128(value.reward_amount),
            status: value.status,
            claimant: value.claimant,
            submission_id: value.submission_id,
            created_at_ns: U64(value.created_at_ns),
            verified_at_ns: value.verified_at_ns.map(U64),
            closed_at_ns: value.closed_at_ns.map(U64),
            dispute: value.dispute.map(DisputeView::from),
        }
    }
}

#[derive(Serialize)]
#[serde(crate = "near_sdk::serde")]
pub struct SubmissionView {
    pub id: u64,
    pub task_id: u64,
    pub worker: AccountId,
    pub evidence_uri: String,
    pub evidence_hash: String,
    pub submitted_at_ns: U64,
    pub status: SubmissionStatus,
    pub verifier_note: Option<String>,
}

impl From<Submission> for SubmissionView {
    fn from(value: Submission) -> Self {
        Self {
            id: value.id,
            task_id: value.task_id,
            worker: value.worker,
            evidence_uri: value.evidence_uri,
            evidence_hash: value.evidence_hash,
            submitted_at_ns: U64(value.submitted_at_ns),
            status: value.status,
            verifier_note: value.verifier_note,
        }
    }
}

#[derive(Serialize)]
#[serde(crate = "near_sdk::serde")]
pub struct PayoutView {
    pub id: u64,
    pub task_id: u64,
    pub submission_id: u64,
    pub worker: AccountId,
    pub tier: RewardTier,
    pub amount: U128,
    pub status: PayoutStatus,
    pub attempt: u32,
    pub created_at_ns: U64,
    pub completed_at_ns: Option<U64>,
}

impl From<Payout> for PayoutView {
    fn from(value: Payout) -> Self {
        Self {
            id: value.id,
            task_id: value.task_id,
            submission_id: value.submission_id,
            worker: value.worker,
            tier: value.tier,
            amount: U128(value.amount),
            status: value.status,
            attempt: value.attempt,
            created_at_ns: U64(value.created_at_ns),
            completed_at_ns: value.completed_at_ns.map(U64),
        }
    }
}

#[derive(Serialize)]
#[serde(crate = "near_sdk::serde")]
pub struct ContributorView {
    pub account: AccountId,
    pub verified_tasks: u64,
    pub settled_tasks: u64,
    pub rewards_paid: U128,
    pub reputation_points: u64,
    pub last_settled_at_ns: Option<U64>,
}

impl From<ContributorStats> for ContributorView {
    fn from(value: ContributorStats) -> Self {
        Self {
            account: value.account,
            verified_tasks: value.verified_tasks,
            settled_tasks: value.settled_tasks,
            rewards_paid: U128(value.rewards_paid),
            reputation_points: value.reputation_points,
            last_settled_at_ns: value.last_settled_at_ns.map(U64),
        }
    }
}

#[derive(Serialize)]
#[serde(crate = "near_sdk::serde")]
pub struct WorkSummary {
    pub name: String,
    pub dao_id: AccountId,
    pub tasks: u64,
    pub total_budget: U128,
    pub total_paid: U128,
    pub total_refunded: U128,
    pub available_budget: U128,
    pub pending_rewards: U128,
    pub pending_refunds: U128,
    pub contributors: u64,
    pub is_balanced: bool,
}

#[ext_contract(ext_self)]
#[allow(dead_code)]
trait WorkCallbacks {
    fn on_reward_payout(&mut self, payout_id: u64) -> bool;
    fn on_budget_refund(&mut self, task_id: u64, amount: U128) -> bool;
}

#[near(contract_state)]
#[derive(PanicOnDefault)]
pub struct CovauntWork {
    name: String,
    dao_id: AccountId,
    storage_reserve: u128,
    tasks: Vector<Task>,
    submissions: Vector<Submission>,
    payouts: Vector<Payout>,
    payout_keys: LookupMap<String, u64>,
    mandates: LookupMap<String, bool>,
    contributors: LookupMap<AccountId, ContributorStats>,
    total_budget: u128,
    total_paid: u128,
    total_refunded: u128,
    total_available: u128,
    total_pending_rewards: u128,
    total_pending_refunds: u128,
    contributor_count: u64,
}

#[near]
impl CovauntWork {
    /// The DAO controls only the large reward tier and dispute resolution.
    /// Task budgets are attached to individual tasks and never come from the vault.
    #[init]
    #[payable]
    pub fn new(dao_id: AccountId, name: String) -> Self {
        require!(env::attached_deposit().as_yoctonear() >= MIN_STORAGE_RESERVE, "ERR_STORAGE_RESERVE");
        require!(!name.trim().is_empty() && name.as_bytes().len() <= MAX_TITLE_BYTES, "ERR_NAME");
        require!(dao_id != env::current_account_id(), "ERR_DAO_SAME_AS_CONTRACT");
        Self {
            name,
            dao_id,
            storage_reserve: env::attached_deposit().as_yoctonear(),
            tasks: Vector::new(Keys::Tasks),
            submissions: Vector::new(Keys::Submissions),
            payouts: Vector::new(Keys::Payouts),
            payout_keys: LookupMap::new(Keys::PayoutKeys),
            mandates: LookupMap::new(Keys::Mandates),
            contributors: LookupMap::new(Keys::Contributors),
            total_budget: 0,
            total_paid: 0,
            total_refunded: 0,
            total_available: 0,
            total_pending_rewards: 0,
            total_pending_refunds: 0,
            contributor_count: 0,
        }
    }

    /// Create one funded task. The attached deposit is the task's isolated reward budget.
    #[payable]
    pub fn create_task(
        &mut self,
        title: String,
        purpose: String,
        deadline_ns: U64,
        eligibility: Vec<AccountId>,
        verifier: AccountId,
        approver: Option<AccountId>,
        tier: RewardTier,
        reward_amount: U128,
    ) -> u64 {
        let budget = env::attached_deposit().as_yoctonear();
        let now = env::block_timestamp();
        require!(budget >= MIN_TASK_BUDGET, "ERR_TASK_BUDGET");
        require!(self.tasks.len() < MAX_TASKS, "ERR_TASK_CAPACITY");
        require!(!title.trim().is_empty() && title.as_bytes().len() <= MAX_TITLE_BYTES, "ERR_TITLE");
        require!(!purpose.trim().is_empty() && purpose.as_bytes().len() <= MAX_PURPOSE_BYTES, "ERR_PURPOSE");
        require!(deadline_ns.0 >= now.checked_add(MIN_TASK_LEAD_NS).expect("ERR_TIMESTAMP"), "ERR_DEADLINE");
        require!(eligibility.len() <= MAX_ELIGIBILITY, "ERR_ELIGIBILITY_CAPACITY");
        let mut unique = eligibility.clone();
        unique.sort();
        unique.dedup();
        require!(unique.len() == eligibility.len(), "ERR_DUP_ELIGIBILITY");
        require!(verifier != env::current_account_id(), "ERR_VERIFIER_CONTRACT");
        let amount = reward_amount.0;
        require!(amount > 0 && amount <= budget, "ERR_REWARD_AMOUNT");
        match tier {
            RewardTier::Small => require!(amount <= MAX_SMALL_REWARD, "ERR_SMALL_CAP"),
            RewardTier::Medium => {
                require!(approver.is_some(), "ERR_APPROVER_REQUIRED");
                require!(amount <= MAX_MEDIUM_REWARD, "ERR_MEDIUM_CAP");
            }
            RewardTier::Large => require!(amount <= MAX_LARGE_REWARD, "ERR_LARGE_CAP"),
        }
        let id = self.tasks.len();
        let task = Task {
            id,
            creator: env::predecessor_account_id(),
            title,
            purpose,
            budget,
            available: budget,
            pending_reward: 0,
            pending_refund: 0,
            paid: 0,
            refunded: 0,
            deadline_ns: deadline_ns.0,
            eligibility: unique,
            verifier,
            approver: if matches!(tier, RewardTier::Medium) { approver } else { None },
            tier,
            reward_amount: amount,
            status: TaskStatus::Open,
            claimant: None,
            submission_id: None,
            created_at_ns: now,
            verified_at_ns: None,
            closed_at_ns: None,
            dispute: None,
        };
        self.tasks.push(&task);
        self.total_budget = self.total_budget.checked_add(budget).expect("ERR_OVERFLOW");
        self.total_available = self.total_available.checked_add(budget).expect("ERR_OVERFLOW");
        self.assert_solvency();
        event("task_created", near_sdk::serde_json::json!({"task_id": id, "creator": task.creator, "budget": budget.to_string()}));
        id
    }

    /// Claiming is a single-winner transition and cannot be repeated by another account.
    pub fn claim_task(&mut self, task_id: u64) {
        let mut task = self.task(task_id);
        require!(task.status == TaskStatus::Open, "ERR_TASK_NOT_OPEN");
        require!(env::block_timestamp() <= task.deadline_ns, "ERR_TASK_EXPIRED");
        let claimant = env::predecessor_account_id();
        require!(task.eligibility.is_empty() || task.eligibility.contains(&claimant), "ERR_NOT_ELIGIBLE");
        task.claimant = Some(claimant.clone());
        task.status = TaskStatus::Claimed;
        self.tasks.replace(task_id, &task);
        event("task_claimed", near_sdk::serde_json::json!({"task_id": task_id, "worker": claimant}));
    }

    /// The named claimant submits a bounded evidence reference and optional hash.
    pub fn submit_completion(&mut self, task_id: u64, evidence_uri: String, evidence_hash: String) -> u64 {
        let mut task = self.task(task_id);
        require!(task.status == TaskStatus::Claimed, "ERR_TASK_NOT_CLAIMED");
        require!(env::block_timestamp() <= task.deadline_ns, "ERR_TASK_EXPIRED");
        let worker = env::predecessor_account_id();
        require!(task.claimant.as_ref() == Some(&worker), "ERR_NOT_CLAIMANT");
        require!(task.submission_id.is_none(), "ERR_DUP_SUBMISSION");
        require!(!evidence_uri.trim().is_empty() && evidence_uri.as_bytes().len() <= MAX_EVIDENCE_BYTES, "ERR_EVIDENCE");
        require!(evidence_hash.as_bytes().len() <= MAX_EVIDENCE_BYTES, "ERR_EVIDENCE_HASH");
        require!(self.submissions.len() < MAX_SUBMISSIONS, "ERR_SUBMISSION_CAPACITY");
        let id = self.submissions.len();
        let submission = Submission {
            id,
            task_id,
            worker,
            evidence_uri,
            evidence_hash,
            submitted_at_ns: env::block_timestamp(),
            status: SubmissionStatus::Pending,
            verifier_note: None,
        };
        self.submissions.push(&submission);
        task.submission_id = Some(id);
        task.status = TaskStatus::Submitted;
        self.tasks.replace(task_id, &task);
        event("completion_submitted", near_sdk::serde_json::json!({"task_id": task_id, "submission_id": id}));
        id
    }

    /// The configured verifier is the only account that can authorize completion.
    /// Small rewards reserve and start payment immediately after this authorization.
    pub fn verify_submission(&mut self, task_id: u64, approved: bool, note: String) -> Option<Promise> {
        require!(note.as_bytes().len() <= MAX_NOTE_BYTES, "ERR_NOTE");
        let mut task = self.task(task_id);
        require!(env::predecessor_account_id() == task.verifier, "ERR_VERIFIER_ONLY");
        require!(task.status == TaskStatus::Submitted, "ERR_SUBMISSION_STATE");
        require!(task.dispute.is_none(), "ERR_DISPUTE_OPEN");
        let submission_id = task.submission_id.expect("ERR_SUBMISSION");
        let mut submission = self.submission(submission_id);
        require!(submission.status == SubmissionStatus::Pending, "ERR_SUBMISSION_REPLAY");
        submission.verifier_note = if note.is_empty() { None } else { Some(note) };
        if !approved {
            submission.status = SubmissionStatus::Rejected;
            task.status = TaskStatus::Rejected;
            self.submissions.replace(submission_id, &submission);
            self.tasks.replace(task_id, &task);
            event("completion_rejected", near_sdk::serde_json::json!({"task_id": task_id, "submission_id": submission_id}));
            return None;
        }
        submission.status = SubmissionStatus::Verified;
        task.status = TaskStatus::Verified;
        task.verified_at_ns = Some(env::block_timestamp());
        self.submissions.replace(submission_id, &submission);
        self.tasks.replace(task_id, &task);
        event("completion_verified", near_sdk::serde_json::json!({"task_id": task_id, "submission_id": submission_id, "tier": tier_name(&task.tier)}));
        self.bump_verified(task.claimant.as_ref().expect("ERR_CLAIMANT").clone());
        if task.tier == RewardTier::Small {
            Some(self.reserve_reward(task_id, submission_id))
        } else {
            None
        }
    }

    /// A single configured approver may authorize a medium reward after verification.
    pub fn approve_medium_reward(&mut self, task_id: u64) -> Promise {
        let task = self.task(task_id);
        require!(task.tier == RewardTier::Medium, "ERR_WRONG_TIER");
        require!(task.approver.as_ref() == Some(&env::predecessor_account_id()), "ERR_APPROVER_ONLY");
        require!(task.status == TaskStatus::Verified, "ERR_NOT_VERIFIED");
        require!(task.dispute.is_none(), "ERR_DISPUTE_OPEN");
        let submission_id = task.submission_id.expect("ERR_SUBMISSION");
        self.reserve_reward(task_id, submission_id)
    }

    /// The existing Sputnik DAO may authorize only the large tier, by predecessor identity.
    /// mandate_id is a replay-protected governance identifier, not a wallet-supplied bypass.
    pub fn execute_large_reward(&mut self, task_id: u64, mandate_id: String) -> Promise {
        require!(env::predecessor_account_id() == self.dao_id, "ERR_DAO_ONLY");
        require!(mandate_id.as_bytes().len() >= 8 && mandate_id.as_bytes().len() <= 96, "ERR_MANDATE_ID");
        require!(self.mandates.get(&mandate_id).is_none(), "ERR_MANDATE_REPLAY");
        let task = self.task(task_id);
        require!(task.tier == RewardTier::Large, "ERR_WRONG_TIER");
        require!(task.status == TaskStatus::Verified, "ERR_NOT_VERIFIED");
        require!(task.dispute.is_none(), "ERR_DISPUTE_OPEN");
        let submission_id = task.submission_id.expect("ERR_SUBMISSION");
        self.mandates.insert(&mandate_id, &true);
        self.reserve_reward(task_id, submission_id)
    }

    /// Retry a failed automatic small payout without changing the verified submission.
    pub fn retry_small_reward(&mut self, task_id: u64) -> Promise {
        let task = self.task(task_id);
        require!(task.tier == RewardTier::Small, "ERR_WRONG_TIER");
        require!(env::predecessor_account_id() == task.verifier, "ERR_VERIFIER_ONLY");
        require!(task.status == TaskStatus::Verified, "ERR_NOT_VERIFIED");
        require!(task.dispute.is_none(), "ERR_DISPUTE_OPEN");
        let submission_id = task.submission_id.expect("ERR_SUBMISSION");
        let key = payout_key(task_id, &task.tier);
        let current_id = self.payout_keys.get(&key).expect("ERR_NO_FAILED_PAYOUT");
        require!(self.payouts.get(current_id).expect("ERR_PAYOUT").status == PayoutStatus::Failed, "ERR_PAYOUT_NOT_FAILED");
        self.reserve_reward(task_id, submission_id)
    }

    /// A claimant or task creator may open one dispute. A DAO resolves it.
    pub fn raise_dispute(&mut self, task_id: u64, reason: String) {
        let mut task = self.task(task_id);
        require!(task.status != TaskStatus::Closed, "ERR_TASK_CLOSED");
        require!(task.pending_reward == 0 && task.pending_refund == 0, "ERR_PENDING_TRANSFER");
        require!(task.dispute.is_none(), "ERR_DISPUTE_REPLAY");
        require!(!reason.trim().is_empty() && reason.as_bytes().len() <= MAX_NOTE_BYTES, "ERR_REASON");
        let caller = env::predecessor_account_id();
        require!(task.creator == caller || task.claimant.as_ref() == Some(&caller), "ERR_DISPUTE_AUTHORITY");
        task.dispute = Some(Dispute {
            raised_by: caller.clone(),
            reason,
            opened_at_ns: env::block_timestamp(),
            status: DisputeStatus::Open,
            resolved_by: None,
            resolution: None,
            resolved_at_ns: None,
        });
        self.tasks.replace(task_id, &task);
        event("dispute_opened", near_sdk::serde_json::json!({"task_id": task_id, "raised_by": caller}));
    }

    /// Dispute resolution is a governance action and cannot move vault funds.
    pub fn resolve_dispute(&mut self, task_id: u64, upheld: bool, note: String) {
        require!(env::predecessor_account_id() == self.dao_id, "ERR_DAO_ONLY");
        require!(note.as_bytes().len() <= MAX_NOTE_BYTES, "ERR_NOTE");
        let mut task = self.task(task_id);
        let mut dispute = task.dispute.take().expect("ERR_NO_DISPUTE");
        require!(dispute.status == DisputeStatus::Open, "ERR_DISPUTE_REPLAY");
        dispute.status = if upheld { DisputeStatus::Upheld } else { DisputeStatus::Dismissed };
        dispute.resolved_by = Some(env::predecessor_account_id());
        dispute.resolution = if note.is_empty() { None } else { Some(note) };
        dispute.resolved_at_ns = Some(env::block_timestamp());
        task.dispute = Some(dispute);
        if upheld && task.status != TaskStatus::Settled {
            task.status = TaskStatus::Rejected;
        }
        self.tasks.replace(task_id, &task);
        event("dispute_resolved", near_sdk::serde_json::json!({"task_id": task_id, "upheld": upheld}));
    }

    /// Close a task after its deadline once it is no longer waiting for a reward decision.
    pub fn close_task(&mut self, task_id: u64) {
        let mut task = self.task(task_id);
        require!(task.creator == env::predecessor_account_id(), "ERR_CREATOR_ONLY");
        require!(env::block_timestamp() > task.deadline_ns, "ERR_TASK_ACTIVE");
        require!(task.pending_reward == 0 && task.pending_refund == 0, "ERR_PENDING_TRANSFER");
        require!(task.dispute.as_ref().map(|d| d.status != DisputeStatus::Open).unwrap_or(true), "ERR_DISPUTE_OPEN");
        require!(task.status != TaskStatus::Verified, "ERR_REWARD_DECISION_PENDING");
        require!(task.status != TaskStatus::Closed, "ERR_TASK_REPLAY");
        task.status = TaskStatus::Closed;
        task.closed_at_ns = Some(env::block_timestamp());
        self.tasks.replace(task_id, &task);
        event("task_closed", near_sdk::serde_json::json!({"task_id": task_id}));
    }

    /// Return unspent task budget to the task creator after close. This is separate from vault refunds.
    pub fn refund_unspent(&mut self, task_id: u64) -> Promise {
        let mut task = self.task(task_id);
        require!(task.creator == env::predecessor_account_id(), "ERR_CREATOR_ONLY");
        require!(task.status == TaskStatus::Closed, "ERR_TASK_CLOSED");
        require!(task.pending_reward == 0 && task.pending_refund == 0, "ERR_PENDING_TRANSFER");
        let amount = task.available;
        require!(amount > 0, "ERR_NO_UNSPENT_BUDGET");
        let creator = task.creator.clone();
        task.available = 0;
        task.pending_refund = amount;
        self.tasks.replace(task_id, &task);
        self.total_available = self.total_available.checked_sub(amount).expect("ERR_ACCOUNTING");
        self.total_pending_refunds = self.total_pending_refunds.checked_add(amount).expect("ERR_OVERFLOW");
        self.assert_solvency();
        Promise::new(creator).transfer(NearToken::from_yoctonear(amount)).then(
            ext_self::ext(env::current_account_id())
                .with_static_gas(GAS_CALLBACK)
                .on_budget_refund(task_id, U128(amount)),
        )
    }

    #[private]
    pub fn on_reward_payout(&mut self, payout_id: u64) -> bool {
        require!(env::predecessor_account_id() == env::current_account_id(), "ERR_CALLBACK");
        let mut payout = self.payout(payout_id);
        require!(payout.status == PayoutStatus::InFlight, "ERR_CALLBACK_REPLAY");
        let mut task = self.task(payout.task_id);
        require!(task.pending_reward == payout.amount, "ERR_CALLBACK_AMOUNT");
        task.pending_reward = 0;
        if promise_succeeded() {
            payout.status = PayoutStatus::Settled;
            payout.completed_at_ns = Some(env::block_timestamp());
            task.paid = task.paid.checked_add(payout.amount).expect("ERR_OVERFLOW");
            task.status = TaskStatus::Settled;
            self.total_pending_rewards = self.total_pending_rewards.checked_sub(payout.amount).expect("ERR_ACCOUNTING");
            self.total_paid = self.total_paid.checked_add(payout.amount).expect("ERR_OVERFLOW");
            self.bump_settled(payout.worker.clone(), payout.amount, &payout.tier);
            event("reward_settled", near_sdk::serde_json::json!({"task_id": payout.task_id, "payout_id": payout_id, "worker": payout.worker, "amount": payout.amount.to_string()}));
            self.payouts.replace(payout_id, &payout);
            self.tasks.replace(task.id, &task);
            self.assert_solvency();
            true
        } else {
            payout.status = PayoutStatus::Failed;
            payout.completed_at_ns = Some(env::block_timestamp());
            task.available = task.available.checked_add(payout.amount).expect("ERR_OVERFLOW");
            self.total_pending_rewards = self.total_pending_rewards.checked_sub(payout.amount).expect("ERR_ACCOUNTING");
            self.total_available = self.total_available.checked_add(payout.amount).expect("ERR_OVERFLOW");
            self.payouts.replace(payout_id, &payout);
            self.tasks.replace(task.id, &task);
            self.assert_solvency();
            event("reward_failed", near_sdk::serde_json::json!({"task_id": payout.task_id, "payout_id": payout_id}));
            false
        }
    }

    #[private]
    pub fn on_budget_refund(&mut self, task_id: u64, amount: U128) -> bool {
        require!(env::predecessor_account_id() == env::current_account_id(), "ERR_CALLBACK");
        let mut task = self.task(task_id);
        require!(task.pending_refund == amount.0, "ERR_CALLBACK_AMOUNT");
        task.pending_refund = 0;
        self.total_pending_refunds = self.total_pending_refunds.checked_sub(amount.0).expect("ERR_ACCOUNTING");
        if promise_succeeded() {
            task.refunded = task.refunded.checked_add(amount.0).expect("ERR_OVERFLOW");
            self.total_refunded = self.total_refunded.checked_add(amount.0).expect("ERR_OVERFLOW");
            self.tasks.replace(task_id, &task);
            self.assert_solvency();
            event("task_budget_refunded", near_sdk::serde_json::json!({"task_id": task_id, "amount": amount.0.to_string()}));
            true
        } else {
            task.available = task.available.checked_add(amount.0).expect("ERR_OVERFLOW");
            self.total_available = self.total_available.checked_add(amount.0).expect("ERR_OVERFLOW");
            self.tasks.replace(task_id, &task);
            self.assert_solvency();
            false
        }
    }

    pub fn get_summary(&self) -> WorkSummary {
        let accounted = self.total_paid
            .checked_add(self.total_refunded)
            .and_then(|value| value.checked_add(self.total_available))
            .and_then(|value| value.checked_add(self.total_pending_rewards))
            .and_then(|value| value.checked_add(self.total_pending_refunds));
        WorkSummary {
            name: self.name.clone(),
            dao_id: self.dao_id.clone(),
            tasks: self.tasks.len(),
            total_budget: U128(self.total_budget),
            total_paid: U128(self.total_paid),
            total_refunded: U128(self.total_refunded),
            available_budget: U128(self.total_available),
            pending_rewards: U128(self.total_pending_rewards),
            pending_refunds: U128(self.total_pending_refunds),
            contributors: self.contributor_count,
            is_balanced: accounted == Some(self.total_budget),
        }
    }

    pub fn get_task(&self, id: u64) -> Option<TaskView> {
        self.tasks.get(id).map(TaskView::from)
    }

    pub fn get_tasks(&self, from_index: Option<u64>, limit: Option<u64>) -> Vec<TaskView> {
        let from = from_index.unwrap_or(0).min(self.tasks.len());
        let limit = limit.unwrap_or(MAX_PAGE_LIMIT).min(MAX_PAGE_LIMIT);
        self.tasks.iter().skip(from as usize).take(limit as usize).map(TaskView::from).collect()
    }

    pub fn get_submission(&self, id: u64) -> Option<SubmissionView> {
        self.submissions.get(id).map(SubmissionView::from)
    }

    pub fn get_payouts(&self, task_id: u64, from_index: Option<u64>, limit: Option<u64>) -> Vec<PayoutView> {
        let from = from_index.unwrap_or(0).min(self.payouts.len());
        let limit = limit.unwrap_or(MAX_PAGE_LIMIT).min(MAX_PAGE_LIMIT);
        self.payouts
            .iter()
            .filter(|payout| payout.task_id == task_id)
            .skip(from as usize)
            .take(limit as usize)
            .map(PayoutView::from)
            .collect()
    }

    pub fn get_contributor(&self, account: AccountId) -> Option<ContributorView> {
        self.contributors.get(&account).map(ContributorView::from)
    }

    fn task(&self, id: u64) -> Task {
        self.tasks.get(id).expect("ERR_TASK_NOT_FOUND")
    }

    fn submission(&self, id: u64) -> Submission {
        self.submissions.get(id).expect("ERR_SUBMISSION_NOT_FOUND")
    }

    fn payout(&self, id: u64) -> Payout {
        self.payouts.get(id).expect("ERR_PAYOUT_NOT_FOUND")
    }

    fn reserve_reward(&mut self, task_id: u64, submission_id: u64) -> Promise {
        let mut task = self.task(task_id);
        require!(task.status == TaskStatus::Verified, "ERR_NOT_VERIFIED");
        require!(task.submission_id == Some(submission_id), "ERR_SUBMISSION_MISMATCH");
        require!(task.dispute.is_none(), "ERR_DISPUTE_OPEN");
        let key = payout_key(task_id, &task.tier);
        let attempt = match self.payout_keys.get(&key) {
            None => 1,
            Some(previous_id) => {
                let previous = self.payout(previous_id);
                require!(previous.status == PayoutStatus::Failed, "ERR_REWARD_REPLAY");
                previous.attempt.checked_add(1).expect("ERR_ATTEMPT_OVERFLOW")
            }
        };
        require!(attempt <= MAX_PAYOUT_ATTEMPTS, "ERR_PAYOUT_ATTEMPTS");
        require!(self.payouts.len() < MAX_PAYOUTS, "ERR_PAYOUT_CAPACITY");
        require!(task.available >= task.reward_amount, "ERR_BUDGET_EXHAUSTED");
        let worker = task.claimant.clone().expect("ERR_CLAIMANT");
        let amount = task.reward_amount;
        task.available = task.available.checked_sub(amount).expect("ERR_ACCOUNTING");
        task.pending_reward = task.pending_reward.checked_add(amount).expect("ERR_OVERFLOW");
        let payout_id = self.payouts.len();
        let payout = Payout {
            id: payout_id,
            task_id,
            submission_id,
            worker: worker.clone(),
            tier: task.tier.clone(),
            amount,
            status: PayoutStatus::InFlight,
            attempt,
            created_at_ns: env::block_timestamp(),
            completed_at_ns: None,
        };
        self.payouts.push(&payout);
        self.payout_keys.insert(&key, &payout_id);
        self.total_available = self.total_available.checked_sub(amount).expect("ERR_ACCOUNTING");
        self.total_pending_rewards = self.total_pending_rewards.checked_add(amount).expect("ERR_OVERFLOW");
        self.tasks.replace(task_id, &task);
        self.assert_solvency();
        event("reward_reserved", near_sdk::serde_json::json!({"task_id": task_id, "payout_id": payout_id, "tier": tier_name(&task.tier), "amount": amount.to_string()}));
        Promise::new(worker).transfer(NearToken::from_yoctonear(amount)).then(
            ext_self::ext(env::current_account_id()).with_static_gas(GAS_CALLBACK).on_reward_payout(payout_id),
        )
    }

    fn bump_verified(&mut self, account: AccountId) {
        let is_new = self.contributors.get(&account).is_none();
        let mut stats = self.contributors.get(&account).unwrap_or_else(|| ContributorStats {
            account: account.clone(), verified_tasks: 0, settled_tasks: 0, rewards_paid: 0, reputation_points: 0, last_settled_at_ns: None,
        });
        stats.verified_tasks = stats.verified_tasks.checked_add(1).expect("ERR_OVERFLOW");
        self.contributors.insert(&account, &stats);
        if is_new {
            self.contributor_count = self.contributor_count.checked_add(1).expect("ERR_OVERFLOW");
        }
    }

    fn bump_settled(&mut self, account: AccountId, amount: u128, tier: &RewardTier) {
        let is_new = self.contributors.get(&account).is_none();
        let mut stats = self.contributors.get(&account).unwrap_or_else(|| ContributorStats {
            account: account.clone(), verified_tasks: 0, settled_tasks: 0, rewards_paid: 0, reputation_points: 0, last_settled_at_ns: None,
        });
        stats.settled_tasks = stats.settled_tasks.checked_add(1).expect("ERR_OVERFLOW");
        stats.rewards_paid = stats.rewards_paid.checked_add(amount).expect("ERR_OVERFLOW");
        stats.reputation_points = stats.reputation_points.checked_add(reputation_for(tier)).expect("ERR_OVERFLOW");
        stats.last_settled_at_ns = Some(env::block_timestamp());
        self.contributors.insert(&account, &stats);
        if is_new {
            self.contributor_count = self.contributor_count.checked_add(1).expect("ERR_OVERFLOW");
        }
    }

    fn assert_solvency(&self) {
        let storage = u128::from(env::storage_usage())
            .checked_mul(env::storage_byte_cost().as_yoctonear())
            .expect("ERR_STORAGE_OVERFLOW");
        let reserved = self.storage_reserve
            .checked_add(self.total_available).expect("ERR_OVERFLOW")
            .checked_add(self.total_pending_rewards).expect("ERR_OVERFLOW")
            .checked_add(self.total_pending_refunds).expect("ERR_OVERFLOW");
        require!(env::account_balance().as_yoctonear() >= storage.checked_add(reserved).expect("ERR_OVERFLOW"), "ERR_SOLVENCY");
    }
}

fn payout_key(task_id: u64, tier: &RewardTier) -> String {
    format!("{}:{}", task_id, tier_name(tier))
}

fn tier_name(tier: &RewardTier) -> &'static str {
    match tier {
        RewardTier::Small => "small",
        RewardTier::Medium => "medium",
        RewardTier::Large => "large",
    }
}

fn reputation_for(tier: &RewardTier) -> u64 {
    match tier {
        RewardTier::Small => 10,
        RewardTier::Medium => 25,
        RewardTier::Large => 50,
    }
}

fn promise_succeeded() -> bool {
    env::promise_result_checked(0, 1_024).is_ok()
}

fn event(kind: &str, data: near_sdk::serde_json::Value) {
    env::log_str(&format!("EVENT_JSON:{}", near_sdk::serde_json::json!({
        "standard": "covaunt-work", "version": "1.0.0", "event": kind, "data": [data]
    })));
}

#[cfg(test)]
mod tests {
    use super::*;
    use near_sdk::test_utils::VMContextBuilder;
    use near_sdk::{testing_env, test_vm_config, RuntimeFeesConfig, PromiseResult};
    use std::collections::HashMap;

    const T: u64 = 1_800_000_000_000_000_000;

    fn id(value: &str) -> AccountId { value.parse().unwrap() }

    fn ctx(caller: &str, deposit: u128, now: u64) -> VMContextBuilder {
        let mut builder = VMContextBuilder::new();
        builder.current_account_id(id("work.testnet"))
            .signer_account_id(id(caller))
            .predecessor_account_id(id(caller))
            .attached_deposit(NearToken::from_yoctonear(deposit))
            .account_balance(NearToken::from_yoctonear(500 * YOCTO))
            .block_timestamp(now);
        builder
    }

    fn setup() -> CovauntWork {
        testing_env!(ctx("creator.testnet", YOCTO, T).build());
        CovauntWork::new(id("dao.testnet"), "COVAUNT Work".into())
    }

    fn create(c: &mut CovauntWork, tier: RewardTier) -> u64 {
        testing_env!(ctx("creator.testnet", 2 * YOCTO, T).build());
        c.create_task(
            "Document a local need".into(), "Community research".into(), U64(T + 3_600_000_000_000),
            vec![id("worker.testnet")], id("verifier.testnet"), Some(id("approver.testnet")), tier, U128(YOCTO / 10),
        )
    }

    fn submit(c: &mut CovauntWork, task_id: u64) -> u64 {
        testing_env!(ctx("worker.testnet", 0, T + 1).build());
        c.claim_task(task_id);
        c.submit_completion(task_id, "ipfs://evidence".into(), "sha256:abc".into())
    }

    fn callback(success: bool) {
        testing_env!(ctx("work.testnet", 0, T + 2).build(), test_vm_config(), RuntimeFeesConfig::test(), HashMap::default(), vec![if success { PromiseResult::Successful(vec![]) } else { PromiseResult::Failed }]);
    }

    #[test]
    fn task_budget_is_separate_and_balanced() {
        let mut contract = setup();
        let task_id = create(&mut contract, RewardTier::Small);
        let task = contract.get_task(task_id).unwrap();
        assert_eq!(task.available.0, 2 * YOCTO);
        assert_eq!(task.reward_amount.0, YOCTO / 10);
        assert!(contract.get_summary().is_balanced);
    }

    #[test]
    #[should_panic(expected = "ERR_NOT_ELIGIBLE")]
    fn only_eligible_account_can_claim() {
        let mut contract = setup();
        let task_id = create(&mut contract, RewardTier::Small);
        testing_env!(ctx("attacker.testnet", 0, T + 1).build());
        contract.claim_task(task_id);
    }

    #[test]
    fn duplicate_claim_and_submission_are_blocked_by_state() {
        let mut contract = setup();
        let task_id = create(&mut contract, RewardTier::Small);
        let submission_id = submit(&mut contract, task_id);
        assert_eq!(submission_id, 0);
        testing_env!(ctx("worker.testnet", 0, T + 2).build());
        assert!(std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| contract.claim_task(task_id))).is_err());
        assert!(std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| contract.submit_completion(task_id, "ipfs://again".into(), "".into()))).is_err());
    }

    #[test]
    fn rejected_completion_is_recorded_without_payment() {
        let mut contract = setup();
        let task_id = create(&mut contract, RewardTier::Small);
        submit(&mut contract, task_id);
        testing_env!(ctx("verifier.testnet", 0, T + 2).build());
        assert!(contract.verify_submission(task_id, false, "Evidence incomplete".into()).is_none());
        assert_eq!(contract.get_task(task_id).unwrap().status, TaskStatus::Rejected);
        assert_eq!(contract.get_summary().total_paid.0, 0);
        assert!(contract.get_summary().is_balanced);
    }

    #[test]
    fn small_reward_requires_verification_and_settles_once() {
        let mut contract = setup();
        let task_id = create(&mut contract, RewardTier::Small);
        submit(&mut contract, task_id);
        testing_env!(ctx("verifier.testnet", 0, T + 2).build());
        assert!(contract.verify_submission(task_id, true, "Verified".into()).is_some());
        assert_eq!(contract.get_task(task_id).unwrap().pending_reward.0, YOCTO / 10);
        callback(true);
        assert!(contract.on_reward_payout(0));
        assert_eq!(contract.get_task(task_id).unwrap().status, TaskStatus::Settled);
        let worker = contract.get_contributor(id("worker.testnet")).unwrap();
        assert_eq!(worker.settled_tasks, 1);
        assert_eq!(worker.reputation_points, 10);
        callback(true);
        assert!(std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| contract.on_reward_payout(0))).is_err());
        assert!(contract.get_summary().is_balanced);
    }

    #[test]
    fn failed_reward_restores_budget_and_retry_uses_new_attempt() {
        let mut contract = setup();
        let task_id = create(&mut contract, RewardTier::Small);
        submit(&mut contract, task_id);
        testing_env!(ctx("verifier.testnet", 0, T + 2).build());
        contract.verify_submission(task_id, true, "Verified".into());
        callback(false);
        assert!(!contract.on_reward_payout(0));
        assert_eq!(contract.get_task(task_id).unwrap().available.0, 2 * YOCTO);
        testing_env!(ctx("verifier.testnet", 0, T + 3).build());
        let _ = contract.retry_small_reward(task_id);
        assert_eq!(contract.get_payouts(task_id, None, None).len(), 2);
        assert_eq!(contract.get_payouts(task_id, None, None)[1].attempt, 2);
        assert!(contract.get_summary().is_balanced);
    }

    #[test]
    #[should_panic(expected = "ERR_APPROVER_ONLY")]
    fn medium_reward_rejects_unconfigured_approver() {
        let mut contract = setup();
        let task_id = create(&mut contract, RewardTier::Medium);
        submit(&mut contract, task_id);
        testing_env!(ctx("verifier.testnet", 0, T + 2).build());
        contract.verify_submission(task_id, true, "Verified".into());
        testing_env!(ctx("attacker.testnet", 0, T + 3).build());
        let _ = contract.approve_medium_reward(task_id);
    }

    #[test]
    fn medium_reward_requires_one_approval() {
        let mut contract = setup();
        let task_id = create(&mut contract, RewardTier::Medium);
        submit(&mut contract, task_id);
        testing_env!(ctx("verifier.testnet", 0, T + 2).build());
        contract.verify_submission(task_id, true, "Verified".into());
        testing_env!(ctx("approver.testnet", 0, T + 3).build());
        let _ = contract.approve_medium_reward(task_id);
        callback(true);
        assert!(contract.on_reward_payout(0));
        assert_eq!(contract.get_task(task_id).unwrap().status, TaskStatus::Settled);
        assert!(contract.get_summary().is_balanced);
    }

    #[test]
    #[should_panic(expected = "ERR_DAO_ONLY")]
    fn large_reward_rejects_direct_wallet_execution() {
        let mut contract = setup();
        let task_id = create(&mut contract, RewardTier::Large);
        submit(&mut contract, task_id);
        testing_env!(ctx("verifier.testnet", 0, T + 2).build());
        contract.verify_submission(task_id, true, "Verified".into());
        testing_env!(ctx("attacker.testnet", 0, T + 3).build());
        let _ = contract.execute_large_reward(task_id, "cvt-large-0001".into());
    }

    #[test]
    fn large_reward_uses_dao_and_rejects_mandate_replay() {
        let mut contract = setup();
        let task_id = create(&mut contract, RewardTier::Large);
        submit(&mut contract, task_id);
        testing_env!(ctx("verifier.testnet", 0, T + 2).build());
        contract.verify_submission(task_id, true, "Verified".into());
        testing_env!(ctx("dao.testnet", 0, T + 3).build());
        let _ = contract.execute_large_reward(task_id, "cvt-large-0001".into());
        callback(false);
        assert!(!contract.on_reward_payout(0));
        testing_env!(ctx("dao.testnet", 0, T + 4).build());
        let _ = contract.execute_large_reward(task_id, "cvt-large-0002".into());
        assert!(std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| contract.execute_large_reward(task_id, "cvt-large-0001".into()))).is_err());
        assert!(contract.get_summary().is_balanced);
    }

    #[test]
    fn dispute_is_recorded_and_dao_can_uphold_it() {
        let mut contract = setup();
        let task_id = create(&mut contract, RewardTier::Medium);
        submit(&mut contract, task_id);
        testing_env!(ctx("verifier.testnet", 0, T + 2).build());
        contract.verify_submission(task_id, true, "Verified".into());
        testing_env!(ctx("worker.testnet", 0, T + 3).build());
        contract.raise_dispute(task_id, "Evidence was misread".into());
        testing_env!(ctx("dao.testnet", 0, T + 4).build());
        contract.resolve_dispute(task_id, true, "Uphold pending review".into());
        let task = contract.get_task(task_id).unwrap();
        assert_eq!(task.status, TaskStatus::Rejected);
        assert_eq!(task.dispute.unwrap().status, DisputeStatus::Upheld);
        assert!(contract.get_summary().is_balanced);
    }

    #[test]
    fn closed_task_can_refund_unspent_budget_with_callback_recovery() {
        let mut contract = setup();
        let task_id = create(&mut contract, RewardTier::Small);
        testing_env!(ctx("creator.testnet", 0, T + 3_600_000_000_001).build());
        contract.close_task(task_id);
        let _ = contract.refund_unspent(task_id);
        assert_eq!(contract.get_task(task_id).unwrap().pending_refund.0, 2 * YOCTO);
        callback(false);
        assert!(!contract.on_budget_refund(task_id, U128(2 * YOCTO)));
        assert_eq!(contract.get_task(task_id).unwrap().available.0, 2 * YOCTO);
        testing_env!(ctx("creator.testnet", 0, T + 3_600_000_000_002).build());
        let _ = contract.refund_unspent(task_id);
        callback(true);
        assert!(contract.on_budget_refund(task_id, U128(2 * YOCTO)));
        assert_eq!(contract.get_task(task_id).unwrap().refunded.0, 2 * YOCTO);
        assert!(contract.get_summary().is_balanced);
    }
}
