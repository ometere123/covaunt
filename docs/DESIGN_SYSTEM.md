# COVAUNT — visual direction and UX system

## Design position

**Civic ledger × luxury print editorial.** Imagine a 19th-century community charter reinterpreted by an exceptional contemporary financial editorial studio. The app is serious, expressive, unmistakable and easy to understand. It avoids crypto clichés: no violet/blue gradients, synthetic glass cards, rows of indistinguishable dashboard widgets, giant rounded buttons, dancing AI mascots, stock 3D objects or animated price graphs.

## Palette

- **Archive parchment `#efece4`:** warm reading surface, not bright sterile white.
- **Ink charcoal `#202924`:** text, structural outlines, dark contribution panel.
- **Oxblood rust `#b94732`:** intentional premium accent for calls-to-action and consequences.
- **Antique brass:** small editorial ornaments and line separators.
- **Paper / secondary warm neutrals:** quiet hierarchy and data backgrounds.

Color is not the only signifier of outcome: rejection states also have explicit words and icons. Typography should be legible on narrow phones. Hard structural rules and rhythm replace indiscriminate card shadows.

## Type and voice

Use a large, expressive literary serif for promises/headlines (Playfair Display or licensed system fallbacks), a precise modern sans for interface labels (DM Sans or fallback), and a restrained mono for indices, financial amounts and technical metadata (DM Mono or fallback). Remote Google Font CSS is used as optional web font delivery; no font files are included in the handoff.

Voice: decisive, donor-respecting, never overselling. Examples: “Your word. On the record.” “A vote is not a blank cheque.” “The governing body proposes. The ledger decides.” “The record begins with a promise.” No ambiguous “trustless proof of physical-world good” marketing.

## Information architecture

1. **Manifesto:** explains majority vs donor rights in one sentence and distinct seal.
2. **Capital Register:** principal, allowed uses, beneficiaries, available balance, verified summary.
3. **Deposit Desk:** contract-bound financial consent form with preview of expiry semantics.
4. **Mandate Chamber:** council spending proposal and allocation quote; clear distinction between preview, proposed, approved and **settled**.
5. **Council Docket:** actual proposals, status, council voting controls.
6. **Public Journal:** settled/failed payments, ledger conservation and explorer reference.
7. **Covenant Detail:** grant metadata, available amount, original donor, expiry and refund action when eligible.

## Interaction rules

- **No simulated transfers.** Design preview explicitly disables wallet and submit actions.
- **No sample fallback after a live RPC failure.** The user sees an error and no authenticated ledger.
- **Wallet authorization happens in actual MyNearWallet testnet flow.** Signing starts a transaction; it does not imply on-chain completion.
- **Preview then submit:** mandate quote is advisory, execution rechecks latest balances at transaction time.
- **Disable impossible actions:** a refund only appears for the original donor after expiry; DAO votes require connected account and still may be rejected by real governance policy.
- **Touch friendly:** spacious click/tap targets, clear forms, labeled actions and short feedback messages.
- **Accessible where practical:** semantic landmarks, native form labels, contrast-aware text, keyboard-dialog close and screen-reader status messages. WCAG compliance has **not been audited**.

## Layout implementation

The delivered implementation uses a responsive handcrafted CSS layout (`web/src/style.css`), authored HTML landmarks (`web/index.html`), original vector seal (`web/assets/covaunt-mark.svg`) and a network-aware plain-JavaScript renderer (`web/src/app.js`). No React/Next.js/Tailwind or generic starter UI. This deliberate choice is to make the visual identity genuinely different from the user's prior repositories.

## Verification record and remaining publication checks

The local browser verification exercised desktop Chromium and a 390px mobile Chromium viewport, confirmed no horizontal overflow, checked preview controls are disabled, inspected contribution details and captured [desktop](screenshots/covaunt-desktop-preview.png) and [mobile](screenshots/covaunt-mobile-preview.png) screenshots. These captures are real browser output from design preview, not an AI mockup and not live-chain evidence.

Before publication, still check 360px / 768px / 1280px widths, tab through every live-mode control, test wallet-return flow and transaction/hash feedback after redirect, and perform an accessibility review. Live RPC outages are already fail-closed in the renderer; testnet wallet behavior remains externally blocked until accounts and a host are supplied.
