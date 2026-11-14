# COVAUNT release status

**Verification date:** 14 November 2026
**Verdict:** `READY_WITH_DISCLOSED_LIMITATIONS`
**Network:** NEAR testnet only

## Verified live identity

- Vault: `vault.covauntops26.testnet`
- Sputnik DAO: `covaunt26.sputnikv2.testnet`
- Vault code hash: `B8LetBV7jQjzL8yPjkLbvy73NALaUpAn86FVsBqTjE9u`
- Work & Trust account: `covaunt-work.testnet`
- Work code hash: `6SmBmxFQQaAhnP19yadMa1A5eroNg98jh1qYgQm2yNsh`
- Work artifact SHA-256: `50e3ea76d1d0da8d2cdfaf977149e59c76277dd85a3c92e44baee54188204500` (216,158 bytes)
- DAO proposal bond: `1 NEAR`
- Display name: `COVAUNT`

## Public deployment

- URL: `https://covaunt.vercel.app`
- Vercel project: `covaunt` in `delealufejoel-4184s-projects`
- Production configuration: `NEXT_PUBLIC_COVAUNT_WORK_CONTRACT=covaunt-work.testnet`
- Production deployment: `dpl_9v8BmTRE87UgSgFhxdeAE4J6XXZZ`
- Functional production release commit: `0b1f69a8f0a66553295103b575e2cac94659407f` (merged PR #11); the subsequent release-record PR changes documentation only; Vercel immutable deployment IDs rotate per reviewed push.

## Live financial evidence

The latest read-only vault audit reports `18.2 NEAR` deposited, `9 NEAR` paid, `0.1 NEAR` refunded, `9.1 NEAR` available and zero pending obligations. The ledger is balanced. The original evidence snapshot retaining the 18.1 NEAR four-contribution history remains in `docs/live-evidence/evidence.json`; the current audit is in `docs/live-evidence/current-audit.json`.

The Work account was separately funded and initialized with a 1 NEAR reserve. Its live audit passed with a balanced zero-liability state before tasks were exercised. Live task receipts and final summaries are in `docs/live-evidence/work-evidence.json`.

## Engineering gates

| Gate | Result |
| --- | --- |
| Node allocator tests | PASS; 12/12 |
| Deterministic proof | PASS |
| Static preflight | PASS |
| Vault Rust tests | PASS; 13/13 |
| Work Rust tests | PASS; 17/17, no ignored tests |
| Vault and Work WASM | PASS; both artifacts built and uploaded by CI; Work artifact is source-matched to the deployed hash |
| Sandbox receipts | PASS; 2/2 in Linux/CI, no skips |
| Next typecheck | PASS |
| Next lint | PASS; zero warnings |
| Next production build | PASS; 15 route entries |
| Browser suite | PASS; 22/22 desktop and mobile Chromium |
| Vault read-only audit | PASS for accounting/source match; expected non-zero security signal because FullAccess remains |
| Work read-only audit | PASS; code hash, DAO binding, reserve, solvency and balanced summary |
| Live Work small reward | VERIFIED_LIVE; task 0 settled through verifier callback |
| Live Work medium reward | VERIFIED_LIVE; task 1 unauthorized approval rejected, designated approver settled |
| Live Work large reward | IN_PROGRESS; task 2 verified and Sputnik proposal 2 has first council approval; second council receipt and Work callback remain required before settlement claim |
| Wallet-signed browser write | BLOCKED_EXTERNAL; production chooser opened, but the existing Chrome profile has no connected wallet controlling the required signer |
| near.social | VERIFIED_LIVE read-only mainnet context; no signed posting |
| Trezu | NOT_IMPLEMENTED by decision; incompatibility documented |
| Professional security audit | NOT_IMPLEMENTED; no independent audit claimed |

## Limitations

1. The vault retains FullAccess key `ed25519:6NDRm1atodNeiXTKk1qeRz9iaqCqX7QjR3zWKB4MhGAz`; COVAUNT does not claim upgrade immutability.
2. Work verification is a named-account attestation model. It records contract outcomes, not independent proof of physical-world work or identity independence.
3. A real wallet-signed browser write still needs an authorized wallet account in Chrome. CLI-signed testnet receipts are not represented as graphical wallet evidence.
4. near.social remains optional public mainnet context and is not linked automatically to testnet identities or reputation.
5. No professional security audit or mainnet-readiness claim is made.

## Release handling

Do not upgrade the original vault or DAO, remove keys, use mainnet funds or submit the hackathon form until the remaining human gates are explicitly verified. The Work account is isolated and must never be funded from restricted donor principal.
