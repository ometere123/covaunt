# Local verification results — 12 November 2026

These are executed local or WSL checks from the extracted release tree. They are not NEAR testnet evidence and do not prove Sputnik governance.

| Command | Observed result | Classification |
|---|---|---|
| `npm install` | Exit 0 after the platform-neutral root `.npmrc` was added; npm reported 15 dev-tree advisories and cleanup warnings from mixed Windows/WSL node processes | PASS with dependency disclosure |
| `npm test` | 12 passed / 0 failed / 0 skipped | PASS |
| `npm run proof` | 18.00 NEAR illustrative allocation: B 6.00 + C 3.00; education-only diversion denied | PASS; dry-run only |
| `npm run verify:static` | 13 required files and contract/UI hooks passed | PASS; static only |
| `cd contract && cargo test` | 13 passed / 0 failed / 0 ignored; doc tests 0 | PASS under WSL/Linux |
| `cargo near build non-reproducible-wasm --no-abi` | 183,746-byte WASM built; SHA-256 `96762824a7226f90981b9685890146d94f4a06dc8a3e66e1f9893254f9896888` | PASS under WSL/Linux |
| `npm run test:sandbox` | 1 passed / 0 failed / 0 skipped; NEAR Sandbox 2.14.0; duration about 60 seconds | PASS under WSL/Linux |
| `cd web && npm install` | Exit 0; web dependency tree reports 10 low production advisories through the wallet cryptography graph | PASS with dependency disclosure |
| `cd web && npm run build` | Vite 7.3.8 bundle built; third-party `util` externalization and `js-sha256` eval warnings | PASS with warnings |
| `cd web && npm run test:browser` | 10 passed / 0 failed on desktop and mobile Chromium | PASS |
| Browser screenshots | Full-page desktop 1440px and mobile 390px captures visually inspected | PASS; design preview only |
| `npm audit --omit=dev` in root | 0 production vulnerabilities | PASS |
| `npm audit --omit=dev` in web | 10 low findings through `elliptic`; force-fix would be breaking | REVIEW REQUIRED |
| Real Sputnik DAO / testnet deployment | No funded signer, DAO account, deployment authority or wallet session available | BLOCKED, not attempted |
| Public HTTPS hosting / GitHub push | No authorized destination supplied | BLOCKED, not attempted |

## Sandbox behavior observed

The receipt test created the 8/6/4 contributions, rejected a non-DAO call, settled the valid 9 NEAR clinic payment, rejected an incompatible DAO-identity request, rejected mandate replay, restored a failed transfer to `ghost.test.near`, and settled an expired 1 NEAR refund. Final logical totals were `total_paid=9 NEAR`, `total_refunded=1 NEAR`, `is_balanced=true`.

The sandbox DAO caller is a controlled account. It is deliberately not described as a Sputnik DAO vote.

## Platform note

The legacy `near-sandbox` npm postinstall rejects native Windows. The root `.npmrc` disables package scripts and `scripts/ensure-sandbox.mjs` downloads NEAR Sandbox `2.14.0` from the official build archive, checks its version and requires Linux x64. This keeps `npm install` reproducible on Windows while making the receipt gate explicit about its Linux/WSL requirement.
