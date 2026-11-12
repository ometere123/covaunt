# COVAUNT — demo, presentation and submission kit

## Opening pitch (20 seconds)

“Communities vote on how to spend pooled money. But what if a majority approves a payment that violates one donor's promise? COVAUNT keeps donor permissions binding **inside** a shared treasury. You can govern collectively without converting each contribution into a blank cheque.”

## Demonstration storyboard (90–150 seconds if event allows)

| Time | Show | Independent evidence |
|---|---|---|
| 00:00–00:12 | Distinct parchment-and-ink interface; show donor-level permission idea | None beyond product walkthrough |
| 00:12–00:30 | Three contributor accounts, 8/6/4 testnet grant deposits | Three NEAR tx links / `get_contributions` |
| 00:30–00:42 | Quote medical 9 NEAR; show B6 + C3 while A8 intact | Live `quote` RPC |
| 00:42–01:05 | Real Sputnik council proposal and votes | DAO `add_proposal`, `act_proposal` receipts |
| 01:05–01:20 | Contract transfer becomes `Settled` and clinic is credited | NEAR receipt and `get_spend` |
| 01:20–01:42 | Council approves deliberate diversion; target rejects incompatible funding | Real failed cross-contract receipt / unchanged donor A |
| 01:42–02:00 | Show donor refund, accounting and source tests | Testnet refund receipt / public README |

If the hackathon demo demands 60 seconds, cut to the three highlights: real DAO vote, successful compatible payout and blocked incompatible payout, with the rest in an extended public technical video. Do not accelerate timestamps in a way that misrepresents real execution.

## Project title

**COVAUNT — A Community Treasury That Cannot Outvote Donor Consent**

## Recommended submission positioning

- **Primary track:** Social Money — COVAUNT is a shared native-NEAR treasury where collective governance cannot erase individual contribution conditions.
- **Secondary track:** DAO / governance infrastructure, if the event offers a separate governance category.
- **Submission title:** COVAUNT — A Community Treasury That Cannot Outvote Donor Consent.

## Submission description (draft)

COVAUNT is a consent-bound treasury for NEAR communities governed by Sputnik DAO. Contributors lock native NEAR with immutable purpose, beneficiary and expiry conditions. Council members can propose and vote on spending, but even a unanimously approved proposal cannot redirect a contributor's money outside those constraints. A bounded deterministic allocator combines compatible donations, reserves exact contributions, and settles payments through callback-verified native NEAR transfers. Expired unspent deposits are recoverable by the donor without governance approval. The web interface includes a public capital register, deposit desk, allocation preview, Sputnik FunctionCall integration and settlement journal. Built entirely on NEAR; no GenLayer required.

The local release proves the contract behavior in NEAR Sandbox, including successful compatible settlement, failed-transfer recovery, replay rejection and expiry refund. Replace that sentence with the exact live DAO vote, transfer, rejection and refund evidence only after the testnet sequence is actually executed. The current artifact contains no live addresses or transaction claims.

## Public X post draft

“An approved vote is not the same as donor consent.

Meet COVAUNT: a NEAR-native treasury where communities govern together, but each contribution stays bound to the contributor's original purpose and beneficiaries.

The contract settles compatible capital, restores failed transfers, and refuses a majority-approved diversion that violates a donor's conditions.

[REAL HTTPS DEMO URL] [REAL REPOSITORY URL] #NEARHackathon”

Do not publish with placeholder links. Confirm current official contest hashtag and submission instructions on the actual hackathon portal immediately before posting. Public hackathon participation rules, timing and host requirements can change.

## Current release evidence

The local evidence package is complete for source, Rust, WASM, sandbox and browser gates. The two screenshots in `docs/screenshots/` are real Chromium captures of the explicitly labeled design preview. The following remain external prerequisites and must not be implied by this draft: a real Sputnik DAO code hash and policy, testnet account addresses, proposal/vote/settlement/refund receipts, recipient balance checks, FullAccess-key review, public HTTPS URL, public repository URL and submission-portal acceptance.

## Source and video prerequisites

- Public GitHub repository containing root README, code, test outputs, release-status disclosure and demo instructions.
- Real deployed contract account and real Sputnik DAO account with proof they are the contracts claimed.
- Public hosted UI with real connected testnet data; normal wallet transaction confirmation.
- True transaction hashes for deposits, proposal approval, successful transfer, unauthorized failure and refund.
- Video screen capture of genuine behavior; if any step uses preview, label it unequivocally.
- Short description of limitations: off-chain use, DAO administration, FullAccess keys, cap, gas and asynchronous callbacks.

## Suggested headings for project portal

- Problem: votes should not erase personal donor restrictions
- Breakthrough: simultaneous collective governance and individual contribution boundaries
- Architecture: immutable grant permissions + real Sputnik `FunctionCall` votes + NEAR settlement callbacks
- Proof: real successful, failed and recovery transactions
- Security: direct-call rejection, recipient/purpose checks, expiry, replay, accounting, storage reserve
- Status: testnet/hackathon demo, experimental financial contract, not audited

## Recording checklist

Hide personal account secrets and seed phrases, show entire browser URL and explorer link for credibility, avoid cuts that obscure the transaction outcome, capture an adverse test with the error visible, use readable typography, and end by showing the **actual repo URL**.
