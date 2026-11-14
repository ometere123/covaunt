# near.social boundary

near.social is a NEAR mainnet social protocol. COVAUNT treats it as optional public context, not as a testnet treasury dependency and not as an authority for work completion.

## Implemented path

Contributor profiles can request read-only public FastData KV records through `web/app/api/near-social/route.ts`. The route accepts only a validated NEAR account ID and the `profile/` or `post/` key prefixes, then reads the public mainnet endpoint configured by `NEXT_PUBLIC_NEAR_SOCIAL_API` (default: `https://kv.main.fastnear.com`). No secret or wallet credential is used.

The UI labels the result **near.social activity — Mainnet · read only** and states that posts, likes and followers are not task evidence, settlement history or reputation input. The app does not sign `__fastdata_kv` writes.

## Why writes are disabled

The COVAUNT application signs NEAR testnet transactions for the deployed vault and Sputnik DAO. near.social writes are mainnet FunctionCall transactions to the `social` account and require a separate network/account compatibility check. Signed social posting and cross-network identity binding were not independently verified for this release, so they are not advertised or enabled.

A mainnet social account and a testnet contributor account must not be assumed to be the same controlled identity. Any future attribution needs explicit account proof and must remain separate from the vault’s donor-consent rules.

## Official references

- [near.social protocol documentation](https://near.social/docs)
- [NearSocial/social-db](https://github.com/NearSocial/social-db)

The public read integration is a context feature only. If the endpoint is unavailable, the profile displays the error and keeps the contract-derived work record separate.
