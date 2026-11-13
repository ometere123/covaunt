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
totals contributed 18100000000000000000000000
        paid        9000000000000000000000000
        refunded    100000000000000000000000
        available   9000000000000000000000000
        pending_spend 0
        pending_refund 0
```

The command’s non-zero exit is expected until the FullAccess key is deliberately handled. Do not silence or weaken that check.

## Do not redeploy this instance

The existing COVAUNT contract and Sputnik DAO are part of the preserved evidence. Do not run `scripts/deploy-testnet.sh`, `near contract deploy`, `near contract call ... new`, `near contract deploy use-file` or any upgrade command against these accounts without explicit human authorization and a reviewed recovery plan. Do not remove access keys in an automated release step.

The script remains available for a separately authorized fresh testnet deployment. It requires `COVAUNT_DEPLOY_CONFIRM=YES`, a verified real Sputnik DAO and an explicit operator decision. Its initializer uses `name: "COVAUNT"`; it must never be used to replace the live vault accidentally.

## Frontend deployment preparation

The web app is Next.js, not the retired Vite bundle. A Vercel deployment should use:

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
```

No wallet key, seed phrase, mnemonic, private RPC credential or deploy key is needed by the frontend. The app reads public RPC state in the browser and uses near-connect to hand transaction approval to the selected wallet.

Before publishing, exercise a real testnet wallet flow with an authorized human: connect HOT or Meteor, verify account persistence and disconnect, contribute a small authorized covenant, create a real proposal with the live bond, vote only from an actual council account, inspect the DAO outcome separately from `get_spend`, and request a refund only after on-chain eligibility. This repository does not claim that browser-to-wallet write sequence was independently exercised during the migration.

## Evidence sequence

The preserved evidence records:

1. Four donor contributions totaling 18.1 NEAR.
2. A 9 NEAR healthcare proposal approved by both council members and settled to the authorized clinic.
3. A 2 NEAR healthcare override approved by both members but rejected during downstream COVAUNT execution; Sputnik ended `Failed`.
4. Early refund rejection with `ERR_STILL_LOCKED`.
5. A successful 0.1 NEAR donor refund.
6. A balanced final ledger with zero pending obligations.

Explorer links are collected in `docs/live-evidence/evidence.json` and surfaced by `/journal`.

## Key-custody recommendation

Do not delete the FullAccess key casually. First export no secrets, confirm the source-matched WASM and code hash, test a recovery deployment on a separate account, record the DAO and vault evidence, obtain human approval and understand that key deletion is irreversible unless another authorized key exists. Then remove or downgrade only through an explicit, reviewed NEAR transaction and rerun the access-key, code-hash, ledger and solvency audit. Until then, describe the vault as upgrade-authority-exposed testnet infrastructure.
