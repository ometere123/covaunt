# COVAUNT release status

**Verification date:** 14 November 2026
**Verdict:** `READY_WITH_DISCLOSED_LIMITATIONS`
**Network:** NEAR testnet only

## Verified live identity

- Vault: `vault.covauntops26.testnet`
- Sputnik DAO: `covaunt26.sputnikv2.testnet`
- Code hash: `B8LetBV7jQjzL8yPjkLbvy73NALaUpAn86FVsBqTjE9u`
- Proposal bond: 1 NEAR
- Display name: COVAUNT

## Verified public deployment

- URL: `https://covaunt.vercel.app`
- Vercel project: `covaunt` in `delealufejoel-4184s-projects`
- Git branch: `main`
- Production verification commit: `df5123d7eff54ab930bb3eb6f7e78d597cafedf1`
- Deployment inspected: `dpl_Bv9qg1Nh6EP1Bm1f36YCF96pFafq`; READY; public route checks, mobile checks and live testnet reads passed
- Follow-up branch: `feature/covaunt-work-trust-live`; PR [#3](https://github.com/ometere123/covaunt/pull/3)
- Follow-up CI: [Verification run 43580869712](https://github.com/ometere123/covaunt/actions/runs/43580869712); interface and contract jobs passed, including both WASM uploads and sandbox receipts

## Recorded live outcome

At `2026-11-13T10:15:56.256Z`, the preserved evidence set recorded 18.1 NEAR deposited across four contributions, 9 NEAR paid, 0.1 NEAR refunded, 9 NEAR available, zero pending spend, zero pending refund and a balanced ledger. It includes the valid 9 NEAR settlement, the failed 2 NEAR override, an early locked refund rejection and the successful 0.1 NEAR refund. A separate read-only audit at `2026-11-14T01:12:24.4618119Z` reports the current chain at 18.2 NEAR deposited across five contributions, 9 NEAR paid, 0.1 NEAR refunded, 9.1 NEAR available and zero pending obligations. The fifth entry is COV-004, a 0.1 NEAR available contribution from `elpadree.testnet`; see [current-audit.json](live-evidence/current-audit.json).

## Local engineering gates

| Gate | Result |
| --- | --- |
| Node allocator tests | PASS; 12/12 |
| Deterministic proof | PASS |
| Static preflight | PASS |
| Rust contract tests | PASS; 13/13, no ignored tests; WSL |
| Contract WASM | PASS; source-matched 183,746-byte checked-in artifact; final CI upload separately disclosed as non-byte-identical |
| Sandbox receipts | PASS; 1/1, no skips; WSL NEAR Sandbox 2.14.0 |
| Next typecheck | PASS |
| Next lint | PASS; zero warnings |
| Next production build | PASS; 15 route entries generated, including Work & Trust and contributor routes |
| Browser tests | PASS; 22/22 across desktop and mobile Chromium |
| Hosted preview checks | PASS; routes, mobile navigation, live RPC accounting, preview separation and read-only proxy |
| Work & Trust unit tests | PASS; 17/17; no ignored tests |
| Work & Trust WASM | PASS; canonical follow-up CI artifact 216,158 bytes, SHA-256 `50e3ea76d1d0da8d2cdfaf977149e59c76277dd85a3c92e44baee54188204500`, no testnet account |
| Work & Trust sandbox | PASS; 2/2 combined receipt tests, no skips, in WSL Linux Node 22 / NEAR Sandbox 2.14.0 |
| near.social | PASS as read-only mainnet context boundary; no signed posting |
| Trezu | NOT INTEGRATED; compatibility blocker documented |

## Remaining limitations

1. The vault still has a FullAccess key capable of replacing code. No immutable-upgrade claim is permitted.
2. The installed near-connect manifest exposes wallet options. Specific wallet testnet signing compatibility remains unverified. HERE is not claimed because it was not present in that manifest.
3. A real wallet-to-frontend write walkthrough was not independently exercised in this migration. The historical testnet writes are preserved as receipt evidence.
4. The public URL is a Vercel production deployment of the vault-only release; no custom domain is claimed.
5. No professional security audit is claimed.
6. Work & Trust is implemented as a separate, un-deployed auxiliary contract. Role hardening and DAO proposal UI are locally/CI verified; no live task records, reward settlements or reputation points are claimed.
7. near.social is read-only mainnet context; signed posting and cross-network identity binding are not enabled.
8. Work & Trust remains disabled in production because no auxiliary testnet account, real reward settlement or contributor record has been verified. The production app is verified for the honest unconfigured state.

## Release handling

Do not upgrade, redeploy, remove keys, use mainnet or submit externally without explicit human authorization. The source and evidence are suitable for an authorized testnet hackathon handoff with these disclosures.
