# nyx-p1-007 / vex-p1-007 - Operator Brief Retention Patch

Date: 2026-04-29

## Status

Complete. This patch applies the `hydra-p1-003` retention handoff to the active first-session surfaces by targeting the top two weighted churn triggers: `action-fatigue` and `heat-anxiety`.

## Why

Hydra ranked `action-fatigue` at 45 weighted player slots and `heat-anxiety` at 30. The recommended first patch was not economy tuning; it was a short-session progress summary, a single next-best-action beat, and clearer Heat posture before changing constants.

## Shipped

- Added `components/operator-brief.tsx`, a reusable in-world session brief for `/home` and `/terminal`.
- The brief shows:
  - first-profit progress,
  - Heat signal and five-step ladder,
  - one next action such as `[ ENTER S1LKROAD 4.0 ]`, `[ EXECUTE VBLM BUY ]`, `[ WAIT MARKET TICK ]`, `[ SELL VBLM GREEN ]`, or `[ COOL HEAT BEFORE SCALE ]`.
- `/home` wires the brief into terminal entry or Black Market Heat cooling when available.
- `/terminal` wires the brief to starter selection, starter buy confirmation, wait tick, sell setup, or post-profit upgrade lane selection.
- Copy stays store-safe and fictional: no wallet, investment, yield, prize, cash-out, or real-market claims.

## SuperDesign

- Project: `https://app.superdesign.dev/teams/cbf9e40e-5180-4061-94e7-aa2571efe072/projects/255cf760-e4f3-41d7-90f2-06117db7ef53`
- Current-state draft: `https://p.superdesign.dev/draft/7b1f42ab-4fb2-4990-b57f-b013547d0d04`
- Retention brief branch: `https://p.superdesign.dev/draft/b8a633d7-af72-4b28-9014-c79479458b4b`
- Codex verification project: `https://app.superdesign.dev/teams/cbf9e40e-5180-4061-94e7-aa2571efe072/projects/65e7e37a-aaa0-4761-b9a0-d6a9e18da96f`
- Codex current-state draft: `https://p.superdesign.dev/draft/636b2de3-ee26-4e66-8120-63faa8acdcd4`
- Codex command-rail branch: `https://p.superdesign.dev/draft/a95ef215-8df3-4d0f-be63-73e49582032c`

## Validation

- `npm test -- components/__tests__/operator-brief.test.ts --runInBand` passed: 6/6.
- `npm run typecheck` passed.
- `npm run ship:check` passed: safety scan, typecheck, 194/194 Jest tests in 39 suites, and Expo web export.
- `npm run qa:smoke` passed: 1/1 Chromium smoke.
- `npm run qa:responsive` passed: 4/4 Chromium viewport checks.
- `npm run capture:screenshots` passed and refreshed the six store screenshot presets.
- `npm run provenance:assets:check` passed with 39 tracked assets.
- `npm run build:web -- --clear` passed after clearing the Metro export cache.
