# COVAUNT — system architecture and rules

## Authority separation

```text
DONOR with NEAR wallet -- contribute(amount, purposeMask, recipientAllowlist, expiry)
                  | 
                  v
             COVAUNT escrow (native NEAR)
            /   immutable grants       \
           /       quote()              \ expires
          v                              v
 SPUTNIK DAO COUNCIL                 DONOR refund request
   propose FunctionCall                   | permissionless callback
   vote / execute                         v
         |                          returning donor balance
         v
  execute_spend(id, recipient, purpose, amount, title, reference)
         |
     permission + liquidity + expiry revalidation
         |
   reserve allocations (available -> pending_spend)
         |
   NEAR Promise transfer -> recipient
         |
   private self callback -> success: pending_spend -> paid
                        -> failure: pending_spend -> available
```

No arbitrary user can issue a direct spending call. No governance vote can alter the permission mask, recipient list, amount paid from each contribution, donor address, or unlock time. The deployer account and its FullAccess keys remain a separate upgrade risk until locked down.

## Models

`Contribution`: fixed donor, original principal, mask, allowlist, creation and expiry, mutable accounted balances (`available`, `pending_spend`, `pending_refund`, `paid`, `refunded`). `Spend`: unique mandate ID, exact recipient and declared purpose, title, reference, amount, deterministic allocations, status (`InFlight`, `Settled`, `Failed`), timestamps. `Summary`: aggregate reconciliation across all contribution balances. All on-chain currency is `u128` yoctoNEAR, rendered as decimal strings through `U128` JSON wrappers.

### Allocation algorithm

1. Scan only grants with `available > 0`, `now < withdraw_after_ns`, a matching purpose bit and exact recipient membership.
2. Sort candidate grants by `(number of allowed purpose bits, recipient allowlist size, contribution ID)` ascending, preserving more flexible donor capital for future requests.
3. Greedily consume compatible capital; cap at 24 allocations per spend; fail when the entire requested amount is not covered.
4. On successful DAO invocation, reserve all chosen amounts before scheduling the transfer.
5. Return an explicit shortfall rather than borrowing from incompatible grants.

This deterministic greedy algorithm intentionally prioritizes narrow grants. It is not guaranteed to maximize future allocation feasibility across arbitrary future proposals; that would require predicting future demand. The contract re-evaluates quotes at execution time because other valid spending and refunds can make a previously positive quote stale.

### Capacity, gas and storage

- At most 256 donor contributions, 8 beneficiary accounts per contribution, 1,024 stored spending records, 24 allocations per individual payment, 180-byte donor notes and 200-byte evidence references.
- An initialization reserve of at least **5 NEAR** is segregated from donor principal in accounting. New on-chain record creation fails closed once estimated storage staking would approach the reserve minus a 0.1 NEAR buffer. This guard must be verified against real NEAR runtime storage accounting.
- `get_contributions` and `get_spends` are paginated with a 40-entry cap per query. The application retrieves the pages for a complete ledger (up to the contribution cap).
- Execution uses a 30 Tgas callback budget; DAO action gas is 150 Tgas. Real testnet traces must confirm sufficiency. Unexpected callback failures can strand `pending` values; they require a documented operational recovery strategy before using real funds.
- Pending transfers and pending refunds cannot be spent twice. `get_summary.is_balanced` is an internal ledger conservation check, not a proof that the on-chain account's **liquid** balance fully backs donor obligations.

## Exact trust boundaries

**On-chain facts:** donor signature/attached deposit; immutable permissions; deterministic allocation; original DAO caller account; transaction inclusion; NEAR transfer receipts; the contract's own accounting state.

**Off-chain assumptions:** a beneficiary's identity and intended use; donor comprehension of recipient controls; reliability of RPC endpoints and wallet software; public documentation claims; DAO policy legitimacy; actual impact after payment.

**Important:** A DAO supplies a declared purpose value with its proposal. The contract can verify that purpose **label** and the exact destination are permitted, but not that the recipient will use the transferred funds for that purpose. When a recipient appears in several purposes, a DAO may relabel the same transfer; users should restrict recipient scope accordingly. Use known purpose-specific recipient accounts when demonstrating.

## Why Sputnik DAO matters

Sputnik `add_proposal` receives a function-call proposal containing the exact COVAUNT contract ID and serialized `execute_spend` arguments. Council member voting uses `act_proposal` and policy-defined thresholds. On approval, Sputnik invokes COVAUNT and becomes its `predecessor_account_id`. The COVAUNT contract still validates **every** permission. COVAUNT has no admin method to waive those checks. A DAO proposal marked approved or executed is not proof a NEAR native transfer succeeded: check COVAUNT `get_spend` status and transaction receipts.

## UX architecture

The web app is a manually authored, framework-light Vite application. Its ledger reads NEAR JSON RPC `view` responses, formats integer yoctoNEAR amounts without floating-point rounding, and lazily loads Wallet Selector only when configured. Browser-side calculation is a preview; the Rust contract is authoritative. Illustration mode is explicitly labeled and disables real writes. The UI never falls back to illustrative balances after a live-data failure.
