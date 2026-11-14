# COVAUNT Work & Trust contract artifact

`covaunt_work.wasm` is a separately built auxiliary contract for community task escrow and bounded rewards. It is not deployed by this repository change and it cannot access the deployed COVAUNT vault's donor principal.

- Build command: `cargo near build non-reproducible-wasm --no-abi`
- near-sdk: `5.30.1`
- cargo-near: `0.23.0`
- Size: `216158` bytes
- SHA-256: `50e3ea76d1d0da8d2cdfaf977149e59c76277dd85a3c92e44baee54188204500`
- SHA-256 base58: `6SmBmxFQQaAhnP19yadMa1A5eroNg98jh1qYgQm2yNsh`

The canonical artifact was downloaded from clean-checkout GitHub Actions run `43578729757` after the role-hardening source passed both jobs. It is the exact candidate for a future deployment. The command is explicitly non-reproducible across toolchain environments, so local builds may differ byte-for-byte. A testnet deployment, account identity, funded reward budget and live wallet flow remain human-authorized gates.

The historical pre-hardening artifact from CI run `43541716644` was 214,474 bytes with SHA-256 `0ab11329ddb982393631d2aa62eb275613f4bf5f78bc3e71e3f43e40e00eb3f6`; it is not used for this source revision. The local WSL build of the changed source was 216,670 bytes with SHA-256 `1580bd5b0a029c79aa953c122b755e8e8a060af4a6d8e893a73970f062689d5b`.
