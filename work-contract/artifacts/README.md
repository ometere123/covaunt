# COVAUNT Work & Trust contract artifact

`covaunt_work.wasm` is a separately built auxiliary contract for community task escrow and bounded rewards. It is not deployed by this repository change and it cannot access the deployed COVAUNT vault's donor principal.

- Build command: `cargo near build non-reproducible-wasm --no-abi`
- near-sdk: `5.30.1`
- cargo-near: `0.23.0`
- Size: `216670` bytes
- SHA-256: `1580bd5b0a029c79aa953c122b755e8e8a060af4a6d8e893a73970f062689d5b`
- SHA-256 base58: `2SwRLmgBQ1JxaHARadZKwqKA9yYjjxLjvAMEGy21rPeS`

This artifact was built locally in WSL from the reviewed role-hardening source on 2026-11-14 using `cargo-near 0.23.0`, `rustc 1.95.0` and `near-sdk 5.30.1`. The command is explicitly non-reproducible across toolchain environments; the follow-up GitHub Actions artifact will be recorded as the deployment candidate after the branch passes CI. A testnet deployment, account identity, funded reward budget and live wallet flow remain human-authorized gates.

The historical pre-hardening artifact from CI run `43541716644` was 214,474 bytes with SHA-256 `0ab11329ddb982393631d2aa62eb275613f4bf5f78bc3e71e3f43e40e00eb3f6`; it is not used for this source revision.
