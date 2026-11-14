# COVAUNT deployment and recovery runbook

**Network:** NEAR testnet only
**Current posture:** deployed evidence exists; do not redeploy or upgrade this instance as part of frontend work.

## Verified deployment identity

| Item | Value |
| --- | --- |
| Operator / deployer account | `covauntops26.testnet` |
| Vault account | `vault.covauntops26.testnet` |
| Sputnik DAO | `covaunt26.sputnikv2.testnet` |
| Contract display name | `COVAUNT` |
| Code hash | `B8LetBV7jQjzL8yPjkLbvy73NALaUpAn86FVsBqTjE9u` |
| Proposal bond | `1 NEAR` |
| RPC | `https://rpc.testnet.near.org` |

The live audit retrieved `get_summary`, `get_policy`, account state, code metadata and access keys. It confirmed `dao_id` matches, the logical ledger is balanced, the estimated liquid balance backs outstanding donor principal and the storage reserve is above the contract’s minimum. The same audit exits non-zero because the vault still has FullAccess key `ed25519:6NDRm1atodNeiXTkK1qeRz9iaqCqX7QjR3zWKB4MhGAz`. That key can replace code; immutability is not claimed.

The checked-in `contract/artifacts/covaunt.wasm` is the source-matched deployed binary: 183,746 bytes, SHA-256 `96762824A7226F90981B9685890146D94F4A06DC8A3E66E1F9893254F9896888`. The final CI upload from run `43541716644` is 183,335 bytes with SHA-256 `C67CF6B0F4B32E66471963C8273C5E76DD0843AB7F78482E176E6EE12B07E679`; this difference is expected from the explicitly non-reproducible build mode and the CI file must not be used to claim a source match for the live vault.

## Read-only audit

PowerShell:

```powershell
$env:COVAUNT_ACCOUNT = 'vault.covauntops26.testnet'
$env:DAO_ACCOUNT = 'covaunt26.sputnikv2.testnet'
npm run verify:live
```

Expected recorded values:

```text
ledger_balanced true
dao_match true
code_hash B8LetBV7jQjzL8yPjkLbvy73NALaUpAn86FVsBqTjE9u
totals contributed 18200000000000000000000000
        paid        9000000000000000000000000
        refunded    100000000000000000000000
        available   9100000000000000000000000
        pending_spend 0
        pending_refund 0
```

The command’s non-zero exit is expected until the FullAccess key is deliberately handled. Do not silence or weaken that check.

The preserved evidence snapshot at `2026-11-13T10:15:56.256Z` records 18.1 NEAR across four contributions. The current read-only audit at `2026-11-14T01:12:24.4618119Z` includes a fifth 0.1 NEAR available entry, COV-004 from `elpadree.testnet`, and therefore reports 18.2 NEAR deposited across five contributions. The audit does not broadcast a transaction. The complete current read is recorded in [live-evidence/current-audit.json](live-evidence/current-audit.json).

## Do not redeploy this instance

The existing COVAUNT contract and Sputnik DAO are part of the preserved evidence. Do not run `scripts/deploy-testnet.sh`, `near contract deploy`, `near contract call ... new`, `near contract deploy use-file` or any upgrade command against these accounts without explicit human authorization and a reviewed recovery plan. Do not remove access keys in an automated release step.

The script remains available for a separately authorized fresh testnet deployment. It requires `COVAUNT_DEPLOY_CONFIRM=YES`, a verified real Sputnik DAO and an explicit operator decision. Its initializer uses `name: "COVAUNT"`; it must never be used to replace the live vault accidentally.

## Frontend deployment preparation

The web app is Next.js, not the retired Vite bundle. The authorized Vercel preview uses:

```text
Root directory: web
Install command: npm ci
Build command: npm run build
Framework: Next.js
```

Set only public configuration values:

```text
NEXT_PUBLIC_NEAR_RPC=https://rpc.testnet.near.org
NEXT_PUBLIC_COVAUNT_CONTRACT=vault.covauntops26.testnet
NEXT_PUBLIC_COVAUNT_DAO=covaunt26.sputnikv2.testnet
NEXT_PUBLIC_NEAR_EXPLORER=https://explorer.testnet.near.org
# Leave empty until a separately funded Work & Trust account is independently verified.
NEXT_PUBLIC_COVAUNT_WORK_CONTRACT=
# Optional public read endpoint; this is near.social mainnet context, not COVAUNT testnet.
NEXT_PUBLIC_NEAR_SOCIAL_API=https://kv.main.fastnear.com
```

`NEXT_PUBLIC_COVAUNT_WORK_CONTRACT` must remain unset for the preserved vault-only preview. Setting it enables the task funding, claim, evidence, verification, contributor and reward UI against that exact auxiliary account; it does not deploy or upgrade anything. Do not point it at the vault account. The source-matched local artifact and its no-deployment status are recorded in [Work & Trust](WORK_AND_TRUST.md).

## Work & Trust deployment preparation

The auxiliary deployment is intentionally separate from the preserved vault. The canonical artifact is `work-contract/artifacts/covaunt_work.wasm` from GitHub Actions run [43541716644](https://github.com/ometere123/covaunt/actions/runs/43541716644), SHA-256 `0ab11329ddb982393631d2aa62eb275613f4bf5f78bc3e71e3f43e40e00eb3f6`, 214,474 bytes. The deployment account must already exist and be separately funded for code storage, the one-NEAR initializer reserve, gas and task budgets.

After a human has created/funded the dedicated account, run from WSL or another environment with the verified `near-cli-rs` command:

```bash
export COVAUNT_WORK_ACCOUNT='work.covauntops26.testnet'
export COVAUNT_WORK_DAO='covaunt26.sputnikv2.testnet'
export COVAUNT_WORK_DEPLOY_CONFIRM=YES
./scripts/deploy-work-testnet.sh
```

The script refuses the original vault account, verifies the artifact hash, uses testnet only, initializes `COVAUNT Work` with the existing DAO binding and signs through the configured keychain. It does not read or print private keys. Immediately after a successful receipt, run the read-only audit:

```bash
COVAUNT_WORK_ACCOUNT='work.covauntops26.testnet' COVAUNT_WORK_DAO='covaunt26.sputnikv2.testnet' npm run verify:work-live
```

Do not set `NEXT_PUBLIC_COVAUNT_WORK_CONTRACT` or publish task records until the audit confirms the code hash, DAO binding, balanced summary, storage reserve and account solvency, and the three reward tiers have each been exercised with genuine receipts.

## Verified public preview

- URL: `https://covaunt-git-feature-covaunt-db31e4-delealufejoel-4184s-projects.vercel.app`
- Project: `covaunt` in the `delealufejoel-4184s-projects` team
- Source: `ometere123/covaunt`, branch `feature/covaunt-work-trust`
- Branch alias: `covaunt-git-feature-covaunt-db31e4-delealufejoel-4184s-projects.vercel.app`
- Last inspected deployment during this release checkpoint: `dpl_65pqPhhRmU5z8vS1jtYmeTdrxxCK`; READY. Vercel deployment IDs rotate after every branch push; inspect the alias for the current immutable deployment.
- Framework settings: Next.js, root `web`, `npm ci`, `npm run build`, Node `22.x`
- Environment: NEAR testnet only; only the four public `NEXT_PUBLIC_*` values above were configured for Preview
- Verification: public HTTPS 200, all required routes, real final RPC reads, current live accounting, preview separation, mobile navigation, no mobile overflow and read-only proxy guard passed
- Production: no production deployment or alias was retained; do not use `vercel deploy --prod`

Browser reads use the same-origin `/api/near-rpc` route. It accepts only JSON-RPC `query` requests and rejects transaction broadcast methods; the server route is pinned to `https://rpc.testnet.near.org` to prevent a mainnet configuration drift.

No wallet key, seed phrase, mnemonic, private RPC credential or deploy key is needed by the frontend. The app reads public RPC state in the browser and uses near-connect to hand transaction approval to the selected wallet.

Before treating the preview as a complete public write surface, exercise a real testnet wallet flow with an authorized human: select one wallet from the chooser, verify account persistence and disconnect, contribute a small authorized covenant, create a real proposal with the live bond, vote only from an actual council account, inspect the DAO outcome separately from `get_spend`, and request a refund only after on-chain eligibility. This repository does not claim that browser-to-wallet write sequence was independently exercised during the migration.

The Work & Trust forms are a separate gate. They must not be enabled in a public deployment until a separately funded auxiliary account is confirmed, its WASM hash is recorded, the small/medium/large authorization paths are tested, and a real graphical wallet flow is exercised. A task budget is not donor principal. Large rewards must be invoked by the configured Sputnik DAO, not by a connected visitor.

## Evidence sequence

The preserved evidence records:

1. Four donor contributions totaling 18.1 NEAR.
2. A 9 NEAR healthcare proposal approved by both council members and settled to the authorized clinic.
3. A 2 NEAR healthcare override approved by both members but rejected during downstream COVAUNT execution; Sputnik ended `Failed`.
4. Early refund rejection with `ERR_STILL_LOCKED`.
5. A successful 0.1 NEAR donor refund.
6. A balanced final ledger with zero pending obligations.

The current live ledger also shows a fifth 0.1 NEAR available contribution, so the public preview should be narrated from its current read rather than from the older 18.1 NEAR snapshot.

Explorer links are collected in `docs/live-evidence/evidence.json` and surfaced by `/journal`.

## Key-custody recommendation

Do not delete the FullAccess key casually. First export no secrets, confirm the source-matched WASM and code hash, test a recovery deployment on a separate account, record the DAO and vault evidence, obtain human approval and understand that key deletion is irreversible unless another authorized key exists. Then remove or downgrade only through an explicit, reviewed NEAR transaction and rerun the access-key, code-hash, ledger and solvency audit. Until then, describe the vault as upgrade-authority-exposed testnet infrastructure.
