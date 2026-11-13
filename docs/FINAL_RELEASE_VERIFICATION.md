# COVAUNT final release verification

**Artifact:** `COVAUNT_RELEASE_HANDOFF`
**Verification date:** 13 November 2026 (Africa/Lagos)
**Network:** NEAR testnet
**Verdict:** `READY_WITH_DISCLOSED_LIMITATIONS`

## Identity and evidence

The configured vault is `vault.covauntops26.testnet`; its immutable stored DAO is `covaunt26.sputnikv2.testnet`. The recorded deployed code hash is `B8LetBV7jQjzL8yPjkLbvy73NALaUpAn86FVsBqTjE9u`. `docs/live-evidence/evidence.json` was retrieved at `2026-11-13T10:15:56.256Z` and preserves the valid settlement, failed override, early refund and successful refund receipts.

The live accounting snapshot is 18.1 NEAR deposited, 9 NEAR paid, 0.1 NEAR refunded, 9 NEAR available, zero pending obligations and balanced. The read-only account audit estimates liquid principal backing after storage staking, but exits with a deliberate security blocker because a FullAccess key can replace the vault code.

## Frontend correction

The retired Vite single page was replaced with Next.js App Router and TypeScript. Required routes are real filesystem routes, not hash sections. The application has a shared live/preview data boundary, explicit error/loading states, a live treasury register, covenant details and refund action, Sputnik proposal and vote workflows, separate DAO/vault states, a public journal, governance policy view, a scope-honest Work page and architecture disclosures.

Wallet integration uses `@hot-labs/near-connect` 0.12.0. Its installed current manifest exposed HOT and Meteor on testnet. HERE is not advertised because it was not exposed by the verified manifest. The frontend contains no private keys, seed phrases or passwords.

## Executed gates

| Command | Result |
| --- | --- |
| `npm ci` | PASS in root checkout |
| `npm test` | PASS: 12/12 |
| `npm run proof` | PASS |
| `npm run verify:static` | PASS |
| `cd contract && cargo test` | PASS: 13/13, no ignored tests; WSL |
| `cargo near build non-reproducible-wasm --no-abi` | PASS; 183,746-byte artifact |
| `npm run test:sandbox` | PASS: 1/1 receipt/state-machine test, no skips; WSL NEAR Sandbox 2.14.0 |
| `cd web && npm ci` | PASS; Node 22.23.3 / npm 10.9.9 |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS; 0 warnings |
| `npm run build` | PASS; 10 routes generated |
| `npm run test:browser` | PASS; 14/14 desktop/mobile Chromium |
| `npm run verify:live` | Read-only audit values PASS; command exits 1 on intentional FullAccess blocker |

## Browser evidence

The Playwright suite is split into:

- `web/tests/preview.spec.mjs`: deterministic `?mode=preview`, no writes, no live claims, mobile overflow and menu checks.
- `web/tests/live.spec.mjs`: labeled RPC fixtures for final ledger interpretation, route navigation and wallet-gated error handling. These fixtures are not chain evidence.

A real HOT or Meteor wallet signature and hosted browser return was not independently exercised during this migration. That remains an external verification step, not a hidden pass. Screenshots reviewed locally are in `docs/screenshots/covaunt-next-live.png`, `docs/screenshots/covaunt-next-desktop.png` and `docs/screenshots/covaunt-next-mobile.png`.

## Artifact

`contract/artifacts/covaunt.wasm` is 183,746 bytes. SHA-256:

```text
96762824A7226F90981B9685890146D94F4A06DC8A3E66E1F9893254F9896888
```

Base58 code hash:

```text
B8LetBV7jQjzL8yPjkLbvy73NALaUpAn86FVsBqTjE9u
```

## Blocking actions requiring a human

1. Review the FullAccess-key recovery and immutability decision. Do not delete it automatically.
2. Authorize and verify a public HTTPS host if one is required.
3. Exercise a real testnet wallet flow through the public host, including contribution, proposal creation, council vote, final settlement observation and eligible refund.
4. Review and authorize any GitHub push, hosting publication or hackathon submission.

No mainnet transaction, contract upgrade, key deletion or hackathon submission was performed by this release work.
