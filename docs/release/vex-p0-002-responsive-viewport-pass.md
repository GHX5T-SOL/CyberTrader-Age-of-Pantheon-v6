# vex-p0-002 - Responsive Viewport Pass

Owner: Vex
Date: 2026-04-26

## Scope

This pass completes the first responsive viewport validation for the active Gate A surfaces: `/home` and `/terminal`. It builds on `vex-p0-001` HUD readability work and verifies that the first trade path stays usable across web desktop, small phone, large phone, and tablet portrait widths.

Superdesign references:

- Project: `CyberTrader v6 responsive viewport pass`
- Project URL: `https://app.superdesign.dev/teams/cbf9e40e-5180-4061-94e7-aa2571efe072/projects/cda405ac-bfe3-40dc-bb26-b80867a8999c`
- Current terminal reproduction draft: `1cfa9101-1369-4cb8-8f42-1e48e45b0d87`
- Preview URL: `https://p.superdesign.dev/draft/1cfa9101-1369-4cb8-8f42-1e48e45b0d87`

## Implementation

- Added `npm run qa:responsive`, backed by `qa/responsive-captures.spec.ts`; the command now builds the exported web shell before starting Playwright so a clean checkout does not depend on a pre-existing `dist/`.
- Added Playwright as a pinned dev dependency for repeatable web viewport QA.
- Set the exported web document, body, and root backgrounds to the terminal background and clear the default body margin so wide desktop captures do not expose browser chrome whitespace around the app shell.
- The responsive spec serves the exported `dist/` build locally, enters a fresh local demo session, completes tutorial setup, and checks `/home` then `/terminal`.
- The spec captures both surfaces at four viewport profiles: small phone `375 x 667`, large phone `430 x 932`, tablet portrait `834 x 1112`, and web desktop `1440 x 900`.
- The default capture output is ignored `test-results/`; the release evidence for this pass is committed in `docs/release/vex-p0-002-responsive-captures/`.

## Acceptance

- Four viewport captures are checked: small phone, large phone, tablet portrait, and web desktop.
- `/home` has no horizontal page overflow and keeps `[ ENTER S1LKROAD 4.0 ]` visible after the first-session setup.
- `/terminal` has no horizontal page overflow and keeps `S1LKROAD 4.0`, `[ EXECUTE ]`, and `[ WAIT MARKET TICK ]` visible.
- Browser console errors and page errors fail the responsive check.
- Navigation remains usable from `/home` to `/terminal` in every viewport.

## Capture Evidence

- `docs/release/vex-p0-002-responsive-captures/small-phone-home.jpg`
- `docs/release/vex-p0-002-responsive-captures/small-phone-terminal.jpg`
- `docs/release/vex-p0-002-responsive-captures/large-phone-home.jpg`
- `docs/release/vex-p0-002-responsive-captures/large-phone-terminal.jpg`
- `docs/release/vex-p0-002-responsive-captures/tablet-home.jpg`
- `docs/release/vex-p0-002-responsive-captures/tablet-terminal.jpg`
- `docs/release/vex-p0-002-responsive-captures/web-home.jpg`
- `docs/release/vex-p0-002-responsive-captures/web-terminal.jpg`

## Validation

- `CYBERTRADER_RESPONSIVE_CAPTURE_DIR=docs/release/vex-p0-002-responsive-captures npm run qa:responsive`
- `npm run typecheck`
- `npm test -- --runInBand`
- `npm run build:web`

Current local results:

- TypeScript passes.
- Jest passes: 59 tests in 20 suites.
- Expo web export passes through the responsive QA command.
- Responsive QA passes: 4 Playwright viewport tests.

Known unchanged blocker:

- `npm audit --omit=dev --audit-level=high` still reports the existing Expo toolchain transitive advisories and proposes a breaking Expo change through `npm audit fix --force`. No forced dependency remediation was attempted in this UI QA pass.

Native iOS and Android viewport validation remains part of `axiom-p0-001`; this pass only proves exported web responsiveness and navigability.
