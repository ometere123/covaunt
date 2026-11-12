//! COVAUNT: consent-bound native NEAR escrow. Access-key lockdown is required
//! to preserve the deployed implementation against contract upgrades.
//! Core security property: a DAO vote can never expand a contribution's
//! fixed purpose+recipient permissions. Physical use after receipt is out of scope.

use near_sdk::borsh::{BorshDeserialize, BorshSerialize};
use near_sdk::collections::{LookupMap, Vector};
use near_sdk::json_types::{U128, U64};
use near_sdk::serde::{Deserialize, Serialize};
use near_sdk::{env, ext_contract, near, require, AccountId, BorshStorageKey, Gas, NearToken, PanicOnDefault, Promise};

const YOCTO: u128 = 1_000_000_000_000_000_000_000_000;
const MIN_CONTRIBUTION: u128 = YOCTO / 100;
const MIN_STORAGE_RESERVE: u128 = 5 * YOCTO;
const MIN_LOCK_NS: u64 = 60_000_000_000;
const MAX_CONTRIBUTIONS: u64 = 256;
const MAX_SPENDS: u64 = 1_024;
const STORAGE_MARGIN: u128 = YOCTO / 10;
const MAX_ALLOCATIONS: usize = 24;
const MAX_RECIPIENTS: usize = 8;
const GAS_CALLBACK: Gas = Gas::from_tgas(30);
const PURPOSES_MASK: u8 = 0b0001_1111;

#[derive(BorshStorageKey, BorshSerialize)]
#[borsh(crate = "near_sdk::borsh")]
enum Keys { Contributions, Spends, SpendIndices }

#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize, Clone)]
#[borsh(crate = "near_sdk::borsh")]
#[serde(crate = "near_sdk::serde")]
pub struct Contribution {
    pub id: u64,
    pub donor: AccountId,
    pub principal: u128,
    pub available: u128,
    pub pending_spend: u128,
    pub pending_refund: u128,
    pub paid: u128,
    pub refunded: u128,
    pub allowed_purposes: u8,
    pub recipients: Vec<AccountId>,
    pub created_at_ns: u64,
    pub withdraw_after_ns: u64,
    pub note: String,
}

#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize, Clone)]
#[borsh(crate = "near_sdk::borsh")]
#[serde(crate = "near_sdk::serde")]
pub struct Allocation { pub contribution_id: u64, pub amount: u128 }

#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize, Clone)]
#[borsh(crate = "near_sdk::borsh")]
#[serde(crate = "near_sdk::serde")]
pub enum SpendStatus { InFlight, Settled, Failed }

#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize, Clone)]
#[borsh(crate = "near_sdk::borsh")]
#[serde(crate = "near_sdk::serde")]
pub struct Spend {
    pub id: String,
    pub recipient: AccountId,
    pub purpose: u8,
    pub amount: u128,
    pub title: String,
    pub reference: String,
    pub allocations: Vec<Allocation>,
    pub created_at_ns: u64,
    pub completed_at_ns: Option<u64>,
    pub status: SpendStatus,
}

#[derive(Serialize)]
#[serde(crate = "near_sdk::serde")]
pub struct ContributionView {
    pub id: u64, pub donor: AccountId, pub principal: U128,
    pub available: U128, pub pending_spend: U128, pub pending_refund: U128,
    pub paid: U128, pub refunded: U128, pub allowed_purposes: u8,
    pub recipients: Vec<AccountId>, pub created_at_ns: U64,
    pub withdraw_after_ns: U64, pub note: String,
}
impl From<Contribution> for ContributionView {
    fn from(c: Contribution) -> Self { Self {
        id: c.id, donor: c.donor, principal: U128(c.principal),
        available: U128(c.available), pending_spend: U128(c.pending_spend),
        pending_refund: U128(c.pending_refund), paid: U128(c.paid),
        refunded: U128(c.refunded), allowed_purposes: c.allowed_purposes,
        recipients: c.recipients, created_at_ns: U64(c.created_at_ns),
        withdraw_after_ns: U64(c.withdraw_after_ns), note: c.note,
    } }
}

#[derive(Serialize)]
#[serde(crate = "near_sdk::serde")]
pub struct AllocationView { pub contribution_id: u64, pub amount: U128 }

#[derive(Serialize)]
#[serde(crate = "near_sdk::serde")]
pub struct QuoteView {
    pub permitted: bool, pub requested: U128, pub shortfall: U128,
    pub allocations: Vec<AllocationView>, pub reason: String,
}

#[derive(Serialize)]
#[serde(crate = "near_sdk::serde")]
pub struct SpendView {
    pub id: String, pub recipient: AccountId, pub purpose: u8,
    pub amount: U128, pub title: String, pub reference: String,
    pub allocations: Vec<AllocationView>, pub created_at_ns: U64,
    pub completed_at_ns: Option<U64>, pub status: SpendStatus,
}
impl From<Spend> for SpendView {
    fn from(s: Spend) -> Self { Self {
        id:s.id, recipient:s.recipient, purpose:s.purpose,
        amount:U128(s.amount), title:s.title, reference:s.reference,
        allocations:s.allocations.into_iter().map(|a| AllocationView {
            contribution_id:a.contribution_id, amount:U128(a.amount)
        }).collect(), created_at_ns:U64(s.created_at_ns),
        completed_at_ns:s.completed_at_ns.map(U64), status:s.status,
    } }
}

#[derive(Serialize)]
#[serde(crate = "near_sdk::serde")]
pub struct Summary {
    pub name: String, pub dao_id: AccountId, pub reserve: U128,
    pub total_deposited: U128, pub total_paid: U128, pub total_refunded: U128,
    pub available: U128, pub pending_spend: U128, pub pending_refund: U128,
    pub contributions: u64, pub spends: u64, pub is_balanced: bool,
}

#[ext_contract(ext_self)]
trait SelfCallbacks {
    fn on_spend_complete(&mut self, id: String) -> bool;
    fn on_refund_complete(&mut self, id: u64, amount: U128) -> bool;
}

#[near(contract_state)]
#[derive(PanicOnDefault)]
pub struct Covaunt {
    name: String,
    dao_id: AccountId,
    storage_reserve: u128,
    contributions: Vector<Contribution>,
    spends: Vector<Spend>,
    spend_indices: LookupMap<String, u64>,
    total_deposited: u128,
    total_paid: u128,
    total_refunded: u128,
}

#[near]
impl Covaunt {
    /// The deployer must supply a segregated storage reserve, NOT donor money.
    /// Do not permit DAO-controlled upgrade keys after verified deployment.
    #[init]
    #[payable]
    pub fn new(dao_id: AccountId, name: String) -> Self {
        require!(env::attached_deposit().as_yoctonear() >= MIN_STORAGE_RESERVE, "ERR_STORAGE_RESERVE");
        require!(!name.trim().is_empty() && name.as_bytes().len() <= 80, "ERR_NAME");
        require!(dao_id != env::current_account_id(), "ERR_DAO_SAME_AS_CONTRACT");
        Self {
            name, dao_id, storage_reserve: env::attached_deposit().as_yoctonear(),
            contributions: Vector::new(Keys::Contributions),
            spends: Vector::new(Keys::Spends),
            spend_indices: LookupMap::new(Keys::SpendIndices),
            total_deposited: 0, total_paid: 0, total_refunded: 0,
        }
    }

    /// Principal is the attached native NEAR. Purpose and recipients cannot be amended.
    /// `withdraw_after_ns` ends spend eligibility and enables donor refund.
    #[payable]
    pub fn contribute(
        &mut self, allowed_purposes: u8, recipients: Vec<AccountId>,
        withdraw_after_ns: U64, note: String,
    ) -> u64 {
        let amount = env::attached_deposit().as_yoctonear();
        require!(amount >= MIN_CONTRIBUTION, "ERR_MIN_CONTRIBUTION");
        require!(self.contributions.len() < MAX_CONTRIBUTIONS, "ERR_LEDGER_CAPACITY");
        require!(valid_mask(allowed_purposes), "ERR_PURPOSE_MASK");
        require!(!recipients.is_empty() && recipients.len() <= MAX_RECIPIENTS, "ERR_RECIPIENTS");
        require!(note.as_bytes().len() <= 180, "ERR_NOTE");
        let now = env::block_timestamp();
        require!(withdraw_after_ns.0 >= now.saturating_add(MIN_LOCK_NS), "ERR_MIN_LOCK");
        let mut unique = recipients.clone();
        unique.sort(); unique.dedup();
        require!(unique.len() == recipients.len(), "ERR_DUP_RECIPIENT");
        require!(!unique.contains(&self.dao_id), "ERR_DAO_RECIPIENT");
        require!(!unique.contains(&env::current_account_id()), "ERR_SELF_RECIPIENT");
        let id = self.contributions.len();
        let c = Contribution {
            id, donor: env::predecessor_account_id(), principal: amount,
            available: amount, pending_spend: 0, pending_refund: 0,
            paid: 0, refunded: 0, allowed_purposes, recipients,
            created_at_ns: now, withdraw_after_ns: withdraw_after_ns.0, note,
        };
        self.contributions.push(&c);
        self.total_deposited = self.total_deposited.checked_add(amount).expect("ERR_OVERFLOW");
        self.assert_storage_reserve();
        event("contribution_created", near_sdk::serde_json::json!({"id":id,"donor":c.donor,"amount":amount.to_string()}));
        id
    }

    /// Sputnik DAO must pass a FunctionCall proposal; a direct user call fails.
    /// `id` is a unique mandate identifier included in the DAO's voted payload.
    /// Payouts are native NEAR; full proposal success requires transfer callback success.
    pub fn execute_spend(
        &mut self, id: String, recipient: AccountId, purpose: u8,
        amount: U128, title: String, reference: String,
    ) -> Promise {
        require!(env::predecessor_account_id() == self.dao_id, "ERR_DAO_ONLY");
        require!(id.as_bytes().len() >= 8 && id.as_bytes().len() <= 64, "ERR_MANDATE_ID");
        require!(self.spend_indices.get(&id).is_none(), "ERR_REPLAY");
        require!(self.spends.len() < MAX_SPENDS, "ERR_SPEND_CAPACITY");
        require!(valid_single_purpose(purpose), "ERR_PURPOSE");
        require!(amount.0 > 0, "ERR_AMOUNT");
        require!(recipient != self.dao_id && recipient != env::current_account_id(), "ERR_UNSAFE_RECIPIENT");
        require!(!title.trim().is_empty() && title.as_bytes().len() <= 120, "ERR_TITLE");
        require!(reference.as_bytes().len() <= 200, "ERR_REFERENCE");
        let (allocations, shortfall) = self.compute_allocation(&recipient, purpose, amount.0);
        require!(shortfall == 0, "ERR_NOT_ENOUGH_ELIGIBLE_CAPITAL");
        for a in &allocations {
            let mut c = self.contributions.get(a.contribution_id).expect("ERR_CONTRIBUTION");
            require!(c.available >= a.amount, "ERR_RESERVE_RACE");
            c.available -= a.amount;
            c.pending_spend = c.pending_spend.checked_add(a.amount).expect("ERR_OVERFLOW");
            self.contributions.replace(a.contribution_id, &c);
        }
        let s = Spend {
            id: id.clone(), recipient: recipient.clone(), purpose, amount: amount.0,
            title, reference, allocations, created_at_ns: env::block_timestamp(),
            completed_at_ns: None, status: SpendStatus::InFlight,
        };
        let idx = self.spends.len();
        self.spends.push(&s);
        self.spend_indices.insert(&id, &idx);
        self.assert_storage_reserve();
        event("spend_reserved", near_sdk::serde_json::json!({"id":id,"recipient":recipient,"amount":amount.0.to_string()}));
        Promise::new(recipient).transfer(NearToken::from_yoctonear(amount.0))
            .then(ext_self::ext(env::current_account_id()).with_static_gas(GAS_CALLBACK).on_spend_complete(id))
    }

    /// Permissionless read: transparent preview of exactly how a DAO proposal would allocate.
    pub fn quote(&self, recipient: AccountId, purpose: u8, amount: U128) -> QuoteView {
        // Preview must reject known protocol-wide limits, not merely donor eligibility.
        if !valid_single_purpose(purpose) || amount.0 == 0 || recipient == self.dao_id || recipient == env::current_account_id() {
            return QuoteView { permitted: false, requested: amount, shortfall: amount,
                allocations: Vec::new(), reason: "Invalid purpose, amount, or recipient".into() };
        }
        if self.spends.len() >= MAX_SPENDS {
            return QuoteView { permitted: false, requested: amount, shortfall: amount,
                allocations: Vec::new(), reason: "Mandate ledger capacity reached".into() };
        }
        let (items, shortfall) = self.compute_allocation(&recipient, purpose, amount.0);
        QuoteView { permitted:shortfall == 0, requested:amount, shortfall:U128(shortfall),
            allocations:items.into_iter().map(|a| AllocationView { contribution_id:a.contribution_id, amount:U128(a.amount) }).collect(),
            reason:if shortfall == 0 {"Executable if the DAO approves before funds change".into()}
                   else {"Insufficient eligible active capital or allocation capacity".into()}, }
    }

    /// Donor-only unilateral recovery after the originally chosen unlock time.
    /// Pending accepted DAO transfers remain reserved until their callbacks resolve.
    pub fn request_refund(&mut self, id: u64) -> Promise {
        let mut c = self.contributions.get(id).expect("ERR_CONTRIBUTION");
        require!(env::predecessor_account_id() == c.donor, "ERR_DONOR_ONLY");
        require!(env::block_timestamp() >= c.withdraw_after_ns, "ERR_STILL_LOCKED");
        require!(c.pending_refund == 0, "ERR_REFUND_IN_FLIGHT");
        require!(c.available > 0, "ERR_NOTHING_TO_REFUND");
        let amount = c.available;
        c.available = 0;
        c.pending_refund = amount;
        let receiver = c.donor.clone();
        self.contributions.replace(id, &c);
        event("refund_reserved", near_sdk::serde_json::json!({"id":id,"amount":amount.to_string()}));
        Promise::new(receiver).transfer(NearToken::from_yoctonear(amount))
            .then(ext_self::ext(env::current_account_id()).with_static_gas(GAS_CALLBACK).on_refund_complete(id, U128(amount)))
    }

    #[private]
    pub fn on_spend_complete(&mut self, id: String) -> bool {
        let idx = self.spend_indices.get(&id).expect("ERR_UNKNOWN_SPEND");
        let mut s = self.spends.get(idx).expect("ERR_UNKNOWN_SPEND");
        require!(matches!(s.status, SpendStatus::InFlight), "ERR_ALREADY_FINALIZED");
        require!(env::promise_results_count() == 1, "ERR_CALLBACK_PROMISE_COUNT");
        let ok = env::promise_result_checked(0, 64).is_ok();
        for a in &s.allocations {
            let mut c = self.contributions.get(a.contribution_id).expect("ERR_CONTRIBUTION");
            require!(c.pending_spend >= a.amount, "ERR_LEDGER_MISMATCH");
            c.pending_spend -= a.amount;
            if ok { c.paid = c.paid.checked_add(a.amount).expect("ERR_OVERFLOW"); }
            else { c.available = c.available.checked_add(a.amount).expect("ERR_OVERFLOW"); }
            self.contributions.replace(a.contribution_id, &c);
        }
        if ok { self.total_paid = self.total_paid.checked_add(s.amount).expect("ERR_OVERFLOW"); }
        s.completed_at_ns = Some(env::block_timestamp());
        s.status = if ok { SpendStatus::Settled } else { SpendStatus::Failed };
        self.spends.replace(idx, &s);
        event(if ok {"spend_settled"} else {"spend_failed"}, near_sdk::serde_json::json!({"id":id,"amount":s.amount.to_string()}));
        ok
    }

    #[private]
    pub fn on_refund_complete(&mut self, id: u64, amount: U128) -> bool {
        let mut c = self.contributions.get(id).expect("ERR_CONTRIBUTION");
        require!(amount.0 > 0 && c.pending_refund == amount.0, "ERR_REFUND_CALLBACK");
        require!(env::promise_results_count() == 1, "ERR_CALLBACK_PROMISE_COUNT");
        let ok = env::promise_result_checked(0, 64).is_ok();
        c.pending_refund = 0;
        if ok {
            c.refunded = c.refunded.checked_add(amount.0).expect("ERR_OVERFLOW");
            self.total_refunded = self.total_refunded.checked_add(amount.0).expect("ERR_OVERFLOW");
        } else { c.available = c.available.checked_add(amount.0).expect("ERR_OVERFLOW"); }
        self.contributions.replace(id, &c);
        event(if ok {"refund_settled"} else {"refund_failed"}, near_sdk::serde_json::json!({"id":id,"amount":amount.0.to_string()}));
        ok
    }

    pub fn get_summary(&self) -> Summary {
        let mut available: u128 = 0;
        let mut pending_spend: u128 = 0;
        let mut pending_refund: u128 = 0;
        for i in 0..self.contributions.len() {
            let c = self.contributions.get(i).expect("ERR_CONTRIBUTION");
            available = available.checked_add(c.available).expect("ERR_OVERFLOW");
            pending_spend = pending_spend.checked_add(c.pending_spend).expect("ERR_OVERFLOW");
            pending_refund = pending_refund.checked_add(c.pending_refund).expect("ERR_OVERFLOW");
        }
        let sum = self.total_paid.checked_add(self.total_refunded).and_then(|x| x.checked_add(available))
            .and_then(|x| x.checked_add(pending_spend)).and_then(|x| x.checked_add(pending_refund)).expect("ERR_OVERFLOW");
        Summary { name:self.name.clone(), dao_id:self.dao_id.clone(), reserve:U128(self.storage_reserve),
            total_deposited:U128(self.total_deposited), total_paid:U128(self.total_paid),
            total_refunded:U128(self.total_refunded), available:U128(available),
            pending_spend:U128(pending_spend), pending_refund:U128(pending_refund),
            contributions:self.contributions.len(), spends:self.spends.len(),
            is_balanced:sum == self.total_deposited }
    }

    pub fn get_contribution(&self, id: u64) -> Option<ContributionView> {
        self.contributions.get(id).map(ContributionView::from)
    }
    pub fn get_contributions(&self, from_index: Option<u64>, limit: Option<u64>) -> Vec<ContributionView> {
        let start = from_index.unwrap_or(0).min(self.contributions.len());
        let end = start.saturating_add(limit.unwrap_or(25).min(40)).min(self.contributions.len());
        (start..end).filter_map(|i| self.contributions.get(i).map(ContributionView::from)).collect()
    }
    pub fn get_spend(&self, id: String) -> Option<SpendView> {
        self.spend_indices.get(&id).and_then(|idx| self.spends.get(idx)).map(SpendView::from)
    }
    pub fn get_spends(&self, from_index: Option<u64>, limit: Option<u64>) -> Vec<SpendView> {
        let start = from_index.unwrap_or(0).min(self.spends.len());
        let end = start.saturating_add(limit.unwrap_or(25).min(40)).min(self.spends.len());
        (start..end).filter_map(|i| self.spends.get(i).map(SpendView::from)).collect()
    }
}

impl Covaunt {
    fn assert_storage_reserve(&self) {
        // The deployer funds this reserve independently of donor principal.
        // Fail closed if persisted collections approach its storage-staking budget.
        let required = u128::from(env::storage_usage())
            .checked_mul(env::storage_byte_cost().as_yoctonear())
            .expect("ERR_OVERFLOW");
        require!(
            required <= self.storage_reserve.saturating_sub(STORAGE_MARGIN),
            "ERR_STORAGE_RESERVE_EXHAUSTED",
        );
    }

    fn compute_allocation(&self, recipient: &AccountId, purpose: u8, requested: u128) -> (Vec<Allocation>, u128) {
        // Purpose-specific / recipient-specific grants are consumed before broad grants.
        // Immutable grant restrictions are checked again at execution time.
        let mut candidates = Vec::new();
        let now = env::block_timestamp();
        for i in 0..self.contributions.len() {
            let c = self.contributions.get(i).expect("ERR_CONTRIBUTION");
            if c.available == 0 || now >= c.withdraw_after_ns { continue; }
            if c.allowed_purposes & purpose == 0 || !c.recipients.contains(recipient) { continue; }
            candidates.push((c.allowed_purposes.count_ones(), c.recipients.len(), c.id, c.available));
        }
        candidates.sort_by_key(|(purposes, recipients, id, _)| (*purposes, *recipients, *id));
        let mut left = requested;
        let mut out = Vec::new();
        for (_, _, id, balance) in candidates.into_iter().take(MAX_ALLOCATIONS) {
            if left == 0 { break; }
            let take = left.min(balance);
            if take > 0 {out.push(Allocation{ contribution_id:id, amount:take }); left -= take; }
        }
        (out, left)
    }
}

fn valid_mask(mask: u8) -> bool { mask != 0 && mask & !PURPOSES_MASK == 0 }
fn valid_single_purpose(purpose: u8) -> bool { valid_mask(purpose) && purpose.count_ones() == 1 }
fn event(kind: &str, data: near_sdk::serde_json::Value) {
    env::log_str(&format!("EVENT_JSON:{}", near_sdk::serde_json::json!({
        "standard":"covaunt", "version":"1.0.0", "event":kind, "data":[data]
    })));
}

#[cfg(test)]
mod tests {
    use super::*;
    use near_sdk::test_utils::VMContextBuilder;
    use near_sdk::{testing_env, test_vm_config, RuntimeFeesConfig, PromiseResult};
    use std::collections::HashMap;

    const T: u64 = 1_800_000_000_000_000_000;
    fn id(a: &str) -> AccountId { a.parse().unwrap() }
    fn ctx(caller: &str, deposit: u128, now: u64) -> VMContextBuilder {
        let mut b = VMContextBuilder::new();
        b.current_account_id(id("covaunt.testnet"))
         .signer_account_id(id(caller))
         .predecessor_account_id(id(caller))
         .attached_deposit(NearToken::from_yoctonear(deposit))
         .account_balance(NearToken::from_yoctonear(100 * YOCTO))
         .block_timestamp(now);
        b
    }
    fn setup() -> Covaunt {
        testing_env!(ctx("deployer.testnet", 5 * YOCTO, T).build());
        Covaunt::new(id("council.testnet"), "The Commons".into())
    }
    fn grant(c: &mut Covaunt, who: &str, amount: u128, mask: u8, recipients: Vec<&str>) -> u64 {
        testing_env!(ctx(who, amount, T + 1).build());
        c.contribute(mask, recipients.into_iter().map(id).collect(),
                     U64(T + 3_600_000_000_000), String::new())
    }
    #[test]
    #[should_panic(expected = "ERR_STORAGE_RESERVE")]
    fn reserve_required() {
        testing_env!(ctx("deployer.testnet", YOCTO, T).build());
        Covaunt::new(id("council.testnet"), "The Commons".into());
    }
    #[test]
    fn deposit_is_restricted_and_ledger_balanced() {
        let mut c=setup();
        grant(&mut c,"atlas.testnet",8*YOCTO,1,vec!["school.testnet"]);
        let g=c.get_contribution(0).unwrap();
        assert_eq!(g.allowed_purposes,1);
        assert_eq!(g.recipients,vec![id("school.testnet")]);
        assert_eq!(g.available.0,8*YOCTO);
        assert!(c.get_summary().is_balanced);
    }
    #[test]
    fn purpose_and_recipient_both_required() {
        let mut c=setup();
        grant(&mut c,"atlas.testnet",8*YOCTO,1,vec!["school.testnet"]);
        assert!(!c.quote(id("clinic.testnet"),1,U128(YOCTO)).permitted);
        assert!(!c.quote(id("school.testnet"),2,U128(YOCTO)).permitted);
        assert!(c.quote(id("school.testnet"),1,U128(YOCTO)).permitted);
    }
    #[test]
    fn narrow_contributions_are_spent_before_flexible_contributions() {
        let mut c=setup();
        grant(&mut c,"flex.testnet",4*YOCTO,3,vec!["school.testnet","clinic.testnet"]);
        grant(&mut c,"single.testnet",6*YOCTO,2,vec!["clinic.testnet"]);
        let q=c.quote(id("clinic.testnet"),2,U128(9*YOCTO));
        assert!(q.permitted);
        assert_eq!(q.allocations.len(),2);
        assert_eq!(q.allocations[0].contribution_id,1);
        assert_eq!(q.allocations[0].amount.0,6*YOCTO);
        assert_eq!(q.allocations[1].amount.0,3*YOCTO);
    }
    #[test]
    #[should_panic(expected = "ERR_DAO_ONLY")]
    fn direct_spend_from_non_dao_rejected() {
        let mut c=setup();
        grant(&mut c,"atlas.testnet",YOCTO,1,vec!["school.testnet"]);
        testing_env!(ctx("attacker.testnet",0,T+2).build());
        c.execute_spend("cvt-00000001".into(),id("school.testnet"),1,U128(YOCTO),"School supplies".into(),"doc".into());
    }
    #[test]
    #[should_panic(expected = "ERR_NOT_ENOUGH_ELIGIBLE_CAPITAL")]
    fn dao_cannot_override_donor_permission() {
        let mut c=setup();
        grant(&mut c,"atlas.testnet",YOCTO,1,vec!["school.testnet"]);
        testing_env!(ctx("council.testnet",0,T+2).build());
        c.execute_spend("cvt-00000001".into(),id("clinic.testnet"),2,U128(YOCTO),"Diversion".into(),"doc".into());
    }
    #[test]
    fn dao_valid_spend_reserves_and_success_callback_settles() {
        let mut c=setup();
        grant(&mut c,"atlas.testnet",2*YOCTO,1,vec!["school.testnet"]);
        testing_env!(ctx("council.testnet",0,T+2).build());
        c.execute_spend("cvt-00000001".into(),id("school.testnet"),1,U128(YOCTO),"Tuition".into(),"doc".into());
        assert_eq!(c.get_contribution(0).unwrap().pending_spend.0,YOCTO);
        assert_eq!(c.get_summary().available.0,YOCTO);
        testing_env!(ctx("covaunt.testnet",0,T+3).build(),test_vm_config(),RuntimeFeesConfig::test(),HashMap::default(),vec![PromiseResult::Successful(vec![])]);
        assert!(c.on_spend_complete("cvt-00000001".into()));
        assert_eq!(c.get_summary().total_paid.0,YOCTO);
        assert_eq!(c.get_summary().pending_spend.0,0);
        assert!(c.get_summary().is_balanced);
    }
    #[test]
    fn failed_transfer_releases_reservation() {
        let mut c=setup();
        grant(&mut c,"atlas.testnet",2*YOCTO,1,vec!["school.testnet"]);
        testing_env!(ctx("council.testnet",0,T+2).build());
        c.execute_spend("cvt-00000002".into(),id("school.testnet"),1,U128(YOCTO),"Tuition".into(),"doc".into());
        testing_env!(ctx("covaunt.testnet",0,T+3).build(),test_vm_config(),RuntimeFeesConfig::test(),HashMap::default(),vec![PromiseResult::Failed]);
        assert!(!c.on_spend_complete("cvt-00000002".into()));
        assert_eq!(c.get_summary().available.0,2*YOCTO);
        assert_eq!(c.get_summary().total_paid.0,0);
        assert!(c.get_summary().is_balanced);
    }
    #[test]
    #[should_panic(expected = "ERR_REPLAY")]
    fn mandate_id_cannot_execute_twice() {
        let mut c=setup();
        grant(&mut c,"atlas.testnet",3*YOCTO,1,vec!["school.testnet"]);
        testing_env!(ctx("council.testnet",0,T+2).build());
        c.execute_spend("cvt-00000004".into(),id("school.testnet"),1,U128(YOCTO),"Tuition".into(),"doc".into());
        c.execute_spend("cvt-00000004".into(),id("school.testnet"),1,U128(YOCTO),"Tuition".into(),"doc".into());
    }
    #[test]
    fn expiry_removes_spend_eligibility_and_refund_succeeds() {
        let mut c=setup();
        grant(&mut c,"atlas.testnet",3*YOCTO,1,vec!["school.testnet"]);
        testing_env!(ctx("atlas.testnet",0,T+3_700_000_000_000).build());
        assert!(!c.quote(id("school.testnet"),1,U128(YOCTO)).permitted);
        c.request_refund(0);
        assert_eq!(c.get_contribution(0).unwrap().pending_refund.0,3*YOCTO);
        testing_env!(ctx("covaunt.testnet",0,T+3_700_000_000_001).build(),test_vm_config(),RuntimeFeesConfig::test(),HashMap::default(),vec![PromiseResult::Successful(vec![])]);
        assert!(c.on_refund_complete(0,U128(3*YOCTO)));
        assert_eq!(c.get_summary().total_refunded.0,3*YOCTO);
        assert!(c.get_summary().is_balanced);
    }
    #[test]
    fn failed_refund_reinstates_availability() {
        let mut c=setup();
        grant(&mut c,"atlas.testnet",3*YOCTO,1,vec!["school.testnet"]);
        testing_env!(ctx("atlas.testnet",0,T+3_700_000_000_000).build());
        c.request_refund(0);
        testing_env!(ctx("covaunt.testnet",0,T+3_700_000_000_001).build(),test_vm_config(),RuntimeFeesConfig::test(),HashMap::default(),vec![PromiseResult::Failed]);
        assert!(!c.on_refund_complete(0,U128(3*YOCTO)));
        assert_eq!(c.get_summary().available.0,3*YOCTO);
        assert!(c.get_summary().is_balanced);
    }
    #[test]
    #[should_panic(expected = "ERR_DAO_RECIPIENT")]
    fn donation_cannot_whitelist_governance_treasury_as_beneficiary() {
        let mut c=setup();
        grant(&mut c,"atlas.testnet",YOCTO,1,vec!["council.testnet"]);
    }
    #[test]
    #[should_panic(expected = "ERR_DUP_RECIPIENT")]
    fn duplicate_recipients_rejected() {
        let mut c=setup();
        grant(&mut c,"atlas.testnet",YOCTO,1,vec!["school.testnet","school.testnet"]);
    }
}
