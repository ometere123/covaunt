# COVAUNT — deployment, integration, and recovery runbook

**Environment:** testnet only. **Current status (13 Nov 2026):** the contract WASM and local receipt tests are complete. Final NEAR testnet RPC checks confirmed the intended signer account `covauntops26.testnet` with approximately 2.9928850104625 NEAR and the proposed target account `vault.covauntops26.testnet` with 7 NEAR. `view_code` returned `NO_CONTRACT_CODE` for the target. No Sputnik DAO, deployment transaction, contract code hash or web deployment exists yet. No private keys were read or committed.

## 0. Required software and real accounts

- Rust stable, `wasm32-unknown-unknown` target, `cargo-near` (the local verification used `cargo-near-near 0.23.0`), `near-cli-rs` (verify installed command syntax against `near --help` and `cargo near --help`)
- Node.js 22+, npm, Git; an accessible public NEAR testnet RPC
- The intended testnet signer is `covauntops26.testnet`; verify the active near-cli keychain identity and retain gas/account-storage headroom before any live command.
- The proposed COVAUNT target is `vault.covauntops26.testnet`; its existence and 7 NEAR balance were confirmed by final RPC, but it has no contract code yet. Recheck existence and balance immediately before deployment.
- A **real Sputnik DAO on testnet** with council roles that can add and approve `FunctionCall` proposals. Verify actual proposal permissions, `get_policy`, `get_last_proposal_id`, voting threshold and current `proposal_bond` before integrating. The DAO must have a real testnet contract code hash and be able to transfer to COVAUNT by a function-call proposal.
- At least three donor accounts, a school account, a clinic account, and two council voters (if policy requires two). Fund donors and DAO bond payer from testnet funding only.

NEAR documentation: https://docs.near.org/ ; Sputnik implementation: https://github.com/near-daos/sputnik-dao-contract ; wallet selector: https://github.com/near/wallet-selector/blob/main/MIGRATION-v10.md

## 1. Install and run gates BEFORE deploying

```bash
node --version
cargo --version
near --version
cargo near --help
npm install
npm run test
npm run verify:static
cd contract
cargo test
cargo near build non-reproducible-wasm --no-abi
cd ..
npm run test:sandbox
cd web
npm install
npm run build
npm run test:browser
cd ..
```

No part of the above is optional for release confidence. The root `.npmrc` disables the legacy `near-sandbox` postinstall; `scripts/ensure-sandbox.mjs` downloads and version-checks NEAR Sandbox `2.14.0` and requires Linux x64. Run `npm run test:sandbox` in WSL or Linux/CI. Missing WASM or sandbox binaries fail the test; a skipped receipt test is not a passing integration suite. The web bundle must complete and load in at least one real browser. Validate signing and return redirects with MyNearWallet on an HTTPS testnet app.

The `non-reproducible-wasm` build instruction is a build convenience, **not** proof of deterministic reproducibility. For a serious submission, record compiler versions and the WASM SHA-256, then perform a reproducible build wherever the current cargo-near toolchain supports it.

## 2. Deploy the real DAO first

A Sputnik DAO is a separate real contract; COVAUNT does not install or create it. Use the official testnet DAO factory or audited contract deployment instructions that match your intended testnet network and policy. Record:

```text
DAO_ACCOUNT                 actual account ID
DAO_CONTRACT_CODE_HASH      from view_code
COUNCIL_MEMBER_A/B          actual account IDs
PROPOSAL_BOND               live get_policy result
THRESHOLD                   actual policy for FunctionCall proposals
DAO_CREATION_TRANSACTION    explorer URL
```

Confirm your DAO account accepts `add_proposal` with `FunctionCall` and that `act_proposal` executes the proposal. Never configure the web app to a normal user account masquerading as DAO for the final demo.

## 3. Deploy COVAUNT contract

```bash
# Do not replace DAO_ACCOUNT until a real Sputnik DAO is created and verified.
export DAO_ACCOUNT='REPLACE_WITH_VERIFIED_SPUTNIK_DAO'
export COVAUNT_ACCOUNT='vault.covauntops26.testnet'
export COVAUNT_DEPLOY_CONFIRM=YES
bash scripts/deploy-testnet.sh
```

The script runs unit tests and builds WASM first. It then calls the actual `near contract deploy ... with-init-call new` with `dao_id`, `name: "COVAUNT"`, and a **5 NEAR attached init deposit** paid by the deployer, not donors. Do not rerun the init transaction on an initialized contract. Confirm the precise CLI syntax for the installed CLI revision; if syntax differs, adjust the command with explicit provenance and rerun all checks.

After deployment, inspect:

```bash
COVAUNT_ACCOUNT="$COVAUNT_ACCOUNT" DAO_ACCOUNT="$DAO_ACCOUNT" node scripts/audit-testnet.mjs
```

This script fetches the real on-chain code metadata, `get_summary`, DAO `get_policy`, and checks for FullAccess keys. It never signs transactions or claims a security audit. If the contract has the wrong `dao_id` or `is_balanced` false, **do not deposit**.

## 4. Configure and deploy the web app

```bash
node scripts/set-config.mjs "$COVAUNT_ACCOUNT" "$DAO_ACCOUNT"
cd web
npm run build
npm run dev
```

Deploy `web/dist/` to any static HTTPS hosting provider (e.g. Vercel or Cloudflare Pages), with framework set to Vite/static, build `npm run build`, output `dist`. Do not request a domain by default; the deployment platform may issue a generic preview hostname. Before publishing, verify the live page identifies the configured contract/DAO and displays the **NEAR TESTNET / LIVE DATA** ribbon with `is_balanced: true`. Remove all demo-only misleading claims. Do not publish private keys, `.env` files or CLI keychains.

Note: in preview mode the UI uses clearly labeled sample data and **blocks all transaction controls**. In live mode a failed RPC call does not revert to sample data.

## 5. Full testnet demonstration sequence

Choose small scaled amounts if funding is limited; 8/6/4 NEAR is a readable illustrative template, not a required minimum. Use current future expiry timestamps for actual contributions.

1. Donor A contributes **8** NEAR, allowed mask `1` Education, recipients `[school.testnet]`.
2. Donor B contributes **6** NEAR, mask `2` Healthcare, recipients `[clinic.testnet]`.
3. Donor C contributes **4** NEAR, mask `3`, recipients `[school.testnet, clinic.testnet]`.
4. Check `get_summary.total_deposited=18 NEAR` and `is_balanced=true`.
5. DAO council member previews a **9 NEAR** healthcare payment to `clinic.testnet` and confirms allocation donor B `6`, donor C `3`, donor A `0`.
6. Sign `add_proposal` with the exact `FunctionCall` payload; use the current `proposal_bond`. Council voter(s) call `act_proposal VoteApprove` until Sputnik policy resolves the proposal.
7. Inspect resulting `get_spend.status` as **Settled** and cross-check recipient account balance / actual transfer receipt. `get_summary.total_paid=9`.
8. Propose a separate **2 NEAR** healthcare diversion to the clinic when the only available capital is donor A Education plus donor C remaining 1 Healthcare. A DAO vote may succeed, but the target COVAUNT call must fail `ERR_NOT_ENOUGH_ELIGIBLE_CAPITAL`; verify donor A's 8 NEAR unchanged.
9. Attempt direct `execute_spend` from a non-DAO signer, wrong recipient, expired grant, and replay, confirming each rejection.
10. Once expiry is reached on a separate short-duration test grant, donor calls `request_refund`; confirm actual NEAR transfer, `refunded` increases, `is_balanced=true`.
11. Record all hashes using `node scripts/collect-evidence.mjs ...`, attach raw receipts and public explorer URLs.
12. Audit deployment keys and decide whether removing FullAccess keys is appropriate after code is independently reviewed and recoverability policy determined. Do not perform irreversible key removal without full understanding.

## 6. Failure recovery

- **Quote now rejects:** a donor's grant expired, capital was spent or another proposal reserved funds; re-quote and re-propose. Do not force or bypass the permission rules.
- **DAO proposal approved, COVAUNT execution failed:** no COVAUNT `Spend` is created if permission check panicked. Inspect DAO action receipt and contract summary. A new correctly authorized mandate can be proposed with a new unique ID.
- **Transfer `Failed`:** callback should restore all allocations; check final `get_spend.status=Failed`, `pending_spend=0`, balances restored. Never reuse its mandate ID.
- **Refund `Failed`:** verify `pending_refund=0` and `available` restored, then retry after correcting destination account availability. A donor account deleted or inaccessible remains an external recovery challenge.
- **Callback stuck / no terminal status:** do **not** redeploy or manually alter funds. Gather transaction receipts and state. This package provides no unilateral state-rewriting emergency recovery function by design. Independent analysis is required before real-value use.
- **Storage reserve exhausted:** deposits and spend record creation fail closed; do not divert donor funds to patch storage. The current ABI does not expose an admin top-up or reserve-withdraw method. Capacity planning must be validated before external adoption.
- **Wrong `dao_id`:** the initialized DAO is intentionally immutable; deploy a new instance with the correct DAO and conduct transparent donor opt-in migration, not forced transfer.

## 7. Public release and key security

Use `node scripts/audit-testnet.mjs` and an explorer to list FullAccess keys on the contract account. Such keys can redeploy contract code or otherwise undermine donor guarantees. If a key remains, do **not** advertise upgrade immutability. Before removing it, assess upgrade/recovery tradeoffs and obtain a competent review. A public testnet hackathon demo can disclose remaining key controls, but should not misrepresent them as safe for production deposits.

## 8. Repository release gates

The GitHub Actions workflow runs Rust unit tests, builds WASM, uploads the artifact, runs the sandbox and builds the web app. The local WSL gates are green, but no GitHub Actions run was available in this workspace. Examine completed CI logs and exact artifacts before treating CI as independent evidence. The status file `docs/RELEASE_STATUS.md` distinguishes local PASS results from external BLOCKED gates.
