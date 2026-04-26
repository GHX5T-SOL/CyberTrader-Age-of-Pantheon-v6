# zoro-p0-001 - First 10-Minute Journey Creative Pass

Date: 2026-04-26
Owner: Zoro

## Scope

This note completes `zoro-p0-001` from the Dev Lab App Store readiness task map: creative review of the v6 first 10-minute journey from intro through the first profitable sell.

Runtime code was not changed in this pass. The pass added SuperDesign context for the active Expo Router UI and created design artifacts for the current journey plus two branch directions.

While this pass was in progress, `nyx-p0-001` landed on `main` as `cff13cb` and added the first-session objective cue plus manual market tick action. This Zoro pass reviews the current head including that Nyx work.

## SuperDesign Artifacts

- Project: https://app.superdesign.dev/teams/cbf9e40e-5180-4061-94e7-aa2571efe072/projects/a3ec6036-9a47-4ba9-8c4f-78b16cae8c30
- Current-state draft: https://p.superdesign.dev/draft/a763db33-5af0-424c-a6b0-5400d375d99e
- Identity refinement branch: https://p.superdesign.dev/draft/f966902c-c838-4e03-841e-44e0ccd0f4ae
- First-session optimization branch: https://p.superdesign.dev/draft/fb21abb5-d17d-41eb-b061-3b5b72e90b3a

## Current Journey Reviewed

- `app/index.tsx`: hydration redirect into the current phase route.
- `app/video-intro.tsx` and `app/intro.tsx`: cinematic/text lore entry.
- `app/login.tsx`: local handle claim, no wallet requirement, AG3NT_0S status lines.
- `app/boot.tsx`: boot log and static handoff into the deck.
- `app/tutorial.tsx`: modal tutorial sequence.
- `app/home.tsx`: deck dashboard, metrics, market entry, missions, challenges, location, and live world state.
- `app/terminal.tsx`: S1LKROAD 4.0 market list, chart, ticket, buy/sell confirmation, manual tick, positions, and news.

Supporting source context:

- `theme/terminal.ts`
- `components/terminal-shell.tsx`
- `components/action-button.tsx`
- `components/neon-border.tsx`
- `components/metric-chip.tsx`
- `components/commodity-row.tsx`
- `components/first-session-cue.tsx`
- `state/demo-routes.ts`
- `engine/demo-market.ts`

## Zoro Decision

The first 10-minute tone is approved for Gate A with follow-up polish. The journey already has a distinct identity: illegal Eidolon shard, pirated cyberdeck, LocalAuthority/no-wallet launch safety, boot-sequence ritual, and S1LKROAD terminal trading.

The current experience is acceptable as a reliable-demo target, but not yet store-capture ready. The `nyx-p0-001` cue now handles the strongest first-session weakness: buy, wait, sell, and profit are explicit without leaving the cyberdeck voice. The strongest next direction remains the first-session optimization branch, now focused on readability, screenshot staging, and making the cue feel fully integrated rather than newly attached.

## Strong Beats To Preserve

- `Pantheon became sentient` and the Eidolon shard premise create a clean hook before any trading UI appears.
- Login avoids wallet friction and says `Local demo login. No wallet required`, which supports store-safe first launch.
- The ASCII mark, AG3NT_0S status lines, boot log, scanlines, and bracketed commands establish the cyberdeck language before `/home`.
- S1LKROAD 4.0 is visually and verbally stronger than a generic market dashboard.
- The routed terminal has the right playable ingredients: selected ticker, chart, quantity, buy/sell tabs, Heat delta, Energy cost, confirmation, positions, news, and trade feedback.
- `VBLM` is already the starter ticker in engine state and remains the right low-heat first move.
- `FirstSessionCue` now gives the route a persistent objective spine: enter S1LKROAD, buy starter signal, wait for green tape, and bank first profit.
- `WAIT MARKET TICK` removes a weak passive-wait moment from the first guided loop.

## Weak Beats

- After tutorial completion, `/home` still presents many live systems at once. Missions, daily challenges, streaks, flash events, travel, rank, 0BOL, and five commodities compete with the first-trade objective even though the cue now helps.
- `VBLM` is framed as the starter signal inside the cue, but on `/home` it is still only the fifth visible commodity row.
- The standalone tutorial teaches concepts in all caps, while the new cue carries the live objective. Vex should make those two voices feel intentionally connected.
- The cue copy is operationally clear, but it should get a Vex readability pass so it feels native to the HUD rather than a bordered add-on.
- Store-capture art direction is not locked. Current terminal screens are usable, but screenshot scenes need staged player state, cleaner hierarchy, and approved visual assets.

## Assigned Follow-Ups

| Owner | Task | Assignment |
| --- | --- | --- |
| Nyx | `nyx-p0-001` | Completed in `cff13cb`: first-session cue, manual market tick, cue tests, and LocalAuthority profitable-loop proof. |
| Vex | `vex-p0-001` and `vex-p0-002` | Refine cue placement, hierarchy, and small-phone readability so the objective rail feels native to the HUD. |
| Rune | `axiom-p1-004` support | Expose a repeatable smoke path once Axiom defines the automated route; keep route recovery and state reset compatible with first-session replay. |
| Palette | `palette-p0-001` and `palette-p1-003` | Audit commodity/UI assets for screenshot safety and create staged store-capture states for market, terminal, inventory, and profile. |
| Reel | `reel-p0-001` | Use the identity refinement branch as the capture/storyboard reference for the 30-second App Store preview. |
| Axiom | `axiom-p0-001` | Execute Web/iOS/Android QA against the approved first-session path and file blockers when the first profitable sell cannot be reached without guidance. |

## Gate-A Creative Bar

For Gate A, the first-session path passes creative review only when:

- A fresh player sees the illegal Eidolon premise before trading.
- The player can claim a local handle without wallet anxiety.
- The boot sequence creates a clear transition into AG3NT_0S.
- The first live objective is always visible until a profitable sell closes.
- `VBLM` or another low-heat starter asset is visually recommended without breaking immersion.
- Buy, wait, sell, profit, Heat, Energy, and 0BOL state changes are legible on a small phone.
- No screen in the critical path reads like a generic financial dashboard.

## Validation

- SuperDesign project and drafts were created on 2026-04-26.
- `.superdesign/design-system.md` and `.superdesign/init/*` now document the active v6 UI context.
- Documentation-only pass; no runtime code was changed.
