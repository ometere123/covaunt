# COVAUNT — adversarial security review

**Review date:** 12 November 2026  
**Reviewer posture:** malicious donor, compromised council member, direct RPC caller and failed asynchronous transfer  
**Scope:** source review plus Rust unit tests and NEAR Sandbox receipt execution  
**Conclusion:** no critical local contract failure was reproduced in the exercised paths; this is not an independent audit and does not authorize real-value use.

## Properties checked

| Attack / property | Result | Evidence |
|---|---|---|
| Direct non-DAO `execute_spend` | **PASS** — `ERR_DAO_ONLY` | Rust unit + sandbox receipt |
| Wrong purpose or recipient | **PASS** — allocation returns no compatible capital | Rust unit + sandbox incompatible request |
| DAO-approved diversion of education-only capital | **PASS locally** — `ERR_NOT_ENOUGH_ELIGIBLE_CAPITAL` | 8/6/4 unit and sandbox scenario |
| Recipient substitution / DAO or treasury recipient | **PASS** — unsafe recipients rejected | Rust unit tests |
| Duplicate recipient allowlist | **PASS** — `ERR_DUP_RECIPIENT` | Rust unit test |
| Concurrent spend reservation | **PASS in model** — availability moves to pending before transfer | Rust state transition and callback tests |
| Mandate replay | **PASS** — single-use `spend_indices` rejects reuse, including after settlement | Rust + sandbox |
| Failed payout | **PASS** — `spend_failed` restores each reservation | Rust + real sandbox transfer failure |
| Failed refund | **PASS** — callback restores `available` | Rust unit test |
| Early / wrong-donor refund | **PASS** — lock and donor checks panic | Rust unit tests |
| Expiry | **PASS locally** — expired grants are excluded and donor refund settles | Rust + sandbox |
| Arithmetic | **PASS for exercised paths** — integer yoctoNEAR and checked additions | Source review + tests |
| Ledger conservation | **PASS locally** — summary invariant remains balanced through transitions | Rust, Node, sandbox |
| Pagination / capacity | **PASS bounded behavior** — caps are explicit and quote fails closed at spend capacity | Node tests + source review |
| Callback spoofing | **PASS by access control** — callbacks are `#[private]`; result count is required to be one | Source review |
| Upgrade authority | **BLOCKED live review** — account FullAccess keys require deployment audit | No deployed account available |
| Physical solvency | **BLOCKED live review** — logical accounting is not account-balance proof | Requires `audit-testnet.mjs` after deployment |

## Changes made during this review

1. Added an explicit `env::promise_results_count() == 1` guard before reading either asynchronous result. This makes callback assumptions fail closed instead of accepting an unexpected callback shape.
2. Pinned the receipt test runtime to NEAR Sandbox `2.14.0`, compatible with the current near-sdk protocol target, and made missing WASM/binary a test failure rather than a skipped pass.
3. Added a root `.npmrc` so the legacy Windows-incompatible `near-sandbox` postinstall cannot make dependency installation appear successful without the explicit runtime preparation step.
4. Disabled preview transaction controls and placed explanatory status text beside them. Preview wallet and proposal actions cannot be mistaken for successful writes.
5. Aligned illustrative recipients with the documented `school.testnet` / `clinic.testnet` scenario and corrected the browser regression test.

## Residual risks

- COVAUNT validates a declared purpose and exact recipient account; it cannot prove the beneficiary's off-chain use of funds.
- Sputnik DAO policy, council identity, proposal bond, action ABI and code hash still require live verification. A controlled sandbox predecessor is not a DAO vote.
- Contract upgrade keys can replace code if deployment account access is retained. The contract exposes no unilateral admin withdrawal, but key custody remains a deployment risk.
- A callback that never executes could leave capital pending. The contract intentionally has no emergency state-rewriting withdrawal path; live gas, receipt and operational monitoring must be validated before use.
- Storage reserve protection is conservative but logical; live account liquid balance and storage staking must be reconciled separately.
- The frontend quote is advisory. The contract recomputes allocation after DAO approval, and the UI must never treat a DAO status as a settled payment.
- The web wallet dependency graph reports 10 low production advisories through `elliptic`. The available force fix is a breaking downgrade, so it was not applied without compatibility review.

## Release implication

Local contract, receipt and browser evidence supports a testnet-only hackathon handoff. The release remains blocked from live advertising until the exact DAO, deployment, key, solvency, wallet-return and explorer evidence gates in `docs/ACCEPTANCE.md` are completed.
