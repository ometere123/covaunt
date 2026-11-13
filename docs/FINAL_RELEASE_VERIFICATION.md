# COVAUNT final release verification

**Artifact:** `COVAUNT_RELEASE_HANDOFF`
**Verification date:** 13 November 2026 (Africa/Lagos)
**Network:** NEAR testnet for COVAUNT; near.social reads public mainnet data only
**Branch:** `feature/covaunt-work-trust`
**Verdict:** `READY_WITH_DISCLOSED_LIMITATIONS`

## Preserved live identity and evidence

The deployed vault is `vault.covauntops26.testnet`; its stored Sputnik DAO is `covaunt26.sputnikv2.testnet`; its recorded code hash is `B8LetBV7jQjzL8yPjkLbvy73NALaUpAn86FVsBqTjE9u`. `docs/live-evidence/evidence.json` preserves the valid settlement, failed override, early refund and successful refund receipts.

The preserved evidence snapshot records 18.1 NEAR deposited across four contributions, 9 NEAR paid, 0.1 NEAR refunded, 9 NEAR available, zero pending obligations and balanced. A later read-only audit at `2026-11-13T22:31:39.251Z` reports the current chain at 18.2 NEAR deposited across five contributions, 9 NEAR paid, 0.1 NEAR refunded, 9.1 NEAR available, zero pending obligations and balanced; the fifth entry is COV-004, a 0.1 NEAR available contribution from `elpadree.testnet`. The audit initiated no transaction. The vault still has a FullAccess key capable of replacing code. This release makes no immutable-upgrade claim and did not remove or change that key. See [current-audit.json](live-evidence/current-audit.json).

## Product changes

- Preserved the deployed vault and DAO configuration without redeploying or upgrading either account.
- Corrected the wallet caption to `Select a testnet wallet`; the interface does not claim unverified HOT/Meteor testnet signing support. On mobile, Connect wallet remains visible in the header; the hamburger only opens navigation.
- Added a separate Rust `work-contract/` for task funding, one claimant, evidence, verifier decisions, bounded reward tiers, disputes, callbacks and contract-derived contributor stats. It has no vault account, donor map or unrestricted withdrawal path.
- Added real Next.js routes for `/work`, `/work/funding`, `/work/submit`, `/work/tasks/[id]` and `/contributors/[account]`. The public app shows no work records unless `NEXT_PUBLIC_COVAUNT_WORK_CONTRACT` is explicitly configured.
- Added a read-only near.social mainnet FastData KV boundary. Signed posting is disabled and social activity is not work evidence or reputation.
- Investigated Trezu and documented the exact compatibility boundary; no provider-only label or duplicate treasury was added.

## Executed local gates

| Command | Result |
| --- | --- |
| `npm ci` | PASS at the preserved root checkout |
| `npm test` | PASS at the preserved release checkpoint |
| `npm run proof` | PASS at the preserved release checkpoint |
| `npm run verify:static` | PASS after Work & Trust preflight additions |
| `cargo test --manifest-path work-contract/Cargo.toml` | PASS: 12/12, no ignored tests |
| `cargo near build non-reproducible-wasm --manifest-path work-contract/Cargo.toml --no-abi` | PASS: 214,944-byte artifact |
| `npm --prefix web run typecheck` | PASS |
| `npm --prefix web run lint` | PASS; zero warnings |
| `npm --prefix web run build` | PASS; 15 route entries |
| `npm run test:browser` | PASS: 22/22 desktop/mobile Chromium |
| `npm run test:sandbox` on Windows | Expected environment block: Windows cannot execute the Linux sandbox binary |
| `npm run test:sandbox` in WSL Linux Node 22 | PASS: 2/2 receipt/state-machine tests, no skips; preserved vault plus Work & Trust callback and DAO-only rejection |

The preserved vault sandbox receipt test and the new Work sandbox test both passed in the Linux WSL run. The Work test remains a local sandbox result, not public testnet evidence.

## Artifact records

Preserved vault artifact:

- `contract/artifacts/covaunt.wasm`
- Size: 183,746 bytes
- SHA-256: `96762824A7226F90981B9685890146D94F4A06DC8A3E66E1F9893254F9896888`
- Deployed code hash: `B8LetBV7jQjzL8yPjkLbvy73NALaUpAn86FVsBqTjE9u`

Auxiliary Work & Trust artifact:

- `work-contract/artifacts/covaunt_work.wasm`
- Size: 214,944 bytes
- SHA-256: `4743f7dcf2fd61607e717c78d744340451f11c357a7596eeeca7919dc47f6107`
- Testnet account: none; deployment intentionally not performed

## Hosted preview verification

- Preview: `https://covaunt-git-feature-covaunt-db31e4-delealufejoel-4184s-projects.vercel.app`
- Source: `feature/covaunt-work-trust` at `a7dbb10f9245d8497dc75a5847ea096378497907`
- Deployment: `dpl_9FNhHdDauu8snKeiMw15STYGVHoS`, READY
- Hosted checks: all required public routes returned HTTP 200; live treasury reads reached final RPC state; mobile layout kept the wallet control visible and had no horizontal overflow; Work & Trust remained explicitly unconfigured; no production alias was created.

## Human and external gates remaining

1. Exercise one real supported testnet wallet through the public preview. Verify connection, persistence, explicit approval and returned state; no wallet compatibility is claimed until that happens.
2. Do not enable `NEXT_PUBLIC_COVAUNT_WORK_CONTRACT` publicly until a separately funded auxiliary account, source-matched hash and real small/medium/large authorization evidence exist.
3. Review the vault FullAccess key. Lockdown is irreversible unless another recovery key exists; perform it only with explicit human authorization and a tested recovery plan.
4. Do not redeploy, upgrade, remove keys, move donor funds, use mainnet for COVAUNT or submit the hackathon application from this release work.

No mainnet COVAUNT transaction, contract upgrade, key deletion, auxiliary testnet deployment or hackathon submission was performed.
