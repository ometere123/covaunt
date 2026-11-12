# COVAUNT — adversarial threat model

This is a proposed security design, **not** a professional audit or proof of economic safety.

## Security goals

1. A donor's original native NEAR principal can be disbursed only in a contract-authorized allocation to an explicitly whitelisted recipient, within an allowed declared-purpose mask, before grant expiration, and after a call whose predecessor is the appointed Sputnik DAO.
2. DAO votes cannot rewrite purpose masks, approved recipients, donor identities, expiry times, balances or spent allocations.
3. Conservation: per-donor `principal = available + pending_spend + pending_refund + paid + refunded`. Global total sums all donors exactly.
4. Failed native transfer callbacks restore the reserved amount; failed refund callbacks restore donor available principal.
5. Unique mandate IDs cannot be used twice (including if prior transfer failed). A contribution cannot be consumed by two in-flight payouts.
6. Donors can withdraw **available** unused capital once their grant expires, without DAO approval.

## Actor / attack analysis

| Attacker / failure | Attack surface | Contract / application mitigation | Remaining risk |
|---|---|---|---|
| Malicious majority DAO | Passes a diversion proposal | `execute_spend` checks every donor grant regardless of governance vote | Legitimately approved beneficiaries may misuse money after transfer |
| External caller | Directly invokes `execute_spend` | Fixed `dao_id` caller check | DAO upgrade/key compromise can change who calls |
| Donor attempting inconsistent grant | Empty, duplicate, DAO-controlled or self-recipient list | Validate 1–8 unique recipient accounts, mask, amount, note, expiry | Sybil donors and social pressure not prevented |
| Replayer | Reuses prior mandate ID | Persistent ID lookup; one attempt per ID | DAO can pass new ID for same *authorized* commercial objective |
| Race | Grant spent while another vote pending | Atomic reservation before transfer; re-evaluate eligibility on execution | Previously successful preview can become stale |
| Callback failure | Transfer to deleted or invalid account fails | `on_spend_complete` restores availability; failed refund similarly | Callback OOG or runtime changes may leave pending funds stranded |
| Authorization overflow | Large input values / arithmetic | u128 checked additions and bounded collections | Complexity and storage-gas exhaustion still need sandbox verification |
| Permission expiration | DAO attempts payout after expiry | Check current block timestamp, reject expired grant | A pre-expiry reserved payout may settle after expiry |
| Interface compromise | Browser edits proposal arguments | Contract re-checks all permissions | Malicious interface may mislead signer; wallet transaction should be reviewed |
| Phishing / fake DAO | Lookalike DAO or beneficiary account | Configured exact account IDs, explicit summary and audit | Identity resolution is external; account names are not real-world KYC |
| Upgrade/admin compromise | Deployer FullAccess key redeploys WASM | No contract ABI admin/upgrade method; deployment key audit and lockdown required | FullAccess key retains ability to replace all rules; cannot honestly claim immutable until removed |
| Storage exhaustion | More records than storage reserve supports | Fixed contribution/spend caps, storage reserve requirement and reserve guard | Reserve accounting must be verified in sandbox/testnet; costs may change |
| Incorrect purpose | DAO labels a payment as education while funds support something else | Exact declared-purpose matching; recipient-level restriction | No proof of real-world use or semantic correctness |
| Gas / RPC / network outage | Broken vote submission or callback visibility | Read-only receipts, resilient status, no fake success | Users may need manual explorer verification |
| Consent-coercion | Donor pressured to whitelist broad recipients | Immutable restrictions and expiry rights | Social/governance threat outside smart contract |

## Negative demonstrations that must be captured

1. Direct external caller (not DAO) fails with `ERR_DAO_ONLY`.
2. Correct DAO predecessor but incompatible purpose fails `ERR_NOT_ENOUGH_ELIGIBLE_CAPITAL`.
3. Correct purpose but unlisted recipient fails for insufficient eligible capital.
4. Expired contribution is excluded and donor refund succeeds.
5. Replay mandate ID fails with `ERR_REPLAY` even if it previously failed settlement.
6. Allocation cap and contribution limit fail closed without extracting funds.
7. Actual native transfer succeeds and callback marks `Settled`; failing transfer restores availability.
8. Live account reserve and persisted storage-staking checks prove promised donor principal is not improperly consumed by storage.

## Third-party and upgrade risks

Do not promise that Sputnik DAO signatures alone establish rightful consent: policy can be misconfigured or governance can be captured. No direct payment path exists except via the hard-coded DAO, but the **contract account key** can potentially redeploy the code. The production launch condition is to inspect `view_access_key_list` for unexpected or remaining FullAccess keys and remove all unauthorized upgrade powers. Irreversible lockdown demands careful independent review; losing all recovery paths also introduces operational risk. Only use testnet assets for this hackathon demo.

## Explicitly unsupported guarantees

- Proof of off-chain expenditure, beneficiary identity or project impact
- Immunity to phishing or coercion
- Recourse for already-settled authorized payments
- Third-party audit, economic game-theory optimality, compliance certification
- Recovery of funds if a callback becomes permanently stuck before independent engineering resolves the issue

The protocol's useful innovation is constrained **routing authorization** for pooled funds, not a magical universal determination of donor intent.
