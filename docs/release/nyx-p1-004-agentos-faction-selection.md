# nyx-p1-004 - AgentOS Faction Selection

Date: 2026-04-29
Owner: Nyx
Status: Shipped

## Summary

AgentOS faction choice is now an executable player-facing loop instead of a
read-only preview. Once a player reaches rank 5, completes one profitable sell,
and keeps Heat at 70 or lower, `/menu/progression` lets them queue and commit an
alignment with Free Splinters, Blackwake, Null Crown, or Archivists.

The first alignment is persisted in the LocalAuthority profile and demo session.
One later free switch is allowed by the deterministic `FactionChoice` contract;
after that, future switches remain reserved for PantheonOS authority.

## Changes

- `/menu/progression` now renders a SuperDesign-backed faction alignment matrix
  with selectable rows, queued/current state, mission bias, reward modifier, and
  Heat posture.
- `state/demo-store.ts` persists `factionChoice`, exposes `chooseFaction`, and
  enforces the AgentOS gate plus one-free-switch rule before committing.
- `LocalAuthority.chooseFaction` persists the profile faction and promotes the
  local OS tier to `AGENT` for rank-5 players.
- Mission generation now biases future mission type, aligned contact, and reward
  modifier from the selected faction.
- `.superdesign/design-system.md` records the AgentOS SuperDesign project and
  implementation rules.

## SuperDesign

- Project: `https://app.superdesign.dev/teams/cbf9e40e-5180-4061-94e7-aa2571efe072/projects/c7661221-672f-4dc2-8105-5bf1f5af6134`
- Current-state draft: `https://p.superdesign.dev/draft/4bf074bd-0055-40ac-9c27-cd3dceae2642`
- AgentOS branch draft: `https://p.superdesign.dev/draft/476f9ac2-d2eb-426f-8491-b7088513c103`
- Codex automation refresh: `https://app.superdesign.dev/teams/cbf9e40e-5180-4061-94e7-aa2571efe072/projects/841b8d96-38bd-4372-a22b-f6452ec3d55e`
- Refresh branch draft: `https://p.superdesign.dev/draft/7ec5931e-1283-4235-9256-c1537d024b91`

## Validation

- `npm test -- --runInBand engine/__tests__/factions.test.ts engine/__tests__/mission-generator.test.ts authority/__tests__/local-authority.test.ts`
- `npm run typecheck`
- `npm run ship:check` (safety scan, typecheck, 165/165 Jest tests in 34 suites, Expo web export)
- `npm run qa:axiom` (11/11 Chromium checks, including `/missions`, `/menu/progression`, smoke route, and live Vercel shell)
- `npm run perf:budgets`
