# Trezu compatibility note

**Status:** investigated; not integrated.

Trezu, also known as Treasury26, is a separate treasury and multisig application. Its documented model centers on a non-custodial multisig wallet contract and its current frontend/backend assumptions are oriented around NEAR mainnet. The existing COVAUNT governance account is the already deployed Sputnik testnet DAO `covaunt26.sputnikv2.testnet`, and the donor vault is `vault.covauntops26.testnet`.

No supported Trezu adapter was found that can represent this existing arbitrary testnet Sputnik DAO, read its complete COVAUNT-specific execution history and safely execute the vault’s `execute_spend` path. Trezu’s testnet mock behavior is not a production execution integration. A link or provider label would therefore be misleading.

## Boundary prepared in the application

`web/lib/treasury-integration.ts` defines a descriptive adapter boundary with an explicit `not-integrated` status. It has no RPC, signing, proposal or custody behavior. The About route discloses that Trezu is not connected, and no duplicate treasury is launched.

## Future adapter requirements

An actual adapter would need to prove, on testnet, that it can:

1. identify the existing Sputnik DAO and its policy without substituting another treasury;
2. encode the exact COVAUNT FunctionCall and one-NEAR proposal bond;
3. preserve council thresholds and vote identities;
4. display DAO authorization separately from COVAUNT callback settlement;
5. prevent any path around donor purpose and recipient restrictions; and
6. produce explorer-linked receipts for both the governance action and downstream payment.

Until those checks are independently exercised, COVAUNT’s native Sputnik integration remains the only claimed governance path.

## Official references

- [Trezu repository](https://github.com/NEAR-DevHub/trezu)
- [Trezu architecture](https://github.com/NEAR-DevHub/trezu-docs/blob/main/what-is.mdx)
- [Trezu frontend notes](https://github.com/NEAR-DevHub/trezu/blob/main/nt-fe/README.md)
