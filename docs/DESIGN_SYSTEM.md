# COVAUNT visual direction and UX system

## Design position

**Civic ledger × luxury print editorial.** COVAUNT should feel like a public register and a carefully typeset community charter: calm enough for financial inspection, distinctive enough to remember. It avoids violet/blue gradients, glass surfaces, repetitive SaaS cards, neon crypto styling, decorative mascots and controls that do not work.

## Material and palette

- Archive parchment `#efece4` for the reading surface
- Ink charcoal `#202924` for structure and primary type
- Oxblood `#9d352e` for consequence, selection and the one bright action
- Antique brass `#ae8b55` / `#d5bc8d` for evidence lines and live marks
- Quiet paper neutrals for grouping

Chrome stays quiet. Rich color appears only in the consent mark, settlement evidence and selected states. Borders are hairlines; depth comes from paper steps and ink blocks, not glow or shadow.

## Type and voice

System serif headlines carry promises and consequences. Arial is used for interface text, and Cascadia Mono/Consolas for accounts, amounts and receipt metadata. Amounts use tabular, integer-derived yoctoNEAR formatting. Copy is sentence case, specific and sober: “A vote is not a blank cheque.” “The record begins with a promise.” “DAO approval is not settlement.”

## Route language

1. `/` — the rule and verified live overview
2. `/treasury` — capital register and conservation check
3. `/covenants` — donor permissions and deposit desk
4. `/covenants/[id]` — one donor record and refund eligibility
5. `/mandates` — allocation proof and council docket
6. `/mandates/[id]` — DAO outcome versus vault settlement
7. `/journal` — receipt-backed public evidence
8. `/governance` — policy and council role without automatic privileges
9. `/work` — task register when an auxiliary contract is configured, otherwise an explicit deployment boundary
10. `/work/funding`, `/work/submit`, `/work/tasks/[id]` — task funding, evidence submission and accountable task detail
11. `/contributors/[account]` — contract-derived settled-work record plus separately labelled near.social context
12. `/about` — architecture, limitations and deployment identity

## Interaction rules

- Live RPC errors fail closed; sample values are never shown after a live failure.
- `?mode=preview` is visibly illustrative and disables every write.
- Wallet connection uses a real multi-wallet chooser through near-connect; the site never accepts a key, phrase or password. Connect wallet remains visible on mobile without requiring the navigation menu.
- Contribution, proposal and refund actions have a busy guard and do not retry after uncertain signing.
- Quotes are advisory and re-read from the contract before proposal creation.
- A Sputnik status is never shown as paid; only a COVAUNT `Settled` spend and receipt count as settlement.
- Refund eligibility is donor-only and expiry-bound by contract state.
- Every control has a semantic label, visible focus ring, keyboard path and explicit status copy. Work actions display the configured contract authority and never imply DAO council rights from connection alone.
- Reduced-motion preferences remove nonessential transitions.

## Implementation

The implementation is a handcrafted CSS system in `web/app/globals.css` with Next.js App Router route components under `web/app/` and typed client workflows under `web/components/`. The original seal is available at `web/public/covaunt-mark.svg`. There is no Tailwind, shadcn or generic design-system dependency.

## Verification

The browser suite covers 22 desktop/mobile tests for preview safety, live-mode RPC interpretation, route navigation, responsive menus, Work & Trust no-fabrication behavior, near.social separation, preview-mode write isolation, allocation preview and wallet-gated writes. The current Work & Trust desktop/mobile captures are `docs/screenshots/covaunt-work-desktop.png` and `docs/screenshots/covaunt-work-mobile.png`; they show the unconfigured release boundary. Screenshots are generated from the actual production Next app; any screenshot labeled preview or unconfigured is not live-chain evidence. A full WCAG audit has not been commissioned, although keyboard focus, labels, contrast-oriented palette, landmarks and reduced motion are implemented.
