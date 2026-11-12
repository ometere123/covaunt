# AI / engineering agent handoff mandate

You are inheriting **COVAUNT**, a complete source tree for a NEAR hackathon treasury. Do not substitute GenLayer, do not reuse generic Next.js/Codex frontend designs, and do not reduce the product to a toy demo. Preserve the editorial parchment/ink/oxblood/brass design system and full donor/mandate/DAO/audit lifecycle. Do not introduce `v1`, an “MVP later”, or a feature roadmap in the user-facing brand.

## Mandatory order of execution

1. Read `README.md`, `docs/THREAT_MODEL.md`, `docs/ACCEPTANCE.md` and `docs/DEPLOYMENT.md` fully.
2. Verify real NEAR SDK and Sputnik DAO ABI against deployed testnet contract, correct compilation/API mismatches, and **run** Rust unit tests. Do not treat unexecuted test source as evidence.
3. Build WASM and run real near-workspaces sandbox tests, including success/failure Promise callbacks and ledger/account solvency checks; repair contract until all pass.
4. `npm install` in root and `web/`; run Node tests, `npm run verify:static`, Vite production build, browser functionality and mobile responsiveness.
5. Create/verify a genuine Sputnik DAO testnet with supported `FunctionCall` proposal kind and voting policy. `dao_id` must point to real contract, not a personal council account.
6. Deploy COVAUNT with separately funded storage reserve and verify code hash/account keys; connect web config and host static app.
7. Reproduce all transactions in acceptance matrix, including compatible payout and **majority-approved incompatible call rejected**. Cross-check NEAR receipts, callback terminal status, treasury account balance, and donor allocations.
8. Audit own contract FullAccess keys and clearly disclose upgrade authority. Never delete keys irreversibly without an explicit reviewed safety plan.
9. Capture independent screenshots and narrated live demo, then write honest evidence-backed public README / submission and share exact links.
10. Never claim 25/25 or production-ready security based solely on passing unit tests. Report exact unverified gaps.

## Invariants to preserve

- Grant's donor, mask, recipient allowlist and expiry immutable from moment of contribution.
- `execute_spend` DAO caller check and recipient+single purpose checks; donor available balance reserved before async transfer.
- Pending transfer/refund callback settlement or restore; no replay, no double allocation, no float currency math.
- Preview never triggers real transactions; live-mode outage never renders fabricated donor records.
- No silent admin bypass, discretionary policy rewriting or unsupported real-world impact claims.

## Prioritize correctness over expansion

Do not add attractive but irrelevant features before proving the entire successful and adversarial lifecycle. If a critical safety property fails, stop release, fix it, then rerun all gates.
