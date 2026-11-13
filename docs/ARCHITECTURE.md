# COVAUNT architecture

## System boundary

```text
NEAR testnet
├── Sputnik DAO: covaunt26.sputnikv2.testnet
│   ├── council policy and threshold
│   ├── add_proposal(FunctionCall)
│   ├── act_proposal(VoteApprove / VoteReject)
│   └── downstream execution receipt
└── COVAUNT vault: vault.covauntops26.testnet
    ├── immutable Contribution records
    ├── deterministic eligible allocation
    ├── pending spend / refund reservations
    ├── native NEAR transfer
    └── private callback finality or restoration
Auxiliary, opt-in boundary (not deployed in this release)
└── COVAUNT Work & Trust contract artifact
    ├── task-specific attached budgets only
    ├── single claimant and bounded completion evidence
    ├── verifier / approver / Sputnik DAO reward paths
    ├── dispute and replay guards
    └── private payout/refund callbacks and contributor stats
```

The vault was initialized with the verified DAO account and display name `COVAUNT`. `dao_id` is stored in contract state and is not mutable through the public ABI. The contract has no unrestricted administrator withdrawal method.

## Consent model

A donor contribution stores:

- integer principal and available balance in yoctoNEAR;
- a non-zero purpose bit mask;
- one to eight unique recipient account IDs;
- a withdrawal-unlock timestamp;
- an optional bounded note.

The contract never expands these conditions after deposit. A spend request contains exactly one purpose bit, one recipient, one amount and a replay-resistant mandate ID. `compute_allocation` considers only active available contributions whose purpose mask contains the requested purpose and whose allowlist contains the exact recipient. Candidates are ordered by narrower purpose mask, narrower recipient list, then contribution ID.

## Governance path

The browser reads the live DAO policy and uses the current `proposal_bond`. It creates a genuine Sputnik `FunctionCall` proposal whose action is the exact base64-encoded `execute_spend` call. Council voting uses the deployed DAO’s `act_proposal` format and 300 Tgas for approval calls, matching the verified second-vote receipt.

The boundary is deliberately two-stage:

1. Sputnik decides whether the DAO policy authorizes the proposal.
2. COVAUNT checks predecessor identity and donor consent when Sputnik invokes the target.
3. COVAUNT reserves exact allocations and starts a native transfer.
4. The callback marks the spend `Settled` only if the transfer receipt succeeds; otherwise it restores each allocation and marks `Failed`.

An `Approved` or `Executed` DAO proposal is never rendered as a payment by the web application. A beneficiary payment requires a matching COVAUNT spend with `Settled` status and a receipt trail.

## Frontend architecture

The frontend is a Next.js App Router application under `web/`:

- server-rendered route shells live under `web/app/`;
- browser-only data and wallet state live in client components under `web/components/`;
- `web/lib/near.ts` performs finality reads against the public testnet RPC;
- `web/lib/wallet.ts` is the only near-connect boundary and is never imported by server-only code;
- `web/components/DataProvider.tsx` separates live RPC state from deterministic `?mode=preview` fixtures;
- `web/components/WalletProvider.tsx` restores the selected account, listens for sign-in/sign-out and keeps signing failures explicit;
- all monetary formatting uses integer yoctoNEAR values and `BigInt`.

The installed wallet connector is `@hot-labs/near-connect` 0.12.0. It opens a multi-wallet chooser using the options exposed by its current manifest. Browser signing compatibility for a specific wallet remains an external verification step for this release. HERE is not claimed because it is not present in the verified manifest used by this release. The frontend never accepts keys, mnemonics or passwords. On mobile the wallet action remains in the header; the hamburger only controls navigation.

The Work & Trust module is an independent Next.js data and wallet boundary in `web/lib/work.ts`. It is disabled unless `NEXT_PUBLIC_COVAUNT_WORK_CONTRACT` is explicitly configured. Its Rust contract is source-matched in `work-contract/` and has no reference to the vault account, donor records or vault methods. The public app shows an unconfigured state rather than substituting tasks, payments or reputations.

## Public audit routes

`/treasury` reconciles the contract summary and separates storage reserve from donor principal. `/covenants` and `/covenants/[id]` expose donor permissions and the donor-only refund action. `/mandates` and `/mandates/[id]` separate allocation quotes, DAO states and vault settlement. `/journal` links the supplied receipts. `/governance` explains the live Sputnik roles without granting council status to connected visitors. `/work`, `/work/funding`, `/work/submit` and `/work/tasks/[id]` form the optional Work & Trust surface; without a configured auxiliary account they display the deployment boundary. `/contributors/[account]` keeps contract-derived work stats separate from the optional read-only near.social mainnet panel.

## Availability and limits

Live RPC failure is fail-closed: the application shows an unavailable state and does not display sample balances. A transaction result is shown as submitted or finalized only from the wallet response; settlement is then read from chain state. No automatic retry is performed after transaction uncertainty, avoiding duplicate proposals or deposits.

The deployed code hash is `B8LetBV7jQjzL8yPjkLbvy73NALaUpAn86FVsBqTjE9u`. The account still has a FullAccess key capable of code replacement, so this release makes no immutable-upgrade claim. That key must only be removed after explicit human authorization, a reviewed recovery procedure and a post-removal audit. Work & Trust is not included in that deployed hash; its un-deployed artifact is documented separately.
