# COVAUNT — competitive thesis and honest novelty analysis

## Why not a conventional DAO treasury?

Typical DAO treasuries give approved governance significant spending authority over pooled funds. More advanced mechanisms already exist for restricted grants, earmarked budgets and individual exit rights; COVAUNT does **not** claim to have invented all donation restrictions or governance disagreement handling. The intended contribution is a compact, continuously permissioned *allocation layer* beneath governance: every payment must be constructed from compatible donor-level grants, with transparent receipts and donor expiration-based recovery.

## Closest adjacent approaches

| Existing category | Prior capability | Intended COVAUNT distinction |
|---|---|---|
| Sputnik DAO | Governance proposals, role policies, executable FunctionCall actions | DAO approval does not override original per-contribution restrictions |
| Moloch-style DAO | Dissenting-member exit / ragequit before contested treasury actions | Contributors may remain inside the pool for compatible future spending; expiry refunds are not vote-based exit rights |
| Restricted grants / earmarked donation funds | Fund assignment for stated programs | Multi-contributor deterministic allocation in a common ledger with both purpose and account-level controls |
| Milestone escrow | Release money when external condition is met | No off-chain oracle needed; focus is on donor-to-payment routing permissions |
| Conventional multisig treasury | Signers approve transactions | No single threshold of signers can widen immutable donor restrictions through this ABI |

## Important weaknesses compared with mature products

- No free-form programmable donor policy language; five fixed purpose categories, exact beneficiary list and expiry.
- Single native NEAR asset; no FT, stablecoin, fiat on/off-ramp or cross-chain settlement.
- No independent audit of the beneficiary's use of proceeds; purpose is a proposal category label.
- No high-throughput optimized accounting; on-chain scan capped at 256 contributions.
- No audited emergency recovery; failed callbacks remain a critical risk if runtime/gas limitations emerge.
- DAO authentication checks caller address, not whether that contract is truly Sputnik. Verify it at setup.
- Code can still be replaced if the contract account retains FullAccess keys.

## What can be judged objectively

1. **Traceability:** every spend records which original donors actually financed it.
2. **Enforceability:** a permitted DAO predecessor cannot spend any amount without sufficient compatible donor capital.
3. **Consent longevity:** donor restrictions persist despite policy changes and a later majority vote.
4. **Predictability:** the allocator can produce a human-readable, reproducible quote.
5. **Recoverability:** expired unspent donor money is reclaimable, without DAO permission.

The competitive claim must be supported by actual public code, exact transfer receipts and a real Sputnik DAO test. It is a plausible hackathon differentiation, not proof of unique worldwide invention or guaranteed 25/25 judging.
