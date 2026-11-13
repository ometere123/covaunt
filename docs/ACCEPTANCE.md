# COVAUNT acceptance matrix

Updated 13 November 2026 from the repository gates and the recorded testnet evidence. The 5/5 category ambitions are judging targets, not self-awarded scores.

| Gate | Evidence | Status |
| --- | --- | --- |
| Source and documentation | Contract, Next routes, tests, scripts, live evidence and release docs | PASS |
| Static checks | `npm run verify:static` | PASS |
| Allocator and invariants | `npm test`, `npm run proof` | PASS; rerun recorded in final report |
| Rust contract | `cd contract && cargo test` | PASS; 13/13 in WSL |
| Contract WASM | `cargo near build non-reproducible-wasm --no-abi`; artifact hash recorded | PASS; 183,746-byte artifact |
| Sandbox receipts | `npm run test:sandbox` | PASS; 1/1 in WSL NEAR Sandbox 2.14.0, no skips |
| Next production build | `cd web && npm run build` | PASS |
| TypeScript and lint | `npm run typecheck`, `npm run lint` | PASS; zero lint warnings |
| Browser verification | `npm run test:browser` | PASS; 14/14 desktop/mobile Chromium |
| Real Sputnik identity | `covaunt26.sputnikv2.testnet`, policy and bond read from RPC | PASS |
| Real donor contributions | Four recorded contributions, 18.1 NEAR total | PASS in `docs/live-evidence/evidence.json` |
| Compatible settlement | 9 NEAR healthcare payment settled with receipts | PASS; `Gv7yUyZ24JkPSW4p12pM8cLG48e83ZkMkzagZAENioG1` |
| Approved diversion blocked | 2 NEAR proposal ended in failed downstream execution | PASS; `BdP4EaxEdfGXda1k1LnCow5JJZBC5Z7k5rdBWGoskArw` |
| Refund behavior | Early refund failed; later 0.1 NEAR refund settled | PASS; `DKJEShdGxtLai6xPdRC7JzJ8EwAggv4jqHkz2RLRzU7V` |
| Accounting | 18.1 deposited, 9 paid, 0.1 refunded, 9 available, zero pending, balanced | PASS at evidence retrieval |
| Physical solvency | Liquid estimate backed outstanding donor principal | PASS with stated storage-price estimate |
| Upgrade authority | FullAccess key remains on vault account | BLOCKED for immutability claim |
| Wallet-to-contract browser writes | Multi-wallet connector installed and fixture-tested; real wallet signature in this migration | NOT RUN / external human flow |
| Public HTTPS hosting | No authorized hosting target or URL | BLOCKED |
| Hackathon submission | Requires explicit human authorization | BLOCKED |
| Professional security audit | Not commissioned or claimed | NOT RUN |

## Critical acceptance scenario

The contract’s local Rust and sandbox tests cover the 8/6/4 scenario: education-only A remains protected, healthcare-only B supplies 6, and flexible C supplies 3 for a 9 NEAR clinic payment. The recorded testnet evidence shows the same principle in a real Sputnik lifecycle. A later incompatible approval did not become a beneficiary payment.

## Go / no-go

No-go conditions remain: a contract compile failure, skipped sandbox receipts, ledger imbalance, a successful unauthorized diversion, hidden upgrade authority, fabricated live data or a UI payment claim unsupported by final contract state. The current artifact is a **conditional testnet release** only: `READY_WITH_DISCLOSED_LIMITATIONS`.

## Reproduction notes

Use the commands in `README.md` and `docs/FINAL_RELEASE_VERIFICATION.md`. The live audit is read-only:

```bash
COVAUNT_ACCOUNT=vault.covauntops26.testnet \
DAO_ACCOUNT=covaunt26.sputnikv2.testnet \
node scripts/audit-testnet.mjs
```

The audit intentionally exits non-zero while a FullAccess key remains. That failure is a security signal, not a missing-data test failure.
