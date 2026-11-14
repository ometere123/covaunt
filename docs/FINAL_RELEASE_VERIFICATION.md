# COVAUNT final release verification

**Verification date:** 14 November 2026 (Africa/Lagos)
**Network:** NEAR testnet for COVAUNT and Work & Trust; near.social reads public mainnet data only
**Release branch:** `main`
**Merged pull request:** [#8](https://github.com/ometere123/covaunt/pull/8)
**Current main head:** `717339d54b79fe433b913e712837d565e0da1c6c`
**Production deployment:** `dpl_9v8BmTRE87UgSgFhxdeAE4J6XXZZ` at `https://covaunt.vercel.app`
**Verdict:** `READY_WITH_DISCLOSED_LIMITATIONS`

This report records verified state; a submitted transaction, an approved DAO proposal, or a connected browser does not by itself prove downstream payment settlement.

## Preserved Treasury evidence

The original vault is `vault.covauntops26.testnet`, bound to Sputnik DAO `covaunt26.sputnikv2.testnet`, with deployed code hash `B8LetBV7jQjzL8yPjkLbvy73NALaUpAn86FVsBqTjE9u`. It was not redeployed, upgraded, or used to fund Work & Trust.

The latest read-only audit reports 18.2 NEAR deposited, 9 NEAR paid, 0.1 NEAR refunded, 9.1 NEAR available, zero pending obligations, and balanced accounting. The preserved evidence includes:

- authorized 9 NEAR healthcare settlement: [Gv7yUyZ24J...](https://explorer.testnet.near.org/transactions/Gv7yUyZ24JkPSW4p12pM8cLG48e83ZkMkzagZAENioG1)
- unanimously approved but downstream-rejected 2 NEAR diversion: [BdP4EaxE...](https://explorer.testnet.near.org/transactions/BdP4EaxEdfGXda1k1LnCow5JJZBC5Z7k5rdBWGoskArw)
- successful 0.1 NEAR refund: [DKJEShdG...](https://explorer.testnet.near.org/transactions/DKJEShdGxtLai6xPdRC7JzJ8EwAggv4jqHkz2RLRzU7V)

The vault still has one upgrade-capable FullAccess key. This release makes no immutability claim and does not remove the key. See `docs/live-evidence/current-audit.json` and `docs/SECURITY_REVIEW.md`.

## Work & Trust live deployment

Work & Trust is separately funded at `covaunt-work.testnet` and initialized against `covaunt26.sputnikv2.testnet`. It does not custody or access the original vault’s restricted donor principal.

- artifact: `work-contract/artifacts/covaunt_work.wasm`
- artifact size: 216,158 bytes
- artifact SHA-256: `50e3ea76d1d0da8d2cdfaf977149e59c76277dd85a3c92e44baee54188204500`
- deployed code hash: `6SmBmxFQQaAhnP19yadMa1A5eroNg98jh1qYgQm2yNsh`
- account creation: [5vWHG1Wa...](https://explorer.testnet.near.org/transactions/5vWHG1WaX37FsKDxuWpaoSPDF3WS88xgzJv7tg51gjdY)
- deploy and initialization: [8t8EgAx...](https://explorer.testnet.near.org/transactions/8t8EgAxLMAUx94sEMpiXAa2mpq4R2P1QN6cycjuxfeZF)

The live Work audit passes code-hash, DAO-binding, solvency and accounting checks. At audit time it contained three real tasks with 0.42 NEAR total budget, 0.0000002 NEAR settled, 0.4199998 NEAR available, and zero pending reward or refund obligations. The small live reward was intentionally tiny (`0.0000001` NEAR) to keep isolated testnet exposure low; it must not be described as a 0.1 NEAR payment.

### Verified live task transitions

Small reward, task 0: create [HYTv4njC...](https://explorer.testnet.near.org/transactions/HYTv4njC1Bwj531MKU3uq8efSyxs39dSErN41Q8h9w3D), claim [JhVyQnQ...](https://explorer.testnet.near.org/transactions/JhVyQnQX6JSephP7Gxu658AkE8YMed2qfKKmon2dcvb), submit [8iUteTZ...](https://explorer.testnet.near.org/transactions/8iUteTZSaxkiAGCeUrKdcbVPBczPr87w4TsDVqak4SMy2), and verifier-triggered callback settlement [ByKsvV1...](https://explorer.testnet.near.org/transactions/ByKsvV1RqoZuEqXQJ5xaD1vANYmGbzhutNhVQ7fzfqVD). Final task state is `Settled`; contributor reputation increased only after the settled payout callback.

Medium reward, task 1: create [4c6e5p6...](https://explorer.testnet.near.org/transactions/4c6e5p6yoAUAAMqDwWa2cXjLbkSnBsR2FQ7jGZHjczPV), claim [FVfn7wD...](https://explorer.testnet.near.org/transactions/FVfn7wDnCDcJpUgmxKn3dseMgLBbCsmPRsUHCUBQsnZg), submit [EjJPKJ...](https://explorer.testnet.near.org/transactions/EjJPKJUsygUMcxaX2YzBr11LHaYb1jaj9LjnsGirhEQP), verify [BjZuSX...](https://explorer.testnet.near.org/transactions/BjZuSXqr388YF17zYtzmvxZHZu4hPAqpEFgotjX9UTBa), reject unauthorized approval with `ERR_APPROVER_ONLY` [6porz54...](https://explorer.testnet.near.org/transactions/6porz54xLrizrXgiwxsCYUiNvt1F4mzdGoUthQrzUrz7), then settle through the designated approver [ExcSSg...](https://explorer.testnet.near.org/transactions/ExcSSgyaofEEyYCVZmAawSHQjdTnFUSc4otUx2EqmEWm). Final task state is `Settled`.

Large DAO-gated reward, task 2: create [D92jyrL...](https://explorer.testnet.near.org/transactions/D92jyrL2JB5SWM9hBUGTWpaJ7iWXiaNLoEQeVgkwmc8d), claim [HGcqZ4S...](https://explorer.testnet.near.org/transactions/HGcqZ4SbUMpy3cxWpT9y5Jch2KhB9Gy8MR6N1V3uCaRc), submit [6jK6wzq...](https://explorer.testnet.near.org/transactions/6jK6wzq4bEvUg74yR8AKvzjKqtQopvY2yTMHhHoTsVR1), verify [7dhL3T...](https://explorer.testnet.near.org/transactions/7dhL3TY7RaNe7T8QpGHiCyX2MpJxwF1KPCR5Tzc8Yy5), and demonstrate direct non-DAO rejection with `ERR_DAO_ONLY` [AhgkNNS...](https://explorer.testnet.near.org/transactions/AhgkNNSBpDkcsuf2tfRw5oEQcPtMiUQdwonTVRMidDWi). Sputnik proposal 2 was created with `execute_large_reward` and received the first council approval [2xS5TM...](https://explorer.testnet.near.org/transactions/2xS5TM68Rs8MPKpG2UMWzQYXg39nbSbNZuGQ2ubc8oxX), [GNumfec...](https://explorer.testnet.near.org/transactions/GNumfeci5gMZw2n4Kw4yonh2GoWzrp1RCtLgkYBHZ1oE). It remains `InProgress` pending the second council signer; no payout is claimed. The second approval and callback settlement are `BLOCKED_EXTERNAL` until that council-controlled wallet signs.

The full structured record is `docs/live-evidence/work-evidence.json`.

## Product and integration scope

- The Next.js application has real routes for treasury, covenants, mandates, journal, governance, Work & Trust, task detail and contributor profiles.
- The wallet caption is exactly `Select a testnet wallet`. The UI does not claim testnet signing support for a wallet that has not been exercised.
- Work pages render live contract state only when `NEXT_PUBLIC_COVAUNT_WORK_CONTRACT` is configured; otherwise they remain explicitly unconfigured.
- near.social is retained as a read-only mainnet context with readable summaries and source attribution. It is not used for testnet custody, work verification or reputation.
- Trezu is deliberately not integrated. No duplicate treasury, mock adapter, logo-only provider claim, or fund transfer was added. The technical comparison is in `docs/TREZU_INTEGRATION.md`.

## Verification gates

Local checks passed:

| Command | Result |
| --- | --- |
| `npm test` | PASS: 12/12 |
| `npm run proof` | PASS |
| `npm run verify:static` | PASS: 41 required files |
| `cargo test --manifest-path contract/Cargo.toml` | PASS: 13/13 |
| `cargo test --manifest-path work-contract/Cargo.toml` | PASS: 17/17 |
| `npm --prefix web run typecheck` | PASS |
| `npm --prefix web run lint` | PASS, zero warnings |
| `npm --prefix web run build` | PASS, 15 routes |
| `npm run test:browser` | PASS: 22/22 desktop/mobile Chromium |
| `npm run test:sandbox` in WSL | PASS: 2/2, no skips |

GitHub Actions run [43593516260](https://github.com/ometere123/covaunt/actions/runs/43593516260) passed both jobs:

- `interface`: PASS, 22 browser tests.
- `contract`: PASS, vault 13 tests, Work 17 tests, both WASM builds and uploads, sandbox receipt tests 2/2.

The only CI annotations are upstream runner notices about Node 20 action compatibility and the future `ubuntu-latest` image migration; no test was skipped or weakened.

## External release gates

1. `BLOCKED_EXTERNAL`: second Sputnik council signature for proposal 2 and final large-reward callback settlement.
2. `BLOCKED_EXTERNAL`: a real wallet-controlled browser signing session. Meteor Web was checked but reported no account for external-app connection; no private key or seed phrase was accessed. The public read-only experience is verified, but wallet signing must not be claimed until a supported testnet wallet completes a real transaction.
3. `BLOCKED_EXTERNAL`: final hackathon submission identity fields and the genuine NEAR mainnet payout account were not supplied in this workspace. No submission or X post is claimed here.

The release does not remove the vault FullAccess key, upgrade either existing contract, use mainnet funds, or move restricted donor capital. The Work & Trust demonstration is isolated testnet capital only.
