# hydra-p1-003 - Retention Trigger Tuning Handoff

Date: 2026-04-29
Owner: Hydra

## Summary

`hydra-p1-003` turns the completed first-20 retention/churn scenarios into a deterministic tuning handoff for Nyx, Oracle, and Vex. The new `engine/retention-tuning.ts` layer consumes the existing `hydra-p1-002` reports, ranks weighted churn triggers, assigns owner actions, and prints compact acceptance criteria for future tuning loops.

This does not change live economy constants yet. The current scenarios are viable but all four remain in `watch` state, so the safer next step is to ship deterministic action selection before making balance or UI changes.

## Command

```bash
npm run retention:tuning
```

The command runs `engine/__tests__/retention-tuning.test.ts` with logging enabled.

## Current Handoff

- `action-fatigue` is the dominant trigger at 45 weighted player slots across all four first-20 scenarios.
- `heat-anxiety` is second at 30 weighted player slots, concentrated in contraband-tourist and returning-casual personas.
- `low-reward` is third at 18 weighted player slots, most visible in the tutorial-friction cohort.
- `slow-first-profit` remains a smaller tutorial-friction follow-up at 3 weighted player slots.
- Impossible states remain `0`; minimum estimated D1 return remains above the 62% viability floor.

## Owner Actions

- Nyx owns `hydra-p1-003-action-fatigue`: add a short-session progress summary and next-best-action beat before changing economy constants.
- Vex owns `hydra-p1-003-heat-anxiety`: surface a compact Heat ladder, contraband warning, and safe fallback lane on pressure surfaces.
- Oracle owns `hydra-p1-003-low-reward`: test first-profit reward clarity before adjusting starter lot size or target percentages.
- Nyx owns `hydra-p1-003-slow-first-profit`: keep first-profit guidance visible until the first green sale closes.

## Acceptance Criteria

- Keep every first-20 retention scenario at or above 62.0% estimated D1 return.
- Keep impossible state count at exactly `0`.
- Triage the top two weighted triggers before adding new beta cohorts or store-preview beats.
- Rerun `npm run retention:tuning` after economy, tutorial, mission, or Heat-warning changes.

## Validation

- `npm run retention:beta`
- `npm run retention:tuning`
