# COVAUNT launch film — evidence and provenance

The film is a visual proof summary, not a replacement for the public journal. Every on-chain claim below is backed by a public explorer URL or a checked contract read. Interface material was captured from the public production application on 2026-11-14.

## Public source material

| Material | Source |
|---|---|
| Homepage and brand language | [covaunt.vercel.app](https://covaunt.vercel.app/) |
| Live Work & Trust register | [covaunt.vercel.app/work](https://covaunt.vercel.app/work) |
| Public evidence journal | [covaunt.vercel.app/journal](https://covaunt.vercel.app/journal) |
| Treasury route | [covaunt.vercel.app/treasury](https://covaunt.vercel.app/treasury) |
| Live vault | `vault.covauntops26.testnet` |
| Live Sputnik DAO | `covaunt26.sputnikv2.testnet` |
| Live Work contract | `covaunt-work.testnet` |
| Captured production screen and logo | `project/materials/web-covaunt-vercel-app/` and `project/assets/covaunt-mark.svg` |

## Vault proof points

- Authorized 9 NEAR healthcare settlement: [Gv7yUyZ24JkPSW4p12pM8cLG48e83ZkMkzagZAENioG1](https://explorer.testnet.near.org/transactions/Gv7yUyZ24JkPSW4p12pM8cLG48e83ZkMkzagZAENioG1).
- Unanimously approved but downstream-rejected 2 NEAR healthcare attempt: [BdP4EaxEdfGXda1k1LnCow5JJZBC5Z7k5rdBWGoskArw](https://explorer.testnet.near.org/transactions/BdP4EaxEdfGXda1k1LnCow5JJZBC5Z7k5rdBWGoskArw).
- Successful 0.1 NEAR donor refund: [DKJEShdGxtLai6xPdRC7JzJ8EwAggv4jqHkz2RLRzU7V](https://explorer.testnet.near.org/transactions/DKJEShdGxtLai6xPdRC7JzJ8EwAggv4jqHkz2RLRzU7V).
- Current read-only reconciliation before film delivery: 18.2 NEAR deposited, 9 NEAR paid, 0.1 NEAR refunded, 9.1 NEAR available, zero pending obligations, balanced ledger. See `docs/live-evidence/current-audit.json` and the public journal.

## Work & Trust proof points

- Deployment and initialization: [8t8EgAxLMAUx94sEMpiXAa2mpq4R2P1QN6cycjuxfeZF](https://explorer.testnet.near.org/transactions/8t8EgAxLMAUx94sEMpiXAa2mpq4R2P1QN6cycjuxfeZF).
- Small callback settlement: [ByKsvV1RqoZuEqXQJ5xaD1vANYmGbzhutNhVQ7fzfqVD](https://explorer.testnet.near.org/transactions/ByKsvV1RqoZuEqXQJ5xaD1vANYmGbzhutNhVQ7fzfqVD).
- Medium unauthorized approver rejection: [6porz54xLrizrXgiwxsCYUiNvt1F4mzdGoUthQrzUrz7](https://explorer.testnet.near.org/transactions/6porz54xLrizrXgiwxsCYUiNvt1F4mzdGoUthQrzUrz7).
- Medium authorized settlement: [ExcSSgyaofEEyYCVZmAawSHQjdTnFUSc4otUx2EqmEWm](https://explorer.testnet.near.org/transactions/ExcSSgyaofEEyYCVZmAawSHQjdTnFUSc4otUx2EqmEWm).
- Direct large-reward attempt rejected with `ERR_DAO_ONLY`: [AhgkNNSBpDkcsuf2tfRw5oEQcPtMiUQdwonTVRMidDWi](https://explorer.testnet.near.org/transactions/AhgkNNSBpDkcsuf2tfRw5oEQcPtMiUQdwonTVRMidDWi).
- Sputnik proposal 2 creation: [2xS5TM68Rs8MPKpG2UMWzQYXg39nbSbNZuGQ2ubc8oxX](https://explorer.testnet.near.org/transactions/2xS5TM68Rs8MPKpG2UMWzQYXg39nbSbNZuGQ2ubc8oxX).
- First council approval: [GNumfeci5gMZw2n4Kw4yonh2GoWzrp1RCtLgkYBHZ1oE](https://explorer.testnet.near.org/transactions/GNumfeci5gMZw2n4Kw4yonh2GoWzrp1RCtLgkYBHZ1oE).
- Second council approval plus downstream callback settlement: [DLyPnfXwWZ7An7XeeiTWYQTVLN68Sh5ey9rfWtgF22aK](https://explorer.testnet.near.org/transactions/DLyPnfXwWZ7An7XeeiTWYQTVLN68Sh5ey9rfWtgF22aK).
- Final Work read: task 2 `Settled`, payout 2 `Settled`, Work summary balanced, total budget 0.42 NEAR, total paid 0.0000003 NEAR, available 0.4199997 NEAR, zero pending obligations, worker points 85 with basis `callback_settled_reward_only`.

## Film source and reproducibility

1. Enter `marketing/covaunt-launch-film/huashu-motion-src`.
2. Run `node .\\cli\\om.js doctor`.
3. Run `node .\\cli\\om.js check ..\\project` and confirm `0 errors, 0 warnings`.
4. Run `node .\\cli\\om.js sound ..\\project` to regenerate `project/assets/sound.wav`.
5. Run `node .\\cli\\om.js render ..\\project --format mp4 --fps 30 --workers 4 --video seek`.
6. Run `node .\\cli\\om.js qa ..\\project\\out\\COVAUNT_LAUNCH_FILM_FINAL.mp4 --sheet 4`.

The final Windows master uses the standard seek renderer after the motion and
frame review pass. A motion-blur retry was tested separately but was not used
for the delivered file.

## Delivered media integrity

- Master: `output/COVAUNT_LAUNCH_FILM_FINAL.mp4`
- SHA-256: `DE7829B390004A4278D7E694C6F5C5CA7A753E6430C099D806732144E8401503`
- Container streams: H.264 1920x1080 at 30 fps; AAC 48 kHz stereo
- Runtime: 84.000 seconds
- Cover: `output/COVAUNT_LAUNCH_COVER.png`
- The master was played back and representative frames, the opening, the
  consent proof, the blocked diversion and the final brand hold were inspected.

The project is intentionally separate from the Next.js build. The external huashu-motion source clone and captured materials are local production inputs; the small editable composition, source manifest, fonts and logo are the distributable film source.

## Limitations shown honestly

- The film is testnet evidence, not a production-security or independent-audit claim.
- The original vault retains a FullAccess upgrade key; COVAUNT does not call the deployed vault immutable.
- A named-account Work verifier is an on-chain attestation; it is not independent proof of real-world work.
- The browser wallet attempt used the live chooser, but this Chrome profile had no Meteor Wallet account, so no new wallet-signed browser transaction is claimed by this film.
