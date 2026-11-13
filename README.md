# COVAUNT

> Collective decisions. Individual consent.

COVAUNT is a Social Money treasury on NEAR. Communities pool native NEAR and govern spending through a genuine Sputnik DAO, while each donor’s purpose and recipient restrictions remain enforceable in the vault. A majority can approve a proposal; it cannot invent a donor’s permission.

## Live testnet identity

The current evidence set records a real NEAR testnet deployment. It is not a claim of mainnet readiness or an independent security audit.

| Item | Verified value |
| --- | --- |
| Vault | `vault.covauntops26.testnet` |
| Sputnik DAO | `covaunt26.sputnikv2.testnet` |
| Network | NEAR testnet |
| Contract code hash | `B8LetBV7jQjzL8yPjkLbvy73NALaUpAn86FVsBqTjE9u` |
| DAO proposal bond | `1 NEAR` (`1000000000000000000000000` yoctoNEAR) |
| Evidence retrieval | `2026-11-13T10:15:56.256Z` |

The authorized public preview is [covaunt-git-release-covaunt-260dfa-delealufejoel-4184s-projects.vercel.app](https://covaunt-git-release-covaunt-260dfa-delealufejoel-4184s-projects.vercel.app), built from branch `release/covaunt-nextjs-vercel-preview` at commit `e084c09`. It is a Vercel preview only; no production alias, contract deployment or DAO upgrade was performed.

At that recorded audit, the ledger reported `18.1 NEAR` deposited, `9 NEAR` paid, `0.1 NEAR` refunded, `9 NEAR` available, zero pending spend, zero pending refund and `is_balanced: true`. The account-solvency estimate backed outstanding donor principal, but the audit also found a FullAccess key capable of replacing contract code. COVAUNT therefore does not claim upgrade immutability.

## Why it is different

Ordinary DAO treasuries answer: “Did the governing body approve this?” COVAUNT asks a second, independent question at the custody boundary: “Which immutable donor conditions authorize this exact purpose and recipient?” Compatible covenants are allocated deterministically, reserved before the native transfer, and only marked paid after the asynchronous callback succeeds. Failed transfers restore reservations. Expired unused balances can be reclaimed by the original donor.

The live evidence demonstrates the full distinction:

- [9 NEAR valid healthcare settlement](https://explorer.testnet.near.org/transactions/Gv7yUyZ24JkPSW4p12pM8cLG48e83ZkMkzagZAENioG1)
- [2 NEAR forbidden proposal / failed downstream execution](https://explorer.testnet.near.org/transactions/BdP4EaxEdfGXda1k1LnCow5JJZBC5Z7k5rdBWGoskArw)
- [0.1 NEAR successful donor refund](https://explorer.testnet.near.org/transactions/DKJEShdGxtLai6xPdRC7JzJ8EwAggv4jqHkz2RLRzU7V)

The forbidden case is especially important: Sputnik approval is not payment success. COVAUNT rejected the downstream attempt because the available donor capital could not satisfy the requested restrictions.

## Application

The frontend is a real Next.js App Router application with live and preview modes separated at the data boundary. The public routes are:

- `/` — product explanation and verified live overview
- `/treasury` — reconciliation, reserve and ledger register
- `/covenants` — donor permissions and the contribution form
- `/covenants/[id]` — principal, restrictions, settlement fields and donor-only refund action
- `/mandates` — contract allocation quote, Sputnik proposal form and DAO docket
- `/mandates/[id]` — separate DAO and vault execution states
- `/journal` — receipt-linked settlement, failed override and refund evidence
- `/governance` — live DAO policy, council role and proposal bond
- `/work` — explicit scope boundary; no invented task or reputation records
- `/about` — architecture, security limitations and deployment identity

Live pages read final NEAR JSON-RPC state through a same-origin, read-only `/api/near-rpc` route restricted to NEAR testnet `query` calls. They never fall back to sample balances when RPC fails. `?mode=preview` is deterministic and visibly illustrative; all write controls are disabled.

### Visual review

The reviewed application captures are [desktop live mode](docs/screenshots/covaunt-next-live.png), [desktop preview mode](docs/screenshots/covaunt-next-desktop.png) and [mobile preview mode](docs/screenshots/covaunt-next-mobile.png). Preview imagery is labelled and does not represent a chain transaction.

Wallet connection uses the current `@hot-labs/near-connect` ecosystem. The verified manifest exposes a multi-wallet chooser including HOT and Meteor on testnet. HERE Wallet is not advertised because it was not exposed by the installed current manifest. COVAUNT never asks for private keys, seed phrases or wallet passwords.

## Repository map

```text
contract/                 Rust near-sdk contract and compiled artifact
web/app/                  Next.js App Router routes
web/components/           Client data, wallet and workflow components
web/lib/                  RPC, near-connect, formatting and typed domain helpers
web/tests/                Preview and RPC-fixture browser suites
tests/                    Node allocator and invariant tests
scripts/                  Proof, sandbox, audit and deployment helpers
docs/live-evidence/       Supplied raw testnet receipt evidence
docs/                     Architecture, threat model, acceptance and release records
```

## Reproduce the engineering gates

From a clean checkout on Node 22:

```bash
npm ci
npm test
npm run proof
npm run verify:static

cd contract
cargo test
cargo near build non-reproducible-wasm --no-abi
cd ..
npm run test:sandbox

cd web
npm ci
npm run typecheck
npm run lint
npm run build
npx playwright install chromium
npm run test:browser
```

The sandbox gate requires the repository’s verified NEAR Sandbox preparation and a Linux/WSL or CI environment where the pinned binary can run. The browser suite runs 14 tests across desktop and mobile Chromium in this release: deterministic preview, live-mode RPC interpretation, responsive navigation and wallet-gated error handling. Fixture data is labeled as fixture data in the test name and is not evidence of a wallet transaction.

## Contract and deployment references

- [Contract API](docs/CONTRACT_API.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Threat model](docs/THREAT_MODEL.md)
- [Deployment and recovery](docs/DEPLOYMENT.md)
- [Acceptance matrix](docs/ACCEPTANCE.md)
- [Security review](docs/SECURITY_REVIEW.md)
- [Live evidence](docs/live-evidence/evidence.json)
- [Release verification](docs/FINAL_RELEASE_VERIFICATION.md)

The source-matched WASM artifact is `contract/artifacts/covaunt.wasm`, 183,746 bytes, with SHA-256 `96762824A7226F90981B9685890146D94F4A06DC8A3E66E1F9893254F9896888` and base58 code hash `B8LetBV7jQjzL8yPjkLbvy73NALaUpAn86FVsBqTjE9u`. The deployed code hash is recorded from the live evidence; do not rebuild or redeploy this vault as part of frontend work.

## Security disclosure

The deployed vault has a FullAccess key (`ed25519:6NDRm1atodNeiXTkK1qeRz9iaqCqX7QjR3zWKB4MhGAz`) capable of replacing its code. This is a real deployment-security limitation. It is documented, not hidden, and has not been removed by this repository change because key deletion is irreversible without a reviewed recovery plan and explicit human authorization. No private keys or wallet credentials belong in this repository.

COVAUNT proves declared on-chain purpose and recipient conditions. It cannot prove a beneficiary’s off-chain use of funds, work completion or real-world impact. Testnet balances, wallet availability, explorer indexing and RPC uptime are external dependencies.

## Release posture

**Engineering verdict: `READY_WITH_DISCLOSED_LIMITATIONS`.** The contract and frontend gates are reproducible, the supplied testnet evidence is preserved, and the authorized Vercel preview has passed hosted route, responsive, live-RPC and preview-separation checks. The wallet-to-contract write path has not been independently exercised in this migration. Do not remove the FullAccess key, deploy a new contract, upgrade the vault, use mainnet or submit a hackathon application without explicit human authorization.
