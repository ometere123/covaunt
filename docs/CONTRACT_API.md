# COVAUNT — contract ABI, roles, and receipts

**Network target:** NEAR testnet. **Asset:** native NEAR (yoctoNEAR integer values). **Purpose bits:** Education `1`, Healthcare `2`, Emergency relief `4`, Public works `8`, Culture `16`. A donor may OR bits; each spending proposal contains exactly one bit.

## Initialization

```json
{"dao_id":"your-dao.testnet","name":"The Commons"}
```

`new(dao_id: AccountId, name: String)` payable at least 5 NEAR from deployer as non-donor storage reserve. The DAO account cannot equal the COVAUNT contract account.

## Donor actions

```json
{"allowed_purposes":3,"recipients":["clinic.testnet","school.testnet"],"withdraw_after_ns":"2000000000000000000","note":"Healthcare and education only"}
```

`contribute(...)` payable native NEAR (minimum 0.01). Grant is immutable, account lists must be unique and length 1–8, expiry must be at least 60 seconds in the future, notes at most 180 UTF-8 bytes. Returns ID. It is **not** token-transfer-call based.

`request_refund({"id":0})`: caller must be donor; available balance may be refunded after `withdraw_after_ns`. Full refund of current available amount is reserved pending callback; no premature withdrawal or manual amount selection. Returns a NEAR Promise.

## DAO-only spending

`execute_spend({"id":"cvt-unique-001","recipient":"clinic.testnet","purpose":2,"amount":"9000000000000000000000000","title":"Medical equipment","reference":"ipfs://..."})`

Caller must be exactly `dao_id`. ID UTF-8 bytes 8–64, title 1–120, reference <=200. Native transfer is asynchronous. `get_spend` displays `InFlight`, `Settled` or `Failed` after callback. Failing outbound NEAR transfer restores donor `available` capital. The **DAO function-call action** attaches `0` deposit and proposes `150000000000000` gas.

### Sputnik `add_proposal` example

```json
{
  "proposal": {
    "description": "COVAUNT | equipment reimbursement",
    "kind": {"FunctionCall": {
      "receiver_id": "your-covaunt.testnet",
      "actions": [{
        "method_name": "execute_spend",
        "args": "BASE64_ENCODING_OF_UTF8_JSON_ABOVE",
        "deposit": "0",
        "gas": "150000000000000"
      }]
    }}
  }
}
```

The `add_proposal` transaction attaches the current DAO `proposal_bond` from `get_policy`. Council voting uses `act_proposal` `VoteApprove` / `VoteReject`; the UI supplies the proposal kind as needed by deployed Sputnik code. DAO policy defines who can propose and vote. The actual DAO contract must be independently verified on testnet before the hackathon demo.

## View methods

| Method | Args | Return |
|---|---|---|
| `get_summary` | `{}` | Name, DAO, storage reserve, deposited, paid, refunded, available, pending, counts, `is_balanced` |
| `get_contribution` | `{"id":0}` | Optional donor grant + accounting |
| `get_contributions` | `{"from_index":0,"limit":40}` | Paginated donor grants (max 40 per call) |
| `get_spend` | `{"id":"cvt-..."}` | Optional mandate, allocations, status |
| `get_spends` | `{"from_index":0,"limit":40}` | Paginated spend journal (max 40) |
| `quote` | `{"recipient":"clinic.testnet","purpose":2,"amount":"9000000000000000000000000"}` | `permitted`, `shortfall`, allocations, reason |

`U128` / `U64` values render as JSON decimal strings; sums must be checked using BigInt. `quote` is advisory and may become stale before DAO approval. The contract recalculates exactly at execution.

## Events

NEP-297-style `EVENT_JSON` logs use `standard: "covaunt"`, `version: "1.0.0"` and `data: [record]`, with events `contribution_created`, `spend_reserved`, `spend_settled`, `spend_failed`, `refund_reserved`, `refund_settled`, `refund_failed`. These help index activity but are not a substitute for reconciling final contract state and transfer receipts.

## Failure strings

`ERR_STORAGE_RESERVE`, `ERR_NAME`, `ERR_MIN_CONTRIBUTION`, `ERR_LEDGER_CAPACITY`, `ERR_PURPOSE_MASK`, `ERR_RECIPIENTS`, `ERR_NOTE`, `ERR_MIN_LOCK`, `ERR_DUP_RECIPIENT`, `ERR_DAO_RECIPIENT`, `ERR_SELF_RECIPIENT`, `ERR_DAO_ONLY`, `ERR_MANDATE_ID`, `ERR_REPLAY`, `ERR_SPEND_CAPACITY`, `ERR_PURPOSE`, `ERR_AMOUNT`, `ERR_UNSAFE_RECIPIENT`, `ERR_TITLE`, `ERR_REFERENCE`, `ERR_NOT_ENOUGH_ELIGIBLE_CAPITAL`, `ERR_RESERVE_RACE`, `ERR_OVERFLOW`, `ERR_DONOR_ONLY`, `ERR_STILL_LOCKED`, `ERR_REFUND_IN_FLIGHT`, `ERR_NOTHING_TO_REFUND`, `ERR_REFUND_CALLBACK`, `ERR_CALLBACK_PROMISE_COUNT`, `ERR_UNKNOWN_SPEND`, `ERR_ALREADY_FINALIZED`, `ERR_LEDGER_MISMATCH`, `ERR_CONTRIBUTION`, `ERR_STORAGE_RESERVE_EXHAUSTED`.

Rust callback methods `on_spend_complete` and `on_refund_complete` are annotated `#[private]`: externally invoking them directly is not authorized.
