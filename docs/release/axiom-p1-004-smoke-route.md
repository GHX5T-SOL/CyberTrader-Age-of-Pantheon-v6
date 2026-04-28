# axiom-p1-004 - Automated Player Smoke Route

Status: Complete
Owner: Axiom
Date: 2026-04-28

## Scope

`axiom-p1-004` adds a CI-friendly smoke path for the player-critical web route:

- intro skip
- local handle login
- tutorial completion
- terminal entry
- buy execution
- market tick
- sell execution
- inventory route check
- settings/local-mode disclosure check

The new `npm run qa:smoke` command builds the Expo web export and runs only the focused `axiom-p1-004` Playwright path inside `qa/axiom-web-regression.spec.ts`.

## Acceptance Evidence

- The route starts from `/intro`, not a pre-authenticated shortcut.
- The test asserts no browser console errors or page errors across the full route.
- The buy/sell cycle confirms a held `VBLM` position after buy and a closed/open-position-safe state after sell.
- Inventory and Settings are loaded after the trade cycle to catch route hydration regressions.
- Settings verifies `SUPABASE AUTHORITY: OFF` and `LOCAL LOOP ACTIVE` so store-review-safe local-mode copy remains visible.
- The app shell diagnostic selector now subscribes to stable primitive store fields so runtime diagnostics do not trigger React's maximum-update-depth guard during intro smoke.

## Validation

- `npm run qa:smoke` - passed, 1/1 Chromium smoke test.
- `npm run ship:check` - passed: safety preflight, TypeScript, 123/123 Jest tests in 28 suites, and Expo web export.
