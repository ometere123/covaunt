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

The current authorized public preview is [covaunt-git-feature-covaunt-db31e4-delealufejoel-4184s-projects.vercel.app](https://covaunt-git-feature-covaunt-db31e4-delealufejoel-4184s-projects.vercel.app), built from branch `feature/covaunt-work-trust` at application commit `18fdc7b`. It is a Vercel preview only; no production publication, auxiliary contract deployment or DAO upgrade was performed. The preserved vault-only checkpoint remains available from the earlier release branch.

At that recorded evidence snapshot, the ledger reported `18.1 NEAR` deposited across four contributions, `9 NEAR` paid, `0.1 NEAR` refunded, `9 NEAR` available, zero pending spend, zero pending refund and `is_balanced: true`. A later read-only audit on `2026-11-13T22:31:39.251Z` found the live ledger at `18.2 NEAR` across five contributions, `9 NEAR` paid, `0.1 NEAR` refunded, `9.1 NEAR` available and zero pending obligations. The additional live entry is COV-004, a 0.1 NEAR available contribution from `elpadree.testnet`; the audit did not initiate a transaction. The account-solvency estimate backed outstanding donor principal, but the vault still has a FullAccess key capable of replacing contract code. COVAUNT therefore does not claim upgrade immutability. See [the preserved evidence snapshot](docs/live-evidence/evidence.json) and [the current read-only audit](docs/live-evidence/current-audit.json).

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
- `/work` — live auxiliary task register when configured, otherwise an explicit no-fabrication boundary
- `/work/funding` — graphical task funding with isolated attached reward capital
- `/work/submit` and `/work/tasks/[id]` — claimant evidence submission, verification, disputes and callback settlement records
- `/contributors/[account]` — contract-derived work history plus separately labelled near.social context
- `/about` — architecture, security limitations and deployment identity

Live pages read final NEAR JSON-RPC state through a same-origin, read-only `/api/near-rpc` route restricted to NEAR testnet `query` calls. They never fall back to sample balances when RPC fails. `?mode=preview` is deterministic and visibly illustrative; all write controls are disabled.

### Visual review

The reviewed application captures are [desktop live mode](docs/screenshots/covaunt-next-live.png), [desktop preview mode](docs/screenshots/covaunt-next-desktop.png), [mobile preview mode](docs/screenshots/covaunt-next-mobile.png), [Work & Trust desktop](docs/screenshots/covaunt-work-desktop.png) and [Work & Trust mobile](docs/screenshots/covaunt-work-mobile.png). Work imagery shows the explicit unconfigured state and does not represent a deployed task or chain transaction. Preview imagery is labelled and does not represent a chain transaction.

Wallet connection uses the current `@hot-labs/near-connect` ecosystem. The chooser displays only the wallet options exposed by the installed manifest; browser signing compatibility for this release remains an external verification step. HERE Wallet is not advertised because it was not exposed by the installed current manifest. COVAUNT never asks for private keys, seed phrases or wallet passwords. On mobile the Connect wallet control remains visible in the header; the hamburger only opens navigation.

### Work & Trust status

The repository includes a separate Rust Work & Trust contract and graphical flows for task funding, single-account claims, evidence, verifier decisions, medium approvals, DAO-gated large rewards, disputes and contributor records. The contract has passed local unit tests and is built into `work-contract/artifacts/covaunt_work.wasm`. It is not deployed to testnet in this release, so the public app intentionally shows no task or reputation records until `NEXT_PUBLIC_COVAUNT_WORK_CONTRACT` is set to a separately verified account. The work contract never touches the deployed donor vault or existing donor capital.

Small, medium and large reward tiers are enforced in that auxiliary contract, but only locally verified here. No testnet reward tier or work account is claimed. See [Work & Trust](docs/WORK_AND_TRUST.md), [near.social boundary](docs/NEAR_SOCIAL.md) and [Trezu compatibility](docs/TREZU_INTEGRATION.md).

## Repository map

```text
contract/                 Rust near-sdk contract and compiled artifact
work-contract/            Separate task/reward registry, tests and un-deployed WASM
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
cargo test --manifest-path work-contract/Cargo.toml
cargo near build non-reproducible-wasm --manifest-path work-contract/Cargo.toml --no-abi
npm run test:sandbox

cd web
npm ci
npm run typecheck
npm run lint
npm run build
npx playwright install chromium
npm run test:browser
```

The sandbox gate requires the repository’s verified NEAR Sandbox preparation and a Linux/CI environment where the pinned binary can run. It covers both the preserved donor vault and the un-deployed Work & Trust artifact; the Work test is not a real Sputnik vote or testnet evidence. The browser suite runs 22 tests across desktop and mobile Chromium in this release: deterministic preview, live-mode RPC interpretation, responsive navigation, wallet-gated error handling, near.social separation, preview-mode write isolation and explicit no-fabrication behavior for the unconfigured work module. The hosted branch preview also passed route, mobile, live-RPC and unconfigured-Work checks. Fixture data is labeled as fixture data in the test name and is not evidence of a wallet transaction.

## Contract and deployment references

- [Contract API](docs/CONTRACT_API.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Threat model](docs/THREAT_MODEL.md)
- [Deployment and recovery](docs/DEPLOYMENT.md)
- [Acceptance matrix](docs/ACCEPTANCE.md)
- [Security review](docs/SECURITY_REVIEW.md)
- [Live evidence](docs/live-evidence/evidence.json)
- [Release verification](docs/FINAL_RELEASE_VERIFICATION.md)
- [Work & Trust](docs/WORK_AND_TRUST.md)
- [near.social boundary](docs/NEAR_SOCIAL.md)
- [Trezu compatibility](docs/TREZU_INTEGRATION.md)

The source-matched vault WASM artifact is `contract/artifacts/covaunt.wasm`, 183,746 bytes, with SHA-256 `96762824A7226F90981B9685890146D94F4A06DC8A3E66E1F9893254F9896888` and base58 code hash `B8LetBV7jQjzL8yPjkLbvy73NALaUpAn86FVsBqTjE9u`. The canonical Work & Trust artifact is the fresh-checkout GitHub Actions output from run `43538394361`: `work-contract/artifacts/covaunt_work.wasm`, 214,474 bytes, with SHA-256 `0ab11329ddb982393631d2aa62eb275613f4bf5f78bc3e71e3f43e40e00eb3f6` and SHA-256 base58 `ijgcCx1XmC4gJg1RsVE2UFJoyzgt29k5R3G8b799Dk9`; it has no testnet account until a separately funded deployment is independently verified. The deployed vault hash is recorded from live evidence; do not rebuild or redeploy this vault as part of frontend work.

## Security disclosure

The deployed vault has a FullAccess key (`ed25519:6NDRm1atodNeiXTkK1qeRz9iaqCqX7QjR3zWKB4MhGAz`) capable of replacing its code. This is a real deployment-security limitation. It is documented, not hidden, and has not been removed by this repository change because key deletion is irreversible without a reviewed recovery plan and explicit human authorization. No private keys or wallet credentials belong in this repository.

COVAUNT proves declared on-chain purpose and recipient conditions. Work & Trust can prove only the task records and callbacks its separate contract stores; it cannot prove physical-world impact. near.social activity is contextual and mainnet-only. Testnet balances, wallet availability, explorer indexing and RPC uptime are external dependencies.

## Release posture

**Engineering verdict: `READY_WITH_DISCLOSED_LIMITATIONS`.** The preserved vault/DAO release remains independently deployable; the Next.js app builds with the new work routes and no-fabrication boundary; the separate Work & Trust contract passes local unit coverage and has a sandbox receipt test for CI/Linux. The auxiliary contract is not deployed, no reward tier is live-claimed, and the wallet-to-contract write path has not been independently exercised in this migration. Do not remove the FullAccess key, deploy a new contract, upgrade the vault, use mainnet or submit a hackathon application without explicit human authorization.
