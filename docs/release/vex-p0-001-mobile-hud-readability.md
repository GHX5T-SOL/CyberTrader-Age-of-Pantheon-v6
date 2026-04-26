# vex-p0-001 - Mobile HUD Readability

Owner: Vex
Date: 2026-04-26

## Scope

This pass completes the first focused mobile HUD readability and one-hand ergonomics polish for Gate A. It follows the Superdesign baseline and two constrained HUD branches created for the active `home` and `terminal` routes.

Superdesign references:

- Project: `CyberTrader v6 HUD readability pass`
- Baseline draft: `b91811ab-de45-4dd5-a27f-cf7bce08671b`
- Branch drafts: `6f18c62a-b34a-426e-8c2c-89f091d711c7`, `4034312d-d827-4ca5-8a3d-4fae56a93713`

## Implementation

- Home header text now reserves space for the hamburger trigger and scales on narrow phones.
- Home metrics prioritize Energy, Heat, and 0BOL before secondary market/rank telemetry.
- `MetricChip` scales labels/values, keeps stable card heights, and avoids clipping important telemetry.
- `CommodityRow` uses wider touch rows, smaller fixed columns, and scalable price/change text for small phones.
- `ActionButton` adds hit slop and scales long command labels within the existing 52 px command target.
- `FirstSessionCue` has a stronger step marker and safer title wrapping while keeping diegetic copy.
- Terminal now surfaces a compact Energy/Heat/Owned/0BOL telemetry strip near the trade ticket.
- Terminal BUY/SELL segmented controls, quantity input, and percentage presets are larger and more thumb-safe.
- Ticket summary rows now right-align and scale cost, Heat, and Energy values instead of relying on a single unclamped line.

## Acceptance

- Primary metrics are readable on small phones: Energy, Heat, 0BOL, selected ticker, owned quantity, and trade costs have scaling or compact formatting.
- Touch targets meet mobile guidelines for the main command path: command buttons stay 52 px, BUY/SELL controls are 52 px, preset controls are 44 px, and quick links are 44 px.
- Important text avoids clipping through reserved header space, shorter fixed market row columns, explicit text scaling, or two-line summary wrapping.

## Validation

- `npm run typecheck`
- `npm test -- --runInBand`
- `npx expo export --platform web`

Full Gate A validation still belongs to `vex-p0-002` and `axiom-p0-001`: responsive viewport captures, production web smoke, iOS simulator smoke, and Android emulator smoke.
