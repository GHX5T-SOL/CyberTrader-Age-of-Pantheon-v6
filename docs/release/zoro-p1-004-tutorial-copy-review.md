# zoro-p1-004 Tutorial Copy Review

Date: 2026-04-29  
Owner: Zoro / Codex automation

## Summary

The first-session tutorial and help copy now read as direct cyberdeck operating instructions instead of generic onboarding exposition.

## Changes

- Moved the routed tutorial script into `data/tutorial-copy.ts` so the copy has focused regression coverage.
- Rewrote the eight tutorial steps around the current tuned player route: local fictional deck, `VBLM x15`, wait for green tape, sell the same lot, keep Heat controlled, then graduate into the first upgrade lane.
- Tightened the Oracle first-session cue copy so detours steer back to `VBLM`, red positions use `WAIT MARKET TICK`, and green positions tell the player exactly when to switch to SELL.
- Updated Help Terminal copy to clarify local-mode play, Energy, Heat, first-trade steps, upgrade cargo, and the disabled-by-default token boundary.

## SuperDesign Context

This was a copy-only pass using the existing SuperDesign init files and `.superdesign/design-system.md` first-session constraints. No layout, color, spacing, or component changes were introduced.

## Validation

- `npm test -- data/__tests__/tutorial-copy.test.ts components/__tests__/first-session-cue.test.ts engine/__tests__/strategy-guidance.test.ts --runInBand`
- Full ship-loop validation to be recorded in Dev Lab after the autonomous push.
