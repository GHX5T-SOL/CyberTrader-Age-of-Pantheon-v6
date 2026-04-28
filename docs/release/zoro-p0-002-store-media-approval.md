# zoro-p0-002 - Store Media Direction Approval

Date: 2026-04-29
Owner: Zoro

## Scope

This note completes `zoro-p0-002` from the Dev Lab App Store readiness task map: approve the current App Store screenshot shot list, preview story direction, and store-page mood for autonomous iteration.

This is not a final store-submission package. It is the creative lock that lets Reel, Palette, Zara, and Zyra keep generating screenshots and preview-video cuts without waiting for human taste approval. Account-owner credentials, final legal declarations, public privacy policy publication, native store screenshots, and final App Store / Play Store submission remain separate Gate C items.

Runtime code was not changed. The existing screenshot capture command was rerun so the approved PNGs and `assets/provenance.json` match the current app output.

## SuperDesign And Source Inputs

- Design system: `.superdesign/design-system.md`
- Init context: `.superdesign/init/components.md`, `.superdesign/init/layouts.md`, `.superdesign/init/routes.md`, `.superdesign/init/theme.md`, `.superdesign/init/pages.md`, and `.superdesign/init/extractable-components.md`
- Screenshot preset draft: `https://p.superdesign.dev/draft/b11d6241-7779-4b80-bffb-846467843d92`
- Reel preview storyboard: `docs/release/reel-p0-001-app-store-preview-storyboard.md`
- Palette screenshot presets: `docs/release/palette-p1-003-screenshot-presets.md`
- Asset provenance inventory: `assets/provenance.json`

## Approved Screenshot Set

The current portrait capture set is approved as the Gate C direction and shot list:

| Shot | File | Approved role |
| --- | --- | --- |
| Home deck | `assets/screenshots/screenshot-home-idle.png` | Establishes `AG3NT_0S//pIRAT3`, Neon Plaza, Energy, Heat, 0BOL, rank, and live challenge pressure. |
| Terminal ready | `assets/screenshots/screenshot-terminal-ready.png` | Shows S1LKROAD, starter `VBLM` guidance, Energy/Heat/0BOL telemetry, and the market list. |
| Market overview | `assets/screenshots/screenshot-market-overview.png` | Confirms `/market` resolves into the same playable terminal market surface. |
| Mission contacts | `assets/screenshots/screenshot-missions-list.png` | Shows AgentOS contract-gate progress, faction-flavored contacts, reputation, locked ranks, and archive state. |
| Inventory | `assets/screenshots/screenshot-inventory-overview.png` | Shows storage and courier limits without personal data or wallet details. |
| Profile | `assets/screenshots/screenshot-profile-overview.png` | Shows local cyberdeck identity, Pirate OS tier, rank, faction, and fictional 0BOL state. |

Local verification confirms all six PNGs are `1242 x 2688`, matching the current portrait capture process from `npm run capture:screenshots`.

## Preview Story Direction

The Reel beat sheet is approved as the store-preview spine:

1. Open on the Eidolon/Pantheon premise.
2. Show local handle claim with no wallet requirement.
3. Cut through AG3NT_0S boot handoff.
4. Reach home deck and S1LKROAD within the first 10 seconds.
5. Demonstrate real `VBLM` buy, wait-tick, and sell/profit gameplay.
6. Close on missions, rank/profile, and cyberdeck identity rather than install or earnings claims.

The mood target is a portrait-first cyberdeck game, not a finance dashboard. Captions and overlays should stay diegetic, short, and store-safe.

## Approval Criteria

- The screenshot shot list is locked around real app routes, not mockups.
- The preview story reaches playable trading quickly and keeps real app UI as the dominant footage.
- The store-page mood preserves the illegal Eidolon shard, PirateOS, S1LKROAD, Heat, Energy, 0BOL, and faction-progress identity.
- The first-session `VBLM` loop remains understandable with audio muted.
- LocalAuthority/no-wallet posture remains visible without over-explaining backend architecture.
- No capture uses real-money, wallet, investment, cash-out, yield, prize, or regulated-market claims.
- Screenshot files contain staged local data only; no debug UI, secrets, personal handles, or placeholder 1x1 images are present.

## Remaining Gate C Work

- Generate and validate the final 15-30 second App Store preview video cut.
- Produce native-device screenshot evidence once the native QA host is available.
- Publish or configure the public privacy policy URL.
- Finalize App Privacy, Data Safety, age-rating, support URL, and account-owner declarations.
- Keep `assets/provenance.json` green and resolve final source-rights/account-owner declarations before actual submission.

## Validation

- Read SuperDesign init and design-system context before this pass.
- Verified screenshot dimensions with `sips -g pixelWidth -g pixelHeight`.
- Reviewed all six committed screenshot PNGs directly.
- Reviewed Reel and Palette release notes plus the current provenance inventory.
- Reran `npm run capture:screenshots`; all six PNGs were regenerated at `1242 x 2688`.
- Reran `npm run provenance:assets`; `npm run provenance:assets:check` confirms `assets/provenance.json` is current with 39 assets.
- Documentation/design-context and capture-refresh pass only; no runtime code changed.
