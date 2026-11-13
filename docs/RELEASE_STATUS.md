# COVAUNT — release verification status

**Verification date:** 13 November 2026 (Africa/Lagos)
**Verdict:** `READY_WITH_DISCLOSED_LIMITATIONS` for local engineering review; **not a live testnet release**.  
**Network target:** NEAR testnet only.  
**Account preparation:** `covauntops26.testnet` and `vault.covauntops26.testnet` were confirmed by final testnet RPC. The target had 7 NEAR and `view_code` returned `NO_CONTRACT_CODE`; no DAO or deployment transaction is claimed.

## Executed gates

| Gate | Result | Evidence |
|---|---|---|
| Node allocator and invariant tests | **PASS — 12/12** | `npm test` |
| Deterministic 8/6/4 proof | **PASS** | `npm run proof` |
| Static preflight | **PASS — 13 required files** | `npm run verify:static` |
| Rust contract tests | **PASS — 13/13; 0 failed; 0 ignored** | `cd contract && cargo test` under WSL/Linux |
| Contract WASM | **PASS** | `cargo near build non-reproducible-wasm --no-abi` |
| NEAR Sandbox receipts | **PASS — 1/1; 0 failed; 0 skipped** | `npm run test:sandbox` under WSL/Linux |
| Web production bundle | **PASS** | `cd web && npm run build` |
| Browser UI | **PASS — 10/10** | `cd web && npm run test:browser` on desktop/mobile Chromium |
| Real Sputnik DAO lifecycle | **BLOCKED** | No Sputnik DAO account, policy or code hash exists yet |
| NEAR testnet deployment and evidence | **BLOCKED** | Target account exists and is funded, but DAO verification and deployment are intentionally pending |
| Public HTTPS deployment | **BLOCKED** | No authorized HTTPS hosting target supplied |
| Independent professional audit | **NOT_RUN** | Outside this workspace's available access |

## Toolchain record

- Windows: Node.js `v22.23.3`, npm `10.9.9`.
- WSL/Linux: Node.js `v22.23.5`, npm `10.9.9`, Rust `1.95.0`, cargo `1.95.0`.
- Contract dependency: `near-sdk = 5.30.1`.
- WASM builder: `cargo-near-near 0.23.0`.
- Receipt runtime: NEAR Sandbox `2.14.0`.
- Browser: Playwright Chromium `158.0.8127.18`.

## WASM artifact

`contract/target/near/covaunt.wasm` is generated and intentionally ignored by source packaging rules. The verified local artifact is 183,746 bytes with:

```text
SHA-256: 96762824a7226f90981b9685890146d94f4a06dc8a3e66e1f9893254f9896888
SHA-256 (base58): B8LetBV7jQjzL8yPjkLbvy73NALaUpAn86FVsBqTjE9u
```

This is a local build hash, not an on-chain code hash. A testnet deployment must record the hash returned by NEAR RPC after deployment and compare it with the artifact.

## Receipt-level security behavior verified locally

- Non-DAO direct `execute_spend` call fails with `ERR_DAO_ONLY`.
- The 8/6/4 scenario pays 6 NEAR from the healthcare-only contribution and 3 NEAR from the flexible contribution; the education-only balance remains 8 NEAR.
- A DAO-identity call that requests incompatible capital fails with `ERR_NOT_ENOUGH_ELIGIBLE_CAPITAL`.
- Reusing a mandate ID fails with `ERR_REPLAY`.
- A native transfer to a nonexistent recipient records `spend_failed` and restores the reserved donor availability.
- An expired contribution refund records `refund_settled` and updates donor accounting through the asynchronous callback.
- Final sandbox summary reports `is_balanced: true`, `total_paid: 9 NEAR`, and `total_refunded: 1 NEAR`.

The sandbox uses a controlled account as the DAO predecessor. It does **not** prove a real Sputnik vote or testnet DAO execution. This distinction is intentional.

## Known limitations and blockers

- `web/src/config.js` still contains empty `contractId` and `daoId`, so the UI remains in explicit design preview and transaction controls are disabled.
- No testnet DAO code hash, policy, proposal bond, council membership, receipt, recipient balance or deployed contract code exists in this artifact. The proposed target account is `vault.covauntops26.testnet`.
- The contract's logical conservation invariant is tested; physical liquid balance, storage staking, account keys and pending obligations require the live audit script after deployment.
- Contract upgrade authority is a deployment-account concern. Until live FullAccess keys are reviewed and deliberately handled, no immutable-upgrade claim is permitted.
- `npm audit` reports 10 low-severity production dependency findings in the web wallet dependency graph through `elliptic`; `npm audit fix --force` proposes a breaking wallet-selector downgrade and was not applied. This is a release-review item, not evidence of a contract exploit.
- The build emits two known third-party warnings (`util` externalization and `js-sha256` eval). The bundle still builds and browser tests pass.

The required next step for a live submission is the testnet sequence in `docs/DEPLOYMENT.md`, followed by filling `docs/EVIDENCE_TEMPLATE.json` only from actual RPC and explorer results.
