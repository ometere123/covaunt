# COVAUNT acceptance matrix

Updated 14 November 2026 from the repository gates and the recorded testnet evidence. The 5/5 category ambitions are judging targets, not self-awarded scores.

| Gate | Evidence | Status |
| --- | --- | --- |
| Source and documentation | Contract, Next routes, tests, scripts, live evidence and release docs | PASS |
| Static checks | `npm run verify:static` | PASS |
| Allocator and invariants | `npm test`, `npm run proof` | PASS; rerun recorded in final report |
| Rust contract | `cd contract && cargo test` | PASS; 13/13 in WSL |
| Contract WASM | `cargo near build non-reproducible-wasm --no-abi`; artifact hash recorded | PASS; 183,746-byte artifact |
| Preserved vault sandbox receipts | `npm run test:sandbox` at the release checkpoint | PASS historically; the preserved test remains in the gate |
| Work & Trust Rust contract | `cargo test --manifest-path work-contract/Cargo.toml` | PASS; 13/13, no ignored tests |
| Work & Trust WASM | `cargo near build non-reproducible-wasm --manifest-path work-contract/Cargo.toml --no-abi` | PASS; canonical CI artifact 214,474 bytes from run `43536663435`, not deployed |
| Work & Trust sandbox receipts | `npm run test:sandbox` with Linux NEAR Sandbox 2.14.0 | PASS; 2/2 total receipt tests, no skips, including small callback settlement and direct large-path rejection |
| Next production build | `cd web && npm run build` | PASS |
| TypeScript and lint | `npm run typecheck`, `npm run lint` | PASS; zero lint warnings |
| Browser verification | `npm run test:browser` | PASS; 22/22 desktop/mobile Chromium |
| Real Sputnik identity | `covaunt26.sputnikv2.testnet`, policy and bond read from RPC | PASS |
| Real donor contributions | Preserved evidence: four contributions, 18.1 NEAR; current read: five contributions, 18.2 NEAR | PASS; preserved in `docs/live-evidence/evidence.json`, current read in `docs/live-evidence/current-audit.json` |
| Compatible settlement | 9 NEAR healthcare payment settled with receipts | PASS; `Gv7yUyZ24JkPSW4p12pM8cLG48e83ZkMkzagZAENioG1` |
| Approved diversion blocked | 2 NEAR proposal ended in failed downstream execution | PASS; `BdP4EaxEdfGXda1k1LnCow5JJZBC5Z7k5rdBWGoskArw` |
| Refund behavior | Early refund failed; later 0.1 NEAR refund settled | PASS; `DKJEShdGxtLai6xPdRC7JzJ8EwAggv4jqHkz2RLRzU7V` |
| Accounting | Current read: 18.2 deposited, 9 paid, 0.1 refunded, 9.1 available, zero pending, balanced | PASS at current audit; older 18.1 snapshot retained |
| Physical solvency | Liquid estimate backed outstanding donor principal | PASS with stated storage-price estimate |
| Upgrade authority | FullAccess key remains on vault account | BLOCKED for immutability claim |
| Wallet-to-contract browser writes | Multi-wallet connector installed and fixture-tested; real wallet signature in this migration | NOT RUN / external human flow |
| Existing public HTTPS preview | Feature branch preview, live route evidence and honest unconfigured Work state | PASS; `covaunt-git-feature-covaunt-db31e4-delealufejoel-4184s-projects.vercel.app` |
| Hackathon submission | Requires explicit human authorization | BLOCKED |
| Professional security audit | Not commissioned or claimed | NOT RUN |
| near.social | Read-only mainnet FastData KV boundary | PASS as a labelled read-only integration; signed posting not enabled |
| Trezu | Compatibility investigation and adapter boundary | NOT INTEGRATED; existing DAO compatibility unverified |
| Public Work & Trust deployment | Separate funded testnet account and live task evidence | NOT RUN; intentionally not deployed |

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
