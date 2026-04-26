# oracle-p0-005 Player Archetype Strategy Reports

**Task:** oracle-p0-005  
**Agent:** Zara (OpenClaw implementation scout)  
**Run:** 20260426T193840Z-zara  
**Date:** 2026-04-26

## Summary

Added `engine/player-archetypes.ts` — a multi-seed archetype replay harness that models four distinct beta player profiles and reports their statistical performance over 200 seeded sessions × 60 ticks each. All four archetypes pass viability gates (≥70% profitable sessions, zero impossible states).

## Archetypes

| Archetype | Label | Commodities | Max Heat Entry |
|---|---|---|---|
| `cautious-grinder` | Cautious Grinder | VBLM, NGLS, MTRX | 20 |
| `momentum-trader` | Momentum Trader | PGAS, ORRS, SNPS | 50 |
| `heat-seeker` | Heat Seeker | FDST, AETH, BLCK | 58 |
| `speed-runner` | Speed Runner | VBLM, MTRX, PGAS | 38 |

## Local Baseline Results (200 seeds × 60 ticks)

```
ARCHETYPE cautious-grinder seeds=200 ticks=60
profitable=200/200 (100.0%) raids=0 (0.0%) noTrade=0
medianPnl=6.13 p25=2.83 p75=9.28
medianTrades=12 medianMaxHeat=22 firstProfitTick=2
STATUS: PASS

ARCHETYPE momentum-trader seeds=200 ticks=60
profitable=200/200 (100.0%) raids=0 (0.0%) noTrade=0
medianPnl=33.50 p25=11.14 p75=60.78
medianTrades=16 medianMaxHeat=45 firstProfitTick=4
STATUS: PASS

ARCHETYPE heat-seeker seeds=200 ticks=60
profitable=199/200 (99.5%) raids=0 (0.0%) noTrade=0
medianPnl=33.72 p25=7.23 p75=60.26
medianTrades=12 medianMaxHeat=68 firstProfitTick=5
STATUS: PASS

ARCHETYPE speed-runner seeds=200 ticks=60
profitable=200/200 (100.0%) raids=0 (0.0%) noTrade=0
medianPnl=8.43 p25=4.41 p75=12.03
medianTrades=22 medianMaxHeat=40 firstProfitTick=2
STATUS: PASS
```

## Key Insights for Beta Tuning

- **Cautious grinder** has the lowest PnL (median 6.13 0BOL) but achieves first profit by tick 2, making it an ideal reference for the new-player on-ramp. The very-low heat entry cap (20) means zero raid exposure in 60 ticks.
- **Momentum trader** achieves the best trade-off: 100% profitable sessions, median PnL 33.50, first profit by tick 4, and moderate heat (max 45). Likely the dominant post-tutorial pattern.
- **Heat seeker** produces median PnL 33.72 — on par with the momentum trader — but with much higher heat exposure (median max 68). The 1/200 non-profitable session indicates the risk is real. Tuning levers: raise `stopLossPct` or lower `maxEntryHeat` if raid frequency rises with future heat-scaling changes.
- **Speed runner** makes the most trades (median 22 per session) but at lower per-trade margin (median PnL 8.43). First profit by tick 2 mirrors the grinder, confirming that fast-cycling low-risk tickers can reach profitability almost immediately.

## Tuning Recommendations

1. First-session target commodity: VBLM (very-low heat, high positive drift bias, first profit by tick 2 for both grinder and speed-runner archetypes).
2. Mid-game upgrade path: PGAS / ORRS / SNPS tier — momentum trader achieves 3× the grinder's median PnL without entering the heat-danger zone.
3. Endgame / high-risk reward: FDST / AETH / BLCK — 99.5% profitable, median PnL matches momentum trader, but heat ceiling (max 68) makes raids a late-game fixture rather than an early shock.
4. Trade-count scaling: speed runner's 22 median trades vs. grinder's 12 confirms that energy is not a hard bottleneck in 60-tick sessions. Energy refill cadence can stay as-is for Gate A.

## Validation

- `npm run typecheck`: pass
- `npm test -- --runInBand`: 92/92 in 25 suites (10 new archetype tests)
- Determinism confirmed: two independent runs of cautious-grinder produce identical median PnL and session counts.
- `npm run archetypes:report`: prints full archetype report via Jest log output.

## Files Added / Modified

- `engine/player-archetypes.ts` — archetype definitions and multi-seed runner
- `engine/__tests__/player-archetypes.test.ts` — 10 tests covering viability, ordering, and determinism
- `package.json` — added `archetypes:report` script
- `docs/release/oracle-p0-005-player-archetypes.md` — this file
