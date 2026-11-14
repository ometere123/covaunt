# COVAUNT demo and submission kit

## Opening line

“COVAUNT lets a community vote on pooled money without turning every donor contribution into a blank cheque.”

## Two-minute storyboard

| Time | Screen | Proof to say |
| --- | --- | --- |
| 00:00–00:15 | `/` | A DAO can govern. It cannot rewrite a donor’s consent. The ribbon says NEAR testnet and identifies the real vault. |
| 00:15–00:35 | `/treasury` | Read the live reconciliation: the current chain read is 18.2 NEAR deposited, 9 paid, 0.1 refunded, 9.1 available, zero pending. Explain that the preserved receipt snapshot was 18.1 NEAR before the later 0.1 NEAR entry. |
| 00:35–00:55 | `/covenants` | Open donor restrictions. Purpose and recipients are data in the vault, not decoration in the browser. |
| 00:55–01:20 | `/mandates` | Ask the contract for the allocation quote. Show the compatible healthcare path and explain that the quote is re-read before a DAO proposal. |
| 01:20–01:40 | `/governance` | Show the genuine Sputnik account, council role, 2-of-2 threshold evidence and 1 NEAR proposal bond. A connected visitor does not gain council permissions. |
| 01:40–02:05 | `/journal#valid` | Open the real 9 NEAR settlement receipt. Distinguish DAO approval from the vault’s `Settled` callback. |
| 02:05–02:30 | `/journal#forbidden` | Open the real 2 NEAR unanimous override. The DAO approved the attempt; downstream COVAUNT execution failed because incompatible capital remained protected. |
| 02:30–02:45 | `/journal#refund` | Open the 0.1 NEAR refund receipt. The donor, expiry and callback checks are separate from governance. |
| 02:45–03:05 | `/work` and `/work/tasks/[id]` | Show the separately funded Work & Trust register: settled small and medium callbacks, the rejected medium approver attempt, and the live DAO-gated large proposal. Keep Work balances separate from vault principal. |
| 03:05–03:20 | `/about#limitations` | Disclose the FullAccess-key limitation, testnet scope, no professional audit and the boundary around off-chain beneficiary use. |

The Work & Trust route may be shown as live evidence only for the task records and receipts in [live Work evidence](live-evidence/work-evidence.json). Do not present named-account attestations as independent proof of physical-world work, and do not call the large task settled until its second council approval and downstream callback are verified.

## Voiceover

“This is COVAUNT, a Social Money treasury on NEAR. The community can pool capital and govern through Sputnik DAO, but the vault records each donor’s original purpose, recipient allowlist and expiry. Here, a contract quote allocates compatible money before a proposal is opened. The DAO vote is real governance, not a shortcut around donor consent. In the verified 9 NEAR healthcare payment, six came from healthcare-only capital and three from a broader covenant; education-only capital stayed untouched. In the adversarial case, both council members approved a 2 NEAR healthcare proposal, but the downstream call failed because the vault could not find compatible capital. That is the product: a majority can decide what to ask for, but the contract decides whether donor conditions allow it. The public journal links the receipts. The release is testnet-only and the vault still has a FullAccess upgrade key, so we make no immutability or production-security claim.”

## Submission copy

**Title:** COVAUNT — A community treasury that cannot outvote donor consent

**Primary track:** Social Money (social)
**Secondary track:** Open track / governance infrastructure, if the portal permits a secondary selection

**Description:** COVAUNT is a NEAR-native Social Money treasury governed by a genuine Sputnik DAO. Contributors attach immutable purpose and recipient restrictions to native NEAR. The council can propose and approve spending, but the vault independently checks every downstream FunctionCall, deterministically allocates only compatible capital and settles native payouts through callback-verified state. A real testnet evidence set includes a valid 9 NEAR healthcare settlement, a unanimous but forbidden 2 NEAR proposal that failed downstream enforcement, and a successful donor refund. A separately funded Work & Trust contract records bounded community tasks, named-account attestations and callback-settled reward tiers without touching donor principal. The app is a multi-route Next.js experience with live finality reads, explicit preview separation, multi-wallet selection through near-connect, allocation quotes and a public receipt journal. It does not claim mainnet readiness, independent real-world work verification or an independent security audit.

## Required evidence links

- Repository: `https://github.com/ometere123/covaunt`
- Vault: `vault.covauntops26.testnet`
- DAO: `covaunt26.sputnikv2.testnet`
- Valid settlement: `https://explorer.testnet.near.org/transactions/Gv7yUyZ24JkPSW4p12pM8cLG48e83ZkMkzagZAENioG1`
- Forbidden execution: `https://explorer.testnet.near.org/transactions/BdP4EaxEdfGXda1k1LnCow5JJZBC5Z7k5rdBWGoskArw`
- Refund: `https://explorer.testnet.near.org/transactions/DKJEShdGxtLai6xPdRC7JzJ8EwAggv4jqHkz2RLRzU7V`
- Work deployment: `covaunt-work.testnet` (code hash `6SmBmxFQQaAhnP19yadMa1A5eroNg98jh1qYgQm2yNsh`)
- Work receipts: [live Work evidence](live-evidence/work-evidence.json)
- Public testnet deployment: `https://covaunt.vercel.app`
- Production source checkpoint: branch `main`, functional application commit `0b1f69a8f0a66553295103b575e2cac94659407f`; deployment inspected at `dpl_F84Mfc9xzKpQZBP7pcP5hrxMV47H`; deployment IDs rotate with main pushes

The public URL above is a verified live-testnet application. A real wallet signature and browser-to-wallet write walkthrough still require an authorized human account in the existing Chrome profile; do not describe CLI-signed receipts as graphical wallet evidence. Work records shown publicly are from the separately funded auxiliary account; they are not donor vault balances.

## Public X draft

> COVAUNT is a Social Money treasury on @NEARProtocol where collective governance cannot rewrite individual donor consent.
>
> We verified a real testnet lifecycle: 9 NEAR healthcare settlement, a unanimous 2 NEAR override rejected by the vault, and a successful donor refund.
>
> Vote together. Keep promises specific.
>
> Built at NEAR HACKATHON. #NEARHackathon
>
> Testnet evidence and source: [repository URL]

Publish only after human review of the actual URL, evidence timestamp and FullAccess disclosure.
