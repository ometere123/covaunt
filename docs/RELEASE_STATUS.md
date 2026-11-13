# COVAUNT release status

**Verification date:** 13 November 2026
**Verdict:** `READY_WITH_DISCLOSED_LIMITATIONS`
**Network:** NEAR testnet only

## Verified live identity

- Vault: `vault.covauntops26.testnet`
- Sputnik DAO: `covaunt26.sputnikv2.testnet`
- Code hash: `B8LetBV7jQjzL8yPjkLbvy73NALaUpAn86FVsBqTjE9u`
- Proposal bond: 1 NEAR
- Display name: COVAUNT

## Verified public preview

- URL: `https://covaunt-git-release-covaunt-260dfa-delealufejoel-4184s-projects.vercel.app`
- Vercel project: `covaunt` in `delealufejoel-4184s-projects`
- Git branch: `release/covaunt-nextjs-vercel-preview`
- Git commit: `e084c09b75dd3ab2a766820b8f4f4f72ce2208c5`
- Preview deployment: READY; public HTTPS route checks and live testnet reads passed
- Production release: not published

## Recorded live outcome

At `2026-11-13T10:15:56.256Z`, the evidence set recorded 18.1 NEAR deposited, 9 NEAR paid, 0.1 NEAR refunded, 9 NEAR available, zero pending spend, zero pending refund and a balanced ledger. It includes the valid 9 NEAR settlement, the failed 2 NEAR override, an early locked refund rejection and the successful 0.1 NEAR refund.

## Local engineering gates

| Gate | Result |
| --- | --- |
| Node allocator tests | PASS; 12/12 |
| Deterministic proof | PASS |
| Static preflight | PASS |
| Rust contract tests | PASS; 13/13, no ignored tests; WSL |
| Contract WASM | PASS; source-matched 183,746-byte artifact |
| Sandbox receipts | PASS; 1/1, no skips; WSL NEAR Sandbox 2.14.0 |
| Next typecheck | PASS |
| Next lint | PASS; zero warnings |
| Next production build | PASS; 15 route entries generated, including Work & Trust and contributor routes |
| Browser tests | PASS; 22/22 across desktop and mobile Chromium |
| Hosted preview checks | PASS; routes, mobile navigation, live RPC accounting, preview separation and read-only proxy |
| Work & Trust unit tests | PASS; 12/12 |
| Work & Trust WASM | PASS; 214,944-byte artifact, no testnet account |
| Work & Trust sandbox | PASS; 2/2 combined receipt tests, no skips, in WSL Linux Node 22 / NEAR Sandbox 2.14.0 |
| near.social | PASS as read-only mainnet context boundary; no signed posting |
| Trezu | NOT INTEGRATED; compatibility blocker documented |

## Remaining limitations

1. The vault still has a FullAccess key capable of replacing code. No immutable-upgrade claim is permitted.
2. The installed near-connect manifest exposes wallet options. Specific wallet testnet signing compatibility remains unverified. HERE is not claimed because it was not present in that manifest.
3. A real wallet-to-frontend write walkthrough was not independently exercised in this migration. The historical testnet writes are preserved as receipt evidence.
4. The hosted URL is a testnet preview only. No production release or custom domain is claimed.
5. No professional security audit is claimed.
6. Work & Trust is implemented as a separate, un-deployed auxiliary contract. No live task records, reward settlements or reputation points are claimed.
7. near.social is read-only mainnet context; signed posting and cross-network identity binding are not enabled.
8. The new Work branch requires a hosted preview after publication; the preserved vault-only preview remains the release checkpoint.

## Release handling

Do not upgrade, redeploy, remove keys, use mainnet or submit externally without explicit human authorization. The source and evidence are suitable for an authorized testnet hackathon handoff with these disclosures.
