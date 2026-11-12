# COVAUNT — final release verification report

**Date:** 12 November 2026  
**Artifact:** `COVAUNT_RELEASE_HANDOFF`  
**Engineering verdict:** `READY_WITH_DISCLOSED_LIMITATIONS`

## A. Contract

The Rust contract compiles against `near-sdk 5.30.1`. `cargo test` passes 13/13 unit tests with no ignored tests. The contract builds with `cargo-near-near 0.23.0`; the distributable `contract/artifacts/covaunt.wasm` is 183,746 bytes and has SHA-256 `96762824a7226f90981b9685890146d94f4a06dc8a3e66e1f9893254f9896888`.

The tests cover immutable purpose/recipient permissions, exact narrow-before-flexible allocation, DAO caller enforcement, replay protection, early and wrong-donor refunds, failed payout/refund restoration, expiry, capacity bounds and conservation. The asynchronous callback handlers now require exactly one promise result before finalizing.

Remaining contract risks are documented in `docs/SECURITY_REVIEW.md`: upgrade-key custody, physical account solvency, callback operational monitoring and the fact that declared purpose cannot prove off-chain recipient behavior.

## B. DAO

The frontend and ABI documentation implement the current Sputnik FunctionCall shape: read the live proposal bond, add a proposal containing `execute_spend`, and use `act_proposal` with the voted proposal kind. The local Sandbox test verifies the COVAUNT DAO-predecessor boundary but intentionally uses a controlled account.

No real Sputnik DAO was created or connected in this workspace. No council policy, DAO code hash, proposal, vote or testnet execution receipt is claimed. This is the main external acceptance blocker.

## C. Frontend

The Vite production build passes. Playwright passes 10/10 across desktop Chromium and a 390px mobile viewport. The tests cover the editorial identity, explicit design-preview labeling, disabled preview transaction buttons, illustrative allocation math, contribution inspection, premature-refund suppression and mobile overflow.

The UI preserves the civic-ledger/luxury-editorial direction: parchment, ink, oxblood, brass, serif headlines, mono audit metadata and hard rules. Browser-captured screenshots are included at:

- `docs/screenshots/covaunt-desktop-preview.png`
- `docs/screenshots/covaunt-mobile-preview.png`

These are design-preview screenshots only. `web/src/config.js` has empty account IDs, so the wallet and transaction controls remain disabled rather than implying live execution.

## D. Deployment

No COVAUNT testnet account, Sputnik DAO account, funded signer, keychain, deployment transaction, code hash, recipient balance, explorer URL or HTTPS hosting destination was available. Nothing has been deployed or published from this workspace. The exact remaining sequence is in `docs/DEPLOYMENT.md`.

## E. Testing record

| Command | Result |
|---|---|
| `npm install` | PASS on Windows after `.npmrc` platform fix; advisories disclosed |
| `npm test` | 12 passed, 0 failed, 0 skipped |
| `npm run proof` | PASS; illustrated 8/6/4 allocation |
| `npm run verify:static` | PASS; 13 required files |
| `cd contract && cargo test` | 13 passed, 0 failed, 0 ignored; doc tests 0 |
| `cargo near build non-reproducible-wasm --no-abi` | PASS; hash recorded above |
| `npm run test:sandbox` | 1 passed, 0 failed, 0 skipped under WSL/Linux; Sandbox 2.14.0 |
| `cd web && npm install` | PASS; 10 low production advisories in wallet dependency graph |
| `cd web && npm run build` | PASS with third-party bundle warnings |
| `cd web && npm run test:browser` | 10 passed, 0 failed, 0 skipped |

The receipt test produced actual local Sandbox logs for `spend_settled`, `spend_failed`, restored availability, `refund_settled`, `ERR_DAO_ONLY`, `ERR_NOT_ENOUGH_ELIGIBLE_CAPITAL` and `ERR_REPLAY`.

## F. Submission materials

The README, contract API, architecture, threat model, acceptance matrix, deployment runbook, demo storyboard, track recommendation, public X draft, screenshots, evidence template and security review are included. The recommended category is **Social Money**, with DAO/governance infrastructure as a secondary category where available.

The submission is not yet ready to advertise as a live deployment. Replace placeholders only after collecting real testnet evidence and an authorized public repository/HTTPS URL.

## G. Blocking issues

1. Provide or authorize a funded NEAR testnet deployer and donor/council accounts.
2. Create and verify the genuine Sputnik DAO: account, code hash, council policy, threshold and proposal bond.
3. Run `bash scripts/deploy-testnet.sh`, `node scripts/audit-testnet.mjs`, the full donor/DAO/refund workflow and the live browser wallet flow.
4. Record code hash, all transaction receipts, final recipient balances, logical and physical solvency, and FullAccess-key review in `docs/EVIDENCE_TEMPLATE.json`.
5. Authorize a public HTTPS host and repository push if publication is required; then run the production browser-to-wallet verification.

Until those external steps are complete, the correct release statement is local engineering complete, testnet verification blocked, not audited and not approved for real-value funds.
