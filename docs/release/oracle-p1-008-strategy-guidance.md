# oracle-p1-008 - Tuned Strategy Guidance

Date: 2026-04-29

## Summary

This pass applies the `oracle-p0-006` beta tuning output to player-facing guidance. The first-session route now names the tuned `VBLM x15` starter path, redirects first-run ticker detours back to `VBLM`, and exposes `PGAS` / `ORRS` / `SNPS` as the post-profit upgrade lane.

## Player-Facing Changes

- Added `engine/strategy-guidance.ts` as the shared source for tuned strategy lanes, starter quantity, Heat stop-line copy, NPC hint scaffolding, and per-ticker guidance.
- Updated `FirstSessionCue` on `/home` and `/terminal` to include live Heat-aware copy:
  - before first profit: `VBLM x15`, wait green, sell same lot;
  - detour state: steer non-`VBLM` first-session selections back to `VBLM`;
  - after first profit: safe cycle, momentum upgrade, or contraband caution based on the selected ticker and Heat.
- Aligned the default starter order quantity to 15 while keeping Energy cost scaling anchored to the previous 10-unit baseline.
- Added concise strategy hints to mission contacts so NPCs reinforce the starter, momentum, safe-cycle, and contraband lanes.
- Updated the Help terminal with the same starter and upgrade-lane language.

## SuperDesign Evidence

SuperDesign project: `CyberTrader v6 Strategy Guidance Pass`

- Baseline reproduction draft: `d225bdf9-46fc-47f7-81c5-38e628c3d79e`
- Implemented Oracle strategy integration branch: `b82e9ab7-f20a-476f-8f8a-351ab27e5f31`
- Project URL: `https://app.superdesign.dev/teams/cbf9e40e-5180-4061-94e7-aa2571efe072/projects/d04527d4-2764-4fad-991a-dfdc48650d31`
- Supplemental Codex automation project: `https://app.superdesign.dev/teams/cbf9e40e-5180-4061-94e7-aa2571efe072/projects/09f65e9b-27ae-4f49-842a-dbf4947ca041`
- Supplemental reproduction/branch drafts: `f5fd069a-b0b6-4da2-b018-5b3a2c2ae1fc`, `a4ac5fda-68ad-4cfa-a1a3-21c0ba4bbd26`, `606a6e96-0aba-4084-85d2-02c9d88828d6`

## Validation

- `npm test -- --runInBand engine/__tests__/strategy-guidance.test.ts components/__tests__/first-session-cue.test.ts authority/__tests__/first-session-loop.test.ts`
- `npm run typecheck`
- `npm run ship:check` - passed safety scan, typecheck, 155/155 Jest tests in 33 suites, and Expo web export.
- `npm run qa:smoke` - passed the intro/login/buy/sell/inventory/settings Chromium route.
- `npm run build:web -- --clear` - rebuilt Expo web export from an empty bundler cache.
