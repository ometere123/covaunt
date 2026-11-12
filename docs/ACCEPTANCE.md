# COVAUNT — acceptance requirements and current gate status

The 25/25 number is a **target**, not a self-awarded or guaranteed NEAR score. An artifact is not accepted merely because its source exists. This status was updated on 12 November 2026 from executed local/WSL evidence. `PASS` means the named local gate actually ran; `BLOCKED` means an external authority or live account is still required.

| Gate | Evidence required | Current status |
|---|---|---|
| G01 Complete source | Contract, UI, tests, scripts and docs included in ZIP | **PASS** |
| G02 Source static consistency | `npm run verify:static`, JS syntax checks | **PASS** |
| G03 Deterministic allocator | `npm test` and `npm run proof` with 8/6/4 split | **PASS** |
| G04 Rust correctness | `cargo test` with full visible results | **PASS — 13/13** |
| G05 Build artifact | WASM compilation, hash, compiler/toolchain versions | **PASS — local hash recorded** |
| G06 NEAR receipt semantics | near-workspaces sandbox, real transfer and callback tests | **PASS — 1/1, no skips** |
| G07 Browser UX | Responsive desktop/mobile, controls, keyboard, wallet return | **PASS for preview/mobile layout; live wallet return BLOCKED** |
| G08 DAO authenticity | Real Sputnik testnet DAO, role policy, code hash and bond | **BLOCKED — no DAO/account access** |
| G09 Donor deposits | Three real contributed transactions; summary balanced | **BLOCKED — no funded signer** |
| G10 Compatible payment | DAO proposal approved, NEAR transfer settled, recipient credited | **BLOCKED — no testnet deployment** |
| G11 Unanimous diversion blocked | Real DAO-approved `FunctionCall` cannot spend incompatible donor money | **BLOCKED live proof; local contract behavior PASS** |
| G12 Replay and caller abuse | Exact failure receipts for direct attacker, replay, wrong permission | **PASS in Rust/Sandbox; live receipt BLOCKED** |
| G13 Refund recovery | Expiry-based donor withdrawal and recipient balance evidence | **PASS in Sandbox; live balance evidence BLOCKED** |
| G14 Financial solvency | Contract account liquid+storage-staked backing reconciled to obligations and reserve | **BLOCKED — requires deployed account audit** |
| G15 Governance key review | FullAccess keys inventory; no unacknowledged code-upgrade power | **BLOCKED — requires deployed account** |
| G16 Independent reproducibility | Clean checkout builds, tests and repeats fixed sample | **BLOCKED — local/WSL repeat passed; hosted CI run not observed** |
| G17 Public demo | Working app URL, narrated demo, source and X public post | **BLOCKED — no authorized hosting/repo target** |
| G18 Submission | Accepted by actual hackathon submission portal before deadline | **BLOCKED — external submission not authorized** |

## Category targets

**Track fit 5/5:** Real Sputnik governance and pooled-money usage, no fake governance. **Originality 5/5:** independently compare with restricted treasuries, earmarked grants and Moloch exit/ragequit protections; show exact donor-level restriction after a genuine majority vote. **Utility 5/5:** demonstrate a community beneficiary, fundable compatible mandate, refund and audit workflow. **Differentiation 5/5:** real unanimous-approval bypass test **fails** while a valid mandate succeeds; no admin bypass or hidden data. **Execution 5/5:** green Rust/Sandbox/Browser/testnet gates with reproducible transaction receipts and no unsupported security claims.

## Specific pass/fail checklist

- Contract rejects wrong purpose AND wrong recipient even from DAO account.
- Contributing 8/6/4 and paying 9 to clinic yields B6 + C3, while A8 unchanged.
- `get_summary.is_balanced` true at every state, but also compare actual account balance, stake and pending obligations.
- Same mandate ID cannot execute twice, including failure case.
- Transfer callback is actual NEAR runtime callback, not only manually injected mock result.
- A donor cannot withdraw before expiry; cannot withdraw another donor's grant; can withdraw the unspent part after expiry.
- Preview mode includes a visible **illustrative** designation and cannot send transactions.
- Live mode fails closed when RPC or DAO account mismatch occurs.
- Proposal `get_policy` bond is used, and `act_proposal` authorization is enforced by actual Sputnik code.
- UI buttons only perform real advertised actions, and transactions never claim settlement at signature time.
- Reviewer can reproduce from a clean checkout without proprietary secrets (except their own funded testnet signer).
- All dates, account IDs, hashes and project links in a submitted README are real, independently checked and not fabricated.

## Required evidence record

Use `docs/EVIDENCE_TEMPLATE.json` and `scripts/collect-evidence.mjs` only after transactions exist. Include explorer URL, RPC transaction finality, sender/receiver, method, arguments summary, result status, final balances, code hash, DAO policy and timestamp. A screenshot can support a record, but cannot substitute for proof of settlement.

## Go/no-go threshold

**No-go:** Rust compile fails, sandbox skipped, donor ledger unbalanced, a valid unauthorized diversion succeeds, key-upgrade power hidden, sample transactions presented as live, or UI payment claims unsupported by receipt.

**Conditional go (testnet only):** all primary payment and security gates passed with disclosed residual risks and source reproducibility; incomplete secondary UX polish can be noted. Full 25/25 aspiration is an external judging matter, not something this artifact can guarantee.
