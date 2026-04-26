# oracle-p0-004: Extended Endurance Economy Replay

Run: Zyra 20260426T185802Z  
Date: 2026-04-26

## Summary

Extended the deterministic economy replay harness from 1,000 seeds × 60 ticks to **1,000 seeds × 300 ticks** (5× depth). All sessions remain economically viable over a full extended session. No impossible states, no negative balances, and no soft locks were observed.

## What Was Built

- `engine/economy-endurance.ts` — endurance replay runner with quartile balance/PnL stats and pass/fail gates
- `engine/__tests__/economy-endurance.test.ts` — 9-gate test suite covering stability, profitability, determinism, and balance positivity; `jest.setTimeout(120_000)` for the longer compute window
- `npm run endurance:economy` — runs the endurance suite with full log output

## Baseline Results (2026-04-26)

```
ENDURANCE REPLAY sessions=1000 ticks=300
impossibleStates=0 softLocks=0
profitableSessions=1000/1000 negativeBalance=0 noTrade=0
balanceP25=999594.50 balanceP50=999861.77 balanceP75=1000011.78
pnlP25=40.04 pnlP50=62.88 pnlP75=87.00
medianMaxHeat=84 medianTrades=58 raidSessions=756
STATUS: PASS
```

## Key Findings

| Metric | Value | Notes |
|---|---|---|
| Profitable sessions | 1000 / 1000 (100%) | Gate: ≥ 90% |
| Impossible states | 0 | Gate: 0 |
| Soft locks | 0 | Gate: 0 |
| Negative-balance sessions | 0 | Gate: 0 |
| Median realized PnL | 62.88 0BOL | Over 300 ticks |
| Balance P25 / P50 / P75 | 999594 / 999861 / 1000011 0BOL | Tight distribution; economy is stable |
| Median max Heat | 84 | Below ceiling (100); raid pressure is real but manageable |
| Raid sessions | 756 / 1000 (75.6%) | High frequency over 300 ticks; sessions recover cleanly |
| Median trades | 58 | ~1 trade per 5 ticks at steady state |

## Interpretation

- **Heat ceiling behavior**: Median max Heat of 84 over 300 ticks means most long sessions approach the Priority Target zone (75+) but do not peg at 100 — the buy-block at Heat ≥ 82 prevents compounding.
- **Raid recovery**: 75.6% of 300-tick sessions experience at least one raid, yet no sessions end with negative balance. Quantity loss from raids is absorbed by subsequent profitable trades.
- **Balance distribution**: P25–P75 spans ~417 0BOL around the starting 1,000,000 0BOL. The economy is neither hyper-inflationary nor deflationary over the extended horizon.
- **Determinism confirmed**: Two independent runs produce identical metrics — the PRNG seeding is correct over 300 ticks.

## Gates Passed

- [x] Zero impossible states
- [x] Zero negative-balance sessions
- [x] ≥ 90% of sessions have at least one profitable trade
- [x] Median max Heat within [0, 100]
- [x] P50 balance > 0
- [x] Deterministic across runs
- [x] All 9 test assertions pass

## Suite Results

- Endurance suite: **9 / 9 tests pass** (80.9 s)
- Full suite after adding endurance: **82 / 82 tests in 24 suites** (114 s)
- `npm run typecheck`: pass

## Follow-Up

- `oracle-p0-005` (proposed): Beta tuning inputs — produce player-archetype-specific economy reports for aggressive, balanced, and cautious strategies over 300-tick endurance runs to inform beta balancing.
- Cold-launch native validation (`rune-p0-003` follow-up) still pending on device/simulator.
