# zoro-p1-003 - Commodity, Faction, and OS Art Direction

Date: 2026-04-29
Owner: Zoro

## Status

Complete. This pass locks an implementation-aware direction for launch commodity presentation, AgentOS faction identity, and PirateOS / AgentOS / PantheonOS hierarchy without changing the routed UI in this commit.

## SuperDesign

- Project: https://app.superdesign.dev/teams/cbf9e40e-5180-4061-94e7-aa2571efe072/projects/308e7657-6d74-4aea-8e7f-b51f83ccc854
- Current-state board: https://p.superdesign.dev/draft/7a48e6d9-37d3-445c-ba85-e2c40081cd98
- Asset-direction branch: https://p.superdesign.dev/draft/a9ccd626-2899-4324-98b3-062300ecee9e
- OS/faction hierarchy branch: https://p.superdesign.dev/draft/218326c6-0622-4fcd-a294-c51baf6686e9

## Shipped

- Added `data/presentation-direction.ts` as the typed art-direction contract for:
  - all 11 launch commodities,
  - all 4 AgentOS launch factions,
  - PirateOS, AgentOS, and PantheonOS hierarchy,
  - follow-up asset requests for Palette, Vex, and Reel.
- Added `data/__tests__/presentation-direction.test.ts` to keep every commodity and faction covered, prevent untracked palette names, preserve store-safe fictional copy, and prove the SuperDesign draft references are recorded.
- Updated `.superdesign/design-system.md` with the Zoro P1 direction so later UI and asset work inherits the same lane/hierarchy constraints.

## Direction

Commodity lanes:

- Starter/stabilizer: `VBLM` owns the first clean 0BOL profit route and stays green.
- Safe-cycle: `MTRX` and `NGLS` support low-Heat play without competing with `VBLM`.
- Upgrade/signal: `PGAS`, `ORRS`, `SNPS`, and `GLCH` are the post-profit signal lane.
- Contraband/anomaly: `FDST`, `HXMD`, `AETH`, and `BLCK` reserve red and sharp silhouettes for visible Heat risk.

Faction hierarchy:

- Free Splinters read as green safehouse recovery.
- Blackwake reads as amber timed cargo.
- Null Crown reads as red blind-spot discipline, but red stays on rails and warnings rather than full panel fills.
- Archivists read as cyan archive/index intelligence.

OS hierarchy:

- PirateOS is raw local market access and first-session learning.
- AgentOS adds faction sigils, route-pressure strips, and reputation labels.
- PantheonOS remains a locked late-game promise until the territory/shard-memory shell is playable.

## Filed Follow-Ups

- `palette-p1-006-commodity-lane-silhouettes`: commodity icon polish by lane.
- `palette-p1-007-agentos-faction-sigils`: compact faction sigils for rows and dossiers.
- `vex-p1-008-os-tier-hierarchy-rails`: OS-tier hierarchy treatment in progression/profile surfaces.
- `reel-p1-004-preview-asset-beat-list`: preview-video beat mapping to approved asset lanes.

## Validation

- `npm test -- data/__tests__/presentation-direction.test.ts --runInBand` passed.
- `npm run typecheck` passed.
- `npm run ship:check` passed with safety scan, typecheck, Jest, and Expo web export.

No wallet, real-money, cash-out, investment, yield, staking, prize, or regulated-market claims were added.
