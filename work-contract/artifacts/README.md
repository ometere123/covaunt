# COVAUNT Work & Trust contract artifact

`covaunt_work.wasm` is a separately built auxiliary contract for community task escrow and bounded rewards. It is not deployed by this repository change and it cannot access the deployed COVAUNT vault's donor principal.

- Build command: `cargo near build non-reproducible-wasm --no-abi`
- near-sdk: `5.30.1`
- cargo-near: `0.23.0`
- Size: `214979` bytes
- SHA-256: `f28f4c82f6ed52177ec8b46fba70d99b01f40d055f4744eb46ff2aea0ee42140`
- SHA-256 base58: `5oC4N2dyZuzKaZKx7BHPKoiy2MetYWSHYummGWr5pfjt`

The artifact has passed local Rust unit tests and a local WASM build. A testnet deployment, account identity, funded reward budget and live wallet flow remain human-authorized gates.
