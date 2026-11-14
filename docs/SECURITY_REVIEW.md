# COVAUNT adversarial security review

**Review date:** 13 November 2026
**Scope:** contract source and tests, sandbox receipt behavior, live read-only audit, Next.js boundary and browser workflows
**Conclusion:** no critical failure was reproduced in the exercised contract paths; this is not a professional or independent audit.

## Contract properties

| Property | Result |
| --- | --- |
| Direct non-DAO `execute_spend` | PASS locally: `ERR_DAO_ONLY` |
| Wrong purpose / recipient | PASS: no eligible allocation |
| DAO-approved donor diversion | PASS in local and recorded live case: downstream fails |
| Duplicate recipient allowlist | PASS: `ERR_DUP_RECIPIENT` |
| Unsafe DAO/vault recipient | PASS: rejected |
| Concurrent reservation | PASS: availability moves to pending before transfer |
| Mandate replay | PASS: `ERR_REPLAY` |
| Failed payout callback | PASS: restores available balances and marks `Failed` |
| Failed refund callback | PASS: restores available balance |
| Early or wrong-donor refund | PASS: lock and donor checks |
| Callback spoofing | PASS by `#[private]`, one-result guard and state check |
| Integer arithmetic | PASS in exercised paths; yoctoNEAR and checked additions |
| Conservation invariant | PASS in Rust, Node and sandbox paths |
| Pagination and capacities | PASS bounded by contract caps |
| Gas/storage reserve | PASS fail-closed checks locally; live reserve and solvency are separately audited |
| Upgrade authority | BLOCKER: live vault retains FullAccess key |

## Frontend review

- Live RPC failure clears ledger data rather than showing preview numbers.
- `?mode=preview` is explicit, deterministic and disables writes.
- Wallet code is client-only and uses `@hot-labs/near-connect`; the site never receives private keys, phrases or passwords.
- Contribution, proposal and refund controls use a busy guard and do not auto-retry after uncertainty.
- DAO status and vault settlement are displayed as separate state machines.
- Recipient, amount and proposal inputs are bounded before wallet calls; the contract remains authoritative.
- The app has visible keyboard focus, semantic labels, mobile navigation and reduced-motion CSS.
- Public work/reputation claims are not fabricated; `/work` is contract-backed only when an auxiliary account is configured and otherwise shows the deployment boundary.
- The auxiliary Work & Trust contract is isolated from the vault, has bounded task/submission/payout storage, private callbacks, one-claim/one-submission guards, tier-specific authorization and an eight-attempt payout cap.
- The near.social surface is read-only mainnet context. Posts and profile data are not used as work evidence or reputation input.
- Trezu is documented as not integrated; no duplicate treasury or provider-only label was added.
- `npm audit --omit=dev --audit-level=high` has no high/critical findings. The audit still reports four low-severity transitive `elliptic` findings through `@near-js/transactions` → `@near-js/crypto` → `secp256k1`; `npm audit fix --force` proposes a breaking downgrade, so it was not applied without an upstream-compatible fix.

## Live evidence

The supplied evidence records a valid 9 NEAR settlement, a unanimous 2 NEAR override whose downstream vault execution failed, an early refund failure and a successful 0.1 NEAR refund. The read-only audit also reported a balanced ledger and estimated principal backing. It fails intentionally on the FullAccess-key check.

## Residual risks

1. FullAccess can replace the deployed code. Until key custody is reviewed and the key is removed through an authorized irreversible operation, donor guarantees are upgrade-authority exposed.
2. A callback that never executes could leave capital pending. The contract intentionally has no emergency state-rewriting withdrawal path.
3. The contract validates declared purpose and account recipient, not off-chain use of funds or work completion.
4. Sputnik policy and council membership remain governance dependencies. A connected wallet is not automatically a council member.
5. Testnet RPC, wallet manifests, explorer indexing and account solvency can change after the evidence timestamp.
6. The browser wallet flow has not been independently signed through a specific testnet wallet in this migration; it is wired and fixture-tested, not claimed as end-to-end wallet evidence.
7. Work & Trust has no testnet deployment or live task/reward evidence in this release. Its unit tests and sandbox test do not prove a public account or real Sputnik execution.
8. near.social reads mainnet public data only; signed posting and cross-network identity attribution remain disabled.

## Key recommendation

Do not delete `ed25519:6NDRm1atodNeiXTkK1qeRz9iaqCqX7QjR3zWKB4MhGAz` automatically. Confirm the source-matched WASM, test recovery on a separate account, obtain human authorization and understand the irreversible key-loss risk first. Then perform the removal manually and rerun code-hash, access-key, ledger, storage and solvency checks.
