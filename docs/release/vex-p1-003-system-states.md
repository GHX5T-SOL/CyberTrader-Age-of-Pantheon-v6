# vex-p1-003 - Diegetic System States

Owner: Vex
Date: 2026-04-26

## Scope

This pass adds App Store-safe loading, empty, offline, and error states to the active routed Expo app. It builds on the Vex P0 HUD and responsive passes without changing the core trading loop.

SuperDesign references:

- Project: `CyberTrader v6 responsive viewport pass`
- State-system draft: `a8801f62-1aae-42ed-8704-a78044beae08`
- Preview URL: `https://p.superdesign.dev/draft/a8801f62-1aae-42ed-8704-a78044beae08`

## Implementation

- Added `components/system-state-panel.tsx` as the shared terminal-state component for `loading`, `empty`, `offline`, and `error` variants.
- Replaced route recovery text with a loading panel so guarded routes show diegetic hydration progress instead of bare copy.
- Added player-safe error treatment to the login handle validation path.
- Added explicit offline/locked panels for terminal travel and market-lock states.
- Replaced empty open-position, quiet news, and empty notification copy with compact empty-state panels.
- Added an offline/local-loop disclosure to Settings so players can see that LocalAuthority mode is intentional and wallet-free.
- Replaced raw exception echoing in store catch paths with contextual safe system messages.

## Acceptance

- No raw backend or exception messages are intentionally surfaced through `systemMessage` catch paths.
- Offline/local mode is visible in Settings, and terminal lock states explain why trading is unavailable.
- Empty positions, empty news, and empty notifications give player-facing next actions.
- Loading route recovery stays inside the terminal visual system.

## Validation

- `npm run typecheck`
- `npm test -- --runInBand`
- `npx expo export --platform web`

Native iOS and Android smoke remain part of `axiom-p0-001`.
