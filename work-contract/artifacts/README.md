# COVAUNT Work & Trust contract artifact

`covaunt_work.wasm` is a separately built auxiliary contract for community task escrow and bounded rewards. It is not deployed by this repository change and it cannot access the deployed COVAUNT vault's donor principal.

- Build command: `cargo near build non-reproducible-wasm --no-abi`
- near-sdk: `5.30.1`
- cargo-near: `0.23.0`
- Size: `214474` bytes
- SHA-256: `0ab11329ddb982393631d2aa62eb275613f4bf5f78bc3e71e3f43e40e00eb3f6`
- SHA-256 base58: `ijgcCx1XmC4gJg1RsVE2UFJoyzgt29k5R3G8b799Dk9`

The canonical artifact was downloaded from the fresh-checkout GitHub Actions run `43541716644`; the local WSL build also passed but is not byte-identical because the command is explicitly non-reproducible across toolchain environments. A testnet deployment, account identity, funded reward budget and live wallet flow remain human-authorized gates.

Local WSL verification build before selecting the CI artifact: 214,979 bytes, SHA-256 `f28f4c82f6ed52177ec8b46fba70d99b01f40d055f4744eb46ff2aea0ee42140`.
