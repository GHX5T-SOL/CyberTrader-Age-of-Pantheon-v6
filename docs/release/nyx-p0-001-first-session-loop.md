# nyx-p0-001 - First-Session Loop Map

Date: 2026-04-26
Owner: Nyx
Status: complete

## Scope

`nyx-p0-001` maps and tightens the first-session path from intro to the first profitable sell. The pass targets the live Expo routes, not the older archived first-playable screen components.

## Critical Path

1. Player reaches local handle/login and boots the deck.
2. Home route displays the next objective: enter S1LKROAD.
3. Terminal route locks the low-heat starter signal, `VBLM`.
4. Player buys the default starter lot.
5. Player uses `WAIT MARKET TICK` until unrealized PnL turns green.
6. Player switches to sell and closes the same lot.
7. First profit marks the loop complete and the cue moves into ongoing Heat/rank guidance.

## Changes

- Added `FirstSessionCue` to the live home and terminal routes.
- Added a manual `WAIT MARKET TICK` terminal action so QA and first-session players do not have to wait for the passive clock.
- Added pure cue-copy tests for every tutorial state.
- Added a deterministic LocalAuthority first-session test proving `VBLM` can close profitably within the guided tick window.
- Created Superdesign baselines for the current live first-session UI:
  - Project: https://app.superdesign.dev/teams/cbf9e40e-5180-4061-94e7-aa2571efe072/projects/b0bc3735-64e2-46ed-8f4c-0804ffe81990
  - Live-route draft: https://p.superdesign.dev/draft/7cf4e7c6-1d9e-48b0-897b-212eb0c1bae8

## Acceptance Evidence

- Critical path is documented in this note.
- The route now presents explicit next-step guidance on home and terminal.
- The manual tick action removes the passive-clock wait from the first loop.
- Jest covers cue state transitions and the starter profitable sell path.

## Follow-Ups

- Vex should evaluate cue readability during the mobile HUD/responsive pass.
- Axiom should include the manual tick path in the Web/iOS/Android smoke run.
