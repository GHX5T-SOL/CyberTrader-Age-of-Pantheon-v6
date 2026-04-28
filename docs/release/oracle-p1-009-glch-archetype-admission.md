# oracle-p1-009 - GLCH Archetype Admission

Date: 2026-04-29
Owner: Oracle
Status: Shipped

## Summary

GLCH is now part of the deterministic medium-risk strategy path. The
`momentum-trader` archetype rotates through `PGAS`, `GLCH`, `ORRS`, and `SNPS`
with matched quantity slots, and the beta-tuned momentum path mirrors that mix.

This completes the Oracle follow-up from `nyx-p1-001`: GLCH is no longer only a
market commodity and festival target; it is covered by the same archetype,
beta-tuning, retention, and swarm regression fixtures that protect the launch
economy.

## Changes

- `engine/player-archetypes.ts` admits `GLCH` into the baseline
  `momentum-trader` ticker rotation.
- `engine/beta-tuning.ts` mirrors the GLCH-enabled medium-risk mix in
  `BETA_TUNED_ARCHETYPES`.
- `engine/retention-scenarios.ts` and `engine/market-swarm.ts` update the
  Game Designer / Oracle handoff copy to treat `PGAS/GLCH/ORRS/SNPS` as the
  first upgrade path.
- Focused Jest coverage now asserts both baseline and beta-tuned momentum
  paths include GLCH and keep quantity slots aligned with ticker slots.

## Validation

- `npm run archetypes:report` passed: 11/11 tests.
- `npm run tuning:beta` passed: 18/18 tests.
- `npm run retention:beta` passed: 10/10 tests.
- `npm run swarm:market` passed: 9/9 tests.
- `npm run ship:check` passed after rebasing onto `origin/main`: safety scan,
  typecheck, 157/157 Jest tests in 33 suites, and Expo web export.
- `npm run qa:smoke` passed: 1/1 Chromium route.

Key metrics after GLCH admission:

| Harness | Result |
| --- | --- |
| baseline `momentum-trader` | 200/200 profitable sessions, medianPnl 31.95, medianTrades 16, medianMaxHeat 45, firstProfitTick 4 |
| beta-tuned `momentum-trader` | 200/200 profitable sessions, medianPnl 31.95, no p0-006 numeric delta |
| balanced retention cohort | estimatedD1 76.9%, impossibleStates 0, steady-upgrader handoff uses `PGAS/GLCH/ORRS/SNPS` |
| balanced market swarm | status pass, profitable 100.0%, impossibleStates 0, weightedMedianPnl 19.06 |

## Notes

GLCH remains outside the first-session safe starter lane. `VBLM` stays the
explicit tutorial commodity; GLCH is a post-tutorial medium-risk upgrade target
with the same Heat band as PGAS/ORRS/SNPS.
