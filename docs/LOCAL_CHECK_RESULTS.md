# Local check record

**Recorded:** 14 November 2026
**Environment:** Windows 11, Node.js 22.23.3, npm 10.9.9; WSL Ubuntu Node.js 22.23.5, npm 10.9.9, Rust 1.95.0, Cargo 1.95.0, cargo-near 0.23.0

| Check | Result |
| --- | --- |
| `npm ci` (root) | PASS in the verified checkout |
| `npm test` | PASS; 12/12 |
| `npm run proof` | PASS |
| `npm run verify:static` | PASS |
| `cd contract && cargo test` | PASS; 13/13, 0 ignored; WSL |
| Native Windows `cd contract && cargo test` | NOT RUN TO COMPLETION; environment lacks MSVC `link.exe`; WSL run is the reproducible Rust gate |
| `cargo near build non-reproducible-wasm --no-abi` | PASS; 183,746 bytes |
| `npm run test:sandbox` | PASS; 1/1 receipt/state-machine test, no skips; WSL NEAR Sandbox 2.14.0 |
| `cd web && npm ci` | PASS after Next migration |
| `cd web && npm run typecheck` | PASS |
| `cd web && npm run lint` | PASS; zero warnings |
| `cd web && npm run build` | PASS; all required routes generated |
| `cd web && npm run test:browser` | PASS; 22/22 desktop/mobile Chromium |
| `npm run verify:live` | Real values read; intentional non-zero FullAccess-key blocker |
| `npm audit --omit=dev --audit-level=high` (web) | PASS threshold; 4 low transitive `elliptic` findings remain, no forced breaking fix applied |

The Rust and sandbox counts were rerun in WSL after the frontend migration. Browser output is split between deterministic preview tests and labeled RPC fixtures; fixture tests do not count as live wallet evidence.

## Toolchain and artifact

- `@hot-labs/near-connect`: 0.12.0
- Next.js: 16.4.6
- React / React DOM: 19.3.1
- TypeScript: 5.9.3
- Playwright: 1.65.0
- ESLint / eslint-config-next: 9.39.5 / 16.4.6
- `contract/artifacts/covaunt.wasm`: 183,746 bytes
- SHA-256: `96762824A7226F90981B9685890146D94F4A06DC8A3E66E1F9893254F9896888`
- Base58 code hash: `B8LetBV7jQjzL8yPjkLbvy73NALaUpAn86FVsBqTjE9u`
- `work-contract/artifacts/covaunt_work.wasm`: 214,474 bytes, canonical GitHub Actions artifact from run `43540098542`
- Work artifact SHA-256: `0ab11329ddb982393631d2aa62eb275613f4bf5f78bc3e71e3f43e40e00eb3f6`
- Work Rust tests: 13/13; Work sandbox receipt tests: 1/1 combined with the preserved vault test suite (2/2 total)
