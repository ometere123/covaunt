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
| Next production build | PASS; all required routes generated |
| Browser tests | PASS; 14/14 across desktop and mobile Chromium |

## Remaining limitations

1. The vault still has a FullAccess key capable of replacing code. No immutable-upgrade claim is permitted.
2. The installed near-connect manifest verified HOT and Meteor testnet wallet options. HERE is not claimed because it was not present in that manifest.
3. A real wallet-to-frontend write walkthrough was not independently exercised in this migration. The historical testnet writes are preserved as receipt evidence.
4. No public HTTPS URL is claimed. Hosting requires an authorized Vercel or equivalent target and a browser verification pass.
5. No professional security audit is claimed.
6. Work records, completion evidence and reputation are not implemented in the deployed vault and are not shown as facts.

## Release handling

Do not upgrade, redeploy, remove keys, use mainnet or submit externally without explicit human authorization. The source and evidence are suitable for an authorized testnet hackathon handoff with these disclosures.
