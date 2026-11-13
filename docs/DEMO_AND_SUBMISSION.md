# COVAUNT demo and submission kit

## Opening line

“COVAUNT lets a community vote on pooled money without turning every donor contribution into a blank cheque.”

## Two-minute storyboard

| Time | Screen | Proof to say |
| --- | --- | --- |
| 00:00–00:15 | `/` | A DAO can govern. It cannot rewrite a donor’s consent. The ribbon says NEAR testnet and identifies the real vault. |
| 00:15–00:35 | `/treasury` | Read the live reconciliation: 18.1 NEAR deposited, 9 paid, 0.1 refunded, 9 available, zero pending. |
| 00:35–00:55 | `/covenants` | Open donor restrictions. Purpose and recipients are data in the vault, not decoration in the browser. |
| 00:55–01:20 | `/mandates` | Ask the contract for the allocation quote. Show the compatible healthcare path and explain that the quote is re-read before a DAO proposal. |
| 01:20–01:40 | `/governance` | Show the genuine Sputnik account, council role, 2-of-2 threshold evidence and 1 NEAR proposal bond. A connected visitor does not gain council permissions. |
| 01:40–02:05 | `/journal#valid` | Open the real 9 NEAR settlement receipt. Distinguish DAO approval from the vault’s `Settled` callback. |
| 02:05–02:30 | `/journal#forbidden` | Open the real 2 NEAR unanimous override. The DAO approved the attempt; downstream COVAUNT execution failed because incompatible capital remained protected. |
| 02:30–02:45 | `/journal#refund` | Open the 0.1 NEAR refund receipt. The donor, expiry and callback checks are separate from governance. |
| 02:45–03:00 | `/about#limitations` | Disclose the FullAccess-key limitation, testnet scope, no professional audit and the boundary around off-chain beneficiary use. |

The Work & Trust route may be shown only as a scope disclosure until a separately funded auxiliary contract is deployed and independently verified. Do not present local task fixtures, reward-tier unit tests or contributor examples as public testnet evidence.

## Voiceover

“This is COVAUNT, a Social Money treasury on NEAR. The community can pool capital and govern through Sputnik DAO, but the vault records each donor’s original purpose, recipient allowlist and expiry. Here, a contract quote allocates compatible money before a proposal is opened. The DAO vote is real governance, not a shortcut around donor consent. In the verified 9 NEAR healthcare payment, six came from healthcare-only capital and three from a broader covenant; education-only capital stayed untouched. In the adversarial case, both council members approved a 2 NEAR healthcare proposal, but the downstream call failed because the vault could not find compatible capital. That is the product: a majority can decide what to ask for, but the contract decides whether donor conditions allow it. The public journal links the receipts. The release is testnet-only and the vault still has a FullAccess upgrade key, so we make no immutability or production-security claim.”

## Submission copy

**Title:** COVAUNT — A community treasury that cannot outvote donor consent

**Primary track:** Social Money (social)
**Secondary track:** Open track / governance infrastructure, if the portal permits a secondary selection

**Description:** COVAUNT is a NEAR-native Social Money treasury governed by a genuine Sputnik DAO. Contributors attach immutable purpose and recipient restrictions to native NEAR. The council can propose and approve spending, but the vault independently checks every downstream FunctionCall, deterministically allocates only compatible capital and settles native payouts through callback-verified state. A real testnet evidence set includes a valid 9 NEAR healthcare settlement, a unanimous but forbidden 2 NEAR proposal that failed downstream enforcement, and a successful donor refund. The app is a multi-route Next.js experience with live finality reads, explicit preview separation, multi-wallet selection through near-connect, allocation quotes and a public receipt journal. The repository also contains an un-deployed, separately funded Work & Trust contract design; no live task, reward or reputation evidence is claimed. It does not claim mainnet readiness, off-chain work verification or an independent security audit.

## Required evidence links

- Repository: `https://github.com/ometere123/covaunt`
- Vault: `vault.covauntops26.testnet`
- DAO: `covaunt26.sputnikv2.testnet`
- Valid settlement: `https://explorer.testnet.near.org/transactions/Gv7yUyZ24JkPSW4p12pM8cLG48e83ZkMkzagZAENioG1`
- Forbidden execution: `https://explorer.testnet.near.org/transactions/BdP4EaxEdfGXda1k1LnCow5JJZBC5Z7k5rdBWGoskArw`
- Refund: `https://explorer.testnet.near.org/transactions/DKJEShdGxtLai6xPdRC7JzJ8EwAggv4jqHkz2RLRzU7V`
- Public testnet preview: `https://covaunt-git-release-covaunt-260dfa-delealufejoel-4184s-projects.vercel.app`
- Preview source: `release/covaunt-nextjs-vercel-preview` at `e084c09b75dd3ab2a766820b8f4f4f72ce2208c5`

The public URL above is a verified read-only/live-testnet preview. A real HOT or Meteor wallet signature and browser-to-wallet write walkthrough still require an authorized human; do not describe that write path as independently verified until it is exercised.

## Public X draft

> COVAUNT is a Social Money treasury on @NEARProtocol where collective governance cannot rewrite individual donor consent.
>
> We verified a real testnet lifecycle: 9 NEAR healthcare settlement, a unanimous 2 NEAR override rejected by the vault, and a successful donor refund.
>
> Vote together. Keep promises specific.
>
> Testnet evidence and source: [repository URL]

Publish only after human review of the actual URL, evidence timestamp and FullAccess disclosure.
