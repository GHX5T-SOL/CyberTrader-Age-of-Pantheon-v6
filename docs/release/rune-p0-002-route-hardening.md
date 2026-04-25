# rune-p0-002 - Route Hardening

Date: 2026-04-26
Owner: Rune

## Scope

Hardened Expo Router recovery for player-facing routes so deep links and empty back stacks do not leave players in dead-end screens.

## Route Rules

- `/` now uses the shared phase-to-route mapper.
- Intro phase starts at `/video-intro` unless the intro is already seen, then resumes at `/login`.
- Boot phase resumes at `/boot`.
- Home phase resumes at `/home`.
- Terminal phase resumes at `/terminal`.
- Protected player routes redirect after hydration when no local player exists:
  - setup or intro state returns to the appropriate intro/login route.
  - boot state returns to `/boot`.
  - malformed home/terminal state without a player returns to `/login`.
- Menu screens use stack back when possible and otherwise replace to a known fallback, normally `/home`.
- Android hardware back on menu screens uses the same fallback logic instead of exiting from an empty stack.
- Android hardware back from the trading terminal returns to `/home` and synchronizes the local phase state.
- Protected-route recovery renders a terminal-style recovery screen instead of a blank frame while hydration or redirect completes.

## Validation

- Added unit coverage for phase entry routes, protected deep-link recovery, hydration waiting, and menu back fallback targets.
- Relevant checks for this change: typecheck, Jest, Expo web export.
