# COVAUNT Work & Trust

**Status:** locally implemented, role-hardened, unit tested 17/17 and sandbox-tested in Linux/CI; not deployed to NEAR testnet in this release.

Work & Trust is an auxiliary financial record domain. It is deliberately not an extension of `vault.covauntops26.testnet`, does not read donor balances and has no method that can call the donor vault. A task creator funds a task with an attached native NEAR deposit. That deposit is the only capital available to the task’s reward path.

## Enforced lifecycle

```text
create_task + attached task budget
        ↓
Open → Claimed → Submitted → Verified
                                  ├─ Small: verifier starts payout
                                  ├─ Medium: named approver starts payout
                                  └─ Large: configured Sputnik DAO starts payout
        ↓                                  ↓
   Settled after callback              Failed restores task availability
```

The contract also records bounded disputes. A creator or claimant can open one dispute before a transfer is pending; the configured DAO can uphold or dismiss it. An upheld dispute prevents an unsettled reward from proceeding. A settled native transfer is not clawed back by this contract.

## On-chain records

- Task: purpose, isolated budget, deadline, eligibility list, verifier, optional medium approver, tier, reward amount and state.
- Claim: one claimant, with eligibility and deadline checked by the contract.
- Submission: one bounded evidence URI and hash for the claimant.
- Verification: only the configured verifier can approve or reject the submission; creator, verifier, claimant and (for Medium) approver roles must be distinct. The contract records a named-account attestation, not independent proof of real-world work.
- Payout: every attempt, amount, tier, worker, status, callback timestamp and bounded retry count.
- Contributor: named attestations, callback-settled tasks, rewards paid and points derived only from settled rewards. A verification event alone never increases reputation points.
- Accounting: budget = paid + refunded + available + pending reward + pending refund.

The contract limits tasks, submissions, eligibility lists, field sizes, payout attempts and view page sizes. Payout attempts are capped at eight. No administrator withdrawal method exists.

## Reward tiers

| Tier | Authorization | Local contract status | Public testnet status |
| --- | --- | --- | --- |
| Small | Configured verifier approval, then callback | Implemented and unit/sandbox tested | Not deployed or live-verified |
| Medium | Configured verifier approval, then exact approver | Implemented and unit/sandbox tested | Not deployed or live-verified |
| Large | Configured verifier approval, then exact Sputnik DAO predecessor and replay-protected mandate ID | Implemented, direct-wallet rejection and FunctionCall proposal/vote helpers tested | Not deployed or live-verified |

These are not permissions over COVAUNT donor principal. The tier is an explicit authorization policy, not an automatic minimum-amount classifier: a creator may intentionally choose the stricter Large path for a small reward, subject to the Large cap. The frontend exposes the write forms only when `NEXT_PUBLIC_COVAUNT_WORK_CONTRACT` is set. With that variable absent, `/work` and contributor routes show an explicit unconfigured state and no sample work records.

## Trust model and governance surface

The contract rejects creator/verifier overlap at task creation, creator/verifier/approver overlap at task claim, and verifier/claimant overlap at verification. A Medium claimant cannot be its approver. These controls reduce obvious self-approval paths, but they do not prove that named accounts are independent people or that submitted evidence reflects physical-world work. Council members and task creators remain governance trust dependencies.

The web client reads bounded task and payout pages until the contract-reported total is exhausted. For a verified Large task it can construct the exact Sputnik FunctionCall proposal for `execute_large_reward`, read the live proposal bond, display matching DAO proposals and submit council votes. The DAO status and the Work contract payout/callback status are always shown as separate facts. The same adapter can prepare `resolve_dispute` proposals; no connected visitor is treated as a council member automatically.

## Reproduce locally

```bash
cargo test --manifest-path work-contract/Cargo.toml
cargo near build non-reproducible-wasm --manifest-path work-contract/Cargo.toml --no-abi
npm run test:sandbox
```

The sandbox test deploys the artifact only inside a local NEAR Sandbox, settles a verified small reward, checks callback accounting and proves a direct wallet cannot execute a large DAO-only reward. It is not a Sputnik vote and is not testnet evidence. The CI Ubuntu runner is the authoritative receipt environment when the local machine cannot run the Linux sandbox binary. The canonical changed-source artifact is 216,158 bytes, SHA-256 `50e3ea76d1d0da8d2cdfaf977149e59c76277dd85a3c92e44baee54188204500`, from CI run `43578729757`.

## Deployment gate

No testnet account or deployment address is claimed for this contract. The reproducible deployment boundary is `scripts/deploy-work-testnet.sh`, which pins the canonical CI artifact hash and refuses the original vault account. A future deployment requires a separately funded account, storage reserve, a reviewed access-key policy, real wallet flows for creator/worker/verifier/approver, a real Sputnik FunctionCall for the large path, and updated evidence. It must not use the deployed vault account, its FullAccess key or any existing donor capital.
