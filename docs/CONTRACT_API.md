# COVAUNT contract API

**Network:** NEAR testnet
**Contract:** `vault.covauntops26.testnet`
**DAO predecessor:** `covaunt26.sputnikv2.testnet`
**Code hash:** `B8LetBV7jQjzL8yPjkLbvy73NALaUpAn86FVsBqTjE9u`

All monetary arguments and responses are integer yoctoNEAR strings. Purpose bits are Education `1`, Healthcare `2`, Emergency relief `4`, Public works `8` and Culture `16`. Contributions may OR several bits; each spend request must use one bit.

## Initialization

```json
{"dao_id":"covaunt26.sputnikv2.testnet","name":"COVAUNT"}
```

`new` is payable and requires at least 5 NEAR as a segregated storage reserve. The stored DAO cannot equal the vault account. The initialized values are not mutable through the public ABI.

## Write methods

### `contribute`

Payable native NEAR. Arguments:

```json
{
  "allowed_purposes": 3,
  "recipients": ["clinic.testnet", "school.testnet"],
  "withdraw_after_ns": "<future nanosecond timestamp>",
  "note": "Healthcare and education only"
}
```

The contract enforces a minimum of 0.01 NEAR, at most 256 contributions, a valid mask, one to eight unique recipients, a note of at most 180 bytes, a minimum lock and no DAO/vault recipient. Donor, principal, mask, recipient list and expiry are stored as one immutable record.

### `execute_spend`

Only `dao_id` may call this method. A direct wallet call fails `ERR_DAO_ONLY`.

```json
{
  "id": "cvt-unique-001",
  "recipient": "clinic.testnet",
  "purpose": 2,
  "amount": "9000000000000000000000000",
  "title": "Medical equipment",
  "reference": "https://example.invalid/evidence"
}
```

The contract checks mandate length, replay, capacity, single purpose, positive amount, safe recipient, bounded title/reference and exact eligible capital. It moves each allocation from `available` to `pending_spend`, records `InFlight`, transfers native NEAR and schedules the private callback.

### `request_refund`

Donor-only, no attached deposit:

```json
{"id": 3}
```

The record must be past `withdraw_after_ns`, have no refund in flight and have available balance. The available balance is reserved, transferred to the original donor and finalized by `on_refund_complete`. A failed transfer restores availability.

## View methods

| Method | Purpose |
| --- | --- |
| `get_summary` | Name, DAO, storage reserve, totals, pending obligations, counts and conservation boolean |
| `get_contribution` | One full donor record by numeric ID |
| `get_contributions` | Bounded page with `from_index` and `limit` up to 40 |
| `get_spend` | One spend by replay-resistant mandate ID |
| `get_spends` | Bounded spend page up to 40 |
| `quote` | Exact current allocation preview for recipient, one purpose and amount |

`quote` is advisory. The contract computes the allocation again inside `execute_spend` after DAO approval. A stale quote cannot authorize incompatible money.

## Callback state machine

```text
available -> pending_spend -> paid       (successful transfer callback)
available -> pending_spend -> available  (failed transfer callback)
available -> pending_refund -> refunded  (successful refund callback)
available -> pending_refund -> available  (failed refund callback)
```

Callbacks are `#[private]`, require exactly one promise result and reject unexpected finalization or mismatched amounts. `get_summary` checks:

```text
total_deposited = total_paid + total_refunded + available + pending_spend + pending_refund
```

## Sputnik proposal format

The browser reads `get_policy` on `covaunt26.sputnikv2.testnet`, attaches the returned `proposal_bond` (verified as 1 NEAR), and submits:

```json
{
  "description": "<COVAUNT metadata JSON>",
  "kind": {
    "FunctionCall": {
      "receiver_id": "vault.covauntops26.testnet",
      "actions": [{
        "method_name": "execute_spend",
        "args": "<base64 JSON>",
        "deposit": "0",
        "gas": "150000000000000"
      }]
    }
  }
}
```

Council voting uses the actual DAO method:

```json
{"id": 0,"action":"VoteApprove","proposal":<proposal kind>,"memo":"COVAUNT council approval"}
```

The verified second approval used 300 Tgas. Policy, membership and threshold are always read from the DAO; a connected wallet is not automatically a council member.

## Events

The contract emits NEP-297-style `EVENT_JSON` logs with standard `covaunt`, version `1.0.0`: `contribution_created`, `spend_reserved`, `spend_settled`, `spend_failed`, `refund_reserved`, `refund_settled` and `refund_failed`. Events assist indexing but final state and receipts remain authoritative.
