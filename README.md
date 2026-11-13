# COVAUNT

**Collective decisions. Individual consent.**

A purpose- and beneficiary-bound native NEAR treasury for communities using Sputnik DAO governance. The community can vote to spend pooled capital, but even a unanimous vote cannot move a donor's principal outside the donor's fixed conditions. Contributions can be mixed for compatible payments, and expired unspent balances are recoverable by the original donor.

> **RELEASE STATUS — LOCAL ENGINEERING GATES COMPLETE / TESTNET GATES BLOCKED (13 Nov 2026).** The Rust contract compiles with near-sdk 5.30.1, 13/13 contract unit tests pass, the 2.14.0 NEAR Sandbox receipt suite passes, the WASM artifact is built, and the responsive browser suite passes 10/10 across desktop and mobile Chromium. Final testnet RPC checks confirmed the intended signer account `covauntops26.testnet` and target account `vault.covauntops26.testnet`; the target had 7 NEAR and no contract code at that check. No real Sputnik DAO, deployed COVAUNT contract, hosted URL or transaction evidence exists yet. Therefore this release is **READY_WITH_DISCLOSED_LIMITATIONS for local reproducibility only**: it is not a live deployment, professional audit or approval for real-value funds. See `docs/FINAL_RELEASE_VERIFICATION.md`, `docs/SECURITY_REVIEW.md` and `docs/ACCEPTANCE.md` before publishing any live claim.

## What COVAUNT does — in one end-to-end story

1. Three contributors deposit 8 NEAR for Education, 6 NEAR for Healthcare and 4 NEAR for either purpose. Each contributor also names the only beneficiary accounts that can receive their funds, and fixes an expiration time.
2. A council member creates a 9 NEAR Healthcare spending proposal for the listed clinic using a real Sputnik DAO `FunctionCall` proposal.
3. The council votes. The approved DAO invokes `execute_spend` on COVAUNT.
4. The contract allocates 6 NEAR from the Healthcare-specific donor and 3 NEAR from the flexible donor; the Education-only donor's balance remains 8 NEAR.
5. The transfer is attempted asynchronously. Only a successful transfer callback changes the ledger from `InFlight` to `Settled`; a failure restores available balances.
6. A subsequent council proposal tries to pay the clinic from incompatible Education-only capital. The contract rejects the DAO call; governance approval is **not** authorization.
7. When a donor's spending permission expires, the donor can request return of their remaining available principal. A failed refund restores the available balance.

**Critical scope:** The chain protects only the exact *recipient address, declared purpose, permitted time window, amount and allocation accounting*. It cannot prove what recipients do with assets after payment. Purpose is DAO-supplied metadata, not an independent legal audit. A donor should restrict recipients accordingly, and may allow a recipient for only one meaningful purpose.

## Distinctive product design

**A civic ledger meets a luxury print editorial:** warm parchment, charcoal ink, oxblood, antique brass, thick rules, ceremonial numbering, expressive typography and a custom heraldic seal. No recycled neon-purple SaaS dashboards, generic glassmorphism or glossy crypto cards. Fully responsive, keyboard-based forms, plain-language explanations, empty states, read-only audit screens, and true design-preview vs live-data modes.

- **The Register:** every donor's original principal, restrictions, authorized recipients and remaining balance.
- **The Deposit Desk:** wallet transaction collecting restrictions that are immutable once committed.
- **The Mandate Chamber:** preview exact allocation, generate a real Sputnik `FunctionCall` spending proposal, inspect council votes and cast an eligible vote.
- **The Public Journal:** successful/failed/in-flight disbursements, reconciliation and explorer links.
- **Covenant inspection:** see donor-specific rules and request an expiry refund.

## Technical contents

```text
contract/                  NEAR Rust contract, unit tests, payer callback accounting
contract/artifacts/        Verified local WASM artifact and its SHA-256 record
web/                       Vanilla JS + Vite frontend; MyNearWallet selector integration
web/assets/                Original COVAUNT seal
web/src/engine.mjs         Deterministic integer arithmetic & readable allocation mirror
scripts/                   Deployment, config, proposal generation, RPC audit, proof
scripts/collect-evidence.mjs  Post-testnet receipt evidence template generator
tests/                     Node model/property tests and NEAR sandbox scenario
.github/workflows/         Reproducible GitHub Actions verification pipeline
docs/                      Threat model, detailed architecture, acceptance matrix,
                           contract API, deployment, demo script, design guide and status
docs/screenshots/          Browser-captured desktop and mobile design-preview evidence
```

### Contract invariants

```text
for every allocation (contribution, spend):
  spend.purpose ∈ contribution.allowed_purposes
  AND spend.recipient ∈ contribution.recipients
  AND spend.timestamp < contribution.withdraw_after_ns
  AND contribution.available >= allocated amount

for every contribution:
  principal = available + pending_spend + pending_refund + paid + refunded

all contributions combined:
  total_deposited = available + pending_spend + pending_refund
                    + total_paid + total_refunded
```

The algorithm consumes narrow, purpose- and recipient-specific grants before flexible grants. It is deterministic, bounded and only allocates exact compatible capital; it does not claim globally optimal multi-round allocation. A mandate ID is single-use, including if a transfer fails. Pending withdrawals cannot be allocated again. The DAO account is fixed at initialization.

### Important governance distinction

COVAUNT does **not** implement its own voting system. Sputnik DAO votes are authoritative for governance, and COVAUNT's immutable contribution rules remain authoritative for money. A real Sputnik DAO contract (rather than an arbitrary council account) is needed for hackathon acceptance. The dedicated `tests/sandbox.test.mjs` verifies caller identity and NEAR receipts in local sandbox, but intentionally **does not pretend to run a Sputnik vote**.

## Quick start (design preview without a network)

For an instant preview **without npm dependencies or internet access**:

```bash
npm run preview:offline
# open http://127.0.0.1:4174
```

For the real Vite development server and wallet features:

```bash
cd web
npm install
npm run dev
```

Open the local Vite URL. The clear **DESIGN PREVIEW** ribbon and sample 8/6/4 register are illustrative. No funds are transferred, and transaction controls are disabled until a real testnet contract and DAO are configured. The underlying web app never silently replaces unavailable live data with sample data.

### Local checks

```bash
npm run test                   # Node built-in BigInt and allocation tests
npm run proof                  # Honest illustrated 8/6/4 scenario
npm run verify:static          # Files / API-path smoke validation
cd contract && cargo test      # Rust near-sdk unit tests; requires Rust + dependencies
cargo near build non-reproducible-wasm --no-abi
cd .. && npm install && npm run test:sandbox
cd web && npm install && npm run build
npm run test:browser             # Playwright/Chromium UI, preview safety and mobile tests
```

The root dependency install is platform-neutral because the legacy `near-sandbox` postinstall is disabled; `scripts/ensure-sandbox.mjs` downloads and verifies NEAR Sandbox 2.14.0 explicitly. Run the Rust and receipt gates in Linux, WSL or CI. On native Windows, `npm run test:sandbox` fails clearly because NEAR Sandbox is a Linux x64 binary. A missing WASM or sandbox binary now fails the receipt test rather than being counted as a pass. These local gates still do not replace genuine Sputnik testnet governance or deployment evidence.

Rendered UI evidence: [desktop preview](docs/screenshots/covaunt-desktop-preview.png) · [mobile preview](docs/screenshots/covaunt-mobile-preview.png). Both are explicitly illustrative and contain no claimed transactions.

### Testnet deployment

Read **`docs/DEPLOYMENT.md` from start to finish**. Do not deploy before creating and verifying a Sputnik DAO on testnet and verifying the exact `near-cli-rs` and `cargo-near` syntax in your shell.

```bash
# The near-cli keychain signer must be covauntops26.testnet.
export DAO_ACCOUNT='REPLACE_WITH_VERIFIED_SPUTNIK_DAO'
export COVAUNT_ACCOUNT='vault.covauntops26.testnet'
export COVAUNT_DEPLOY_CONFIRM=YES
bash scripts/deploy-testnet.sh
node scripts/audit-testnet.mjs
node scripts/set-config.mjs "$COVAUNT_ACCOUNT" "$DAO_ACCOUNT"
cd web && npm run build
```

As of 13 Nov 2026, final testnet RPC confirmed `covauntops26.testnet` exists with approximately 2.9928850104625 NEAR and `vault.covauntops26.testnet` exists with 7 NEAR. `view_code` returned `NO_CONTRACT_CODE` for the target, so this is prepared configuration, not deployment evidence. Do not replace `DAO_ACCOUNT` until the real Sputnik DAO account and policy are verified.

`COVAUNT_DEPLOY_CONFIRM=YES` is a deliberate gate, not proof that deployment succeeded. No keys or mnemonic phrases should be committed.

## Reproducible live proof

An accepted project must capture (a) three real donor contributions; (b) a real DAO-approved compatible spend; (c) its eventual `Settled` status and verified recipient balance; (d) a separate DAO-approved but incompatible proposal whose cross-contract call fails; (e) protected donor balances unchanged; (f) donor expiry refund; (g) conservation invariant; (h) no remaining dangerous FullAccess deployer keys after final audit. The exact checklist and required transaction references are in `docs/ACCEPTANCE.md`.

## Official references

- NEAR SDK: https://docs.rs/near-sdk/latest/near_sdk/
- Sputnik DAO contract & proposal shape: https://github.com/near-daos/sputnik-dao-contract
- Wallet Selector v10 migration: https://github.com/near/wallet-selector/blob/main/MIGRATION-v10.md
- NEAR docs: https://docs.near.org/
- NEAR hackathon: https://nearhackathon.com/

## Documents

[Architecture](docs/ARCHITECTURE.md) · [Contract API](docs/CONTRACT_API.md) · [Threat model](docs/THREAT_MODEL.md) · [Security review](docs/SECURITY_REVIEW.md) · [Deploy](docs/DEPLOYMENT.md) · [Acceptance gates](docs/ACCEPTANCE.md) · [Design](docs/DESIGN_SYSTEM.md) · [Demo & submission](docs/DEMO_AND_SUBMISSION.md) · [Market positioning](docs/COMPETITIVE_POSITIONING.md) · [Release status](docs/RELEASE_STATUS.md) · [Final verification](docs/FINAL_RELEASE_VERIFICATION.md)

## License and disclaimers

MIT License. This hackathon prototype is experimental financial software. No assurance against production exploits, account compromise, contract upgrade keys, social engineering, false recipient intent, economic incentives or malicious governance beyond the stated contract restrictions is implied. Do not use with real-value funds without extensive independent review.
