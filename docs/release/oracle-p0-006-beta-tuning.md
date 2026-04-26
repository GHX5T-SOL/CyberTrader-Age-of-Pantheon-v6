# oracle-p0-006 Beta Tuning Parameter Adjustments

**Task:** oracle-p0-006  
**Agent:** Zara (OpenClaw implementation scout)  
**Run:** 20260426T205541Z-zara  
**Date:** 2026-04-26

## Summary

Applied targeted beta tuning parameter adjustments to three of the four player archetypes, derived directly from the oracle-p0-005 baseline analysis. The tuning improves per-trade reward for the two lowest-PnL archetypes and eliminates the heat-seeker edge-case failure, while leaving the already-optimal momentum-trader unchanged.

## Files Added / Modified

- `engine/beta-tuning.ts` — tuned archetype parameter set, comparison runner, and formatters
- `engine/__tests__/beta-tuning.test.ts` — 17 tests covering viability, improvement bounds, ordering, and determinism
- `package.json` — added `tuning:beta` script
- `docs/release/oracle-p0-006-beta-tuning.md` — this file

## Tuning Changes

| Archetype | Parameter | Baseline | Tuned | Rationale |
|---|---|---|---|---|
| cautious-grinder | `quantities[0]` (VBLM) | 10 | 15 | Larger position amplifies per-trade return without heat risk |
| cautious-grinder | `profitTargetPct` | 0.003 | 0.005 | Higher target improves per-trade PnL while still reachable on VBLM drift |
| heat-seeker | `profitTargetPct` | 0.012 | 0.010 | Fixes 1/200 non-profitable edge case; 1.0% target is reachable in more tick windows on volatile commodities |
| speed-runner | `quantities` | [5, 5, 5] | [8, 8, 8] | 60% position increase amplifies the frequency advantage; ~0.38 avg per-trade was too low |
| momentum-trader | — | — | — | No change. 100% profitable, medianPnl 33.50 — already optimal |

## Archetype Seed / Run Configuration

Tuned archetypes use the same `oracle-p0-005:{archetype-id}` seed prefix as the oracle-p0-005 baseline, ensuring a fair same-seed comparison between baseline and tuned parameter sets.

## Validation

| Check | Result |
|---|---|
| `npm run typecheck` | Clean — PASS |
| `npm test -- --runInBand` | 109/109 tests, 26 suites — PASS |
| `npm run tuning:beta` | Prints comparison report via `ORACLE_BETA_TUNING_LOG=1` |

All 17 new `beta-tuning.test.ts` tests pass:
- All four tuned archetypes pass viability gates (≥70% profitable sessions, 0 impossible states)
- Tuned cautious-grinder medianPnl > 6.13 (oracle-p0-005 baseline) ✓
- Tuned speed-runner medianPnl > 8.43 (oracle-p0-005 baseline) ✓
- Tuned heat-seeker profitableSessionFraction ≥ 99.5% ✓
- Tuned momentum-trader medianPnl > 20, 100% profitable ✓
- Ordering invariants preserved: cautious-grinder < heat-seeker max heat; speed-runner ≥ grinder trade count ✓
- Determinism confirmed ✓

## Comparison Script

```bash
npm run tuning:beta
```

Runs `ORACLE_BETA_TUNING_LOG=1` against the beta-tuning test suite, printing side-by-side baseline vs. tuned reports for all four archetypes including PnL delta.

## Design Notes

- `BETA_TUNED_ARCHETYPES` is a `readonly PlayerArchetype[]` drop-in replacement for `PLAYER_ARCHETYPES` — it can be passed directly to `runPlayerArchetypeReport`.
- `runBetaTuningComparisons()` accepts an optional `{ seedCount, ticks }` override (defaults to 200 seeds × 60 ticks) and produces side-by-side baseline/tuned reports.
- `BETA_TUNING_DELTAS` records every change and its rationale for audit trail.
- No changes were made to game runtime code — tuning parameters only live in the engine simulation layer.

## Next Steps

- Apply tuned parameter values to in-game strategy guidance and NPC hint text (Vex/Nyx handoff).
- `palette-p1-002`: icon/splash placeholder creation (Gate C blocker — requires image tooling decision).
- `talon-p1-004`: automated post-push regression detection (launchd / webhook).
