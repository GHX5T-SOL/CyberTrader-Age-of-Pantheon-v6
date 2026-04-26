# oracle-p0-001 Economy Replay Harness

Date: 2026-04-26
Owner: Oracle

## Scope

`engine/economy-replay.ts` adds a deterministic launch-tuning harness that runs 1000 seeded economy sessions through:

- seeded market ticks,
- buy/sell strategy selection,
- Energy and Heat constraints,
- bounty tier raid cadence,
- impossible-state and soft-lock issue reporting,
- median outcome summaries for tuning follow-up work.

The harness stays engine-level and does not perform network, wallet, on-chain, or real-money actions.

## How To Run

```bash
npm run replay:economy
npm test -- --runInBand engine/__tests__/economy-replay.test.ts
ORACLE_REPLAY_LOG=1 npm test -- --runInBand engine/__tests__/economy-replay.test.ts
```

The report command prints a compact summary with session count, issue counts, median PnL, median final balance, median trade count, median max Heat, and median first profitable sell tick.

## Local Result

Focused replay check on 2026-04-26:

```text
sessions=1000 ticks=60 profitableSessions=1000 raidSessions=81 softLocks=0 impossibleStates=0 medianPnl=48.88 medianFinalBalance=1000029.80 medianTrades=32 medianMaxHeat=60 medianFirstProfitTick=4
```

## Acceptance

- 1000 replay seeds run deterministically and produce identical summaries on repeat.
- Impossible states are counted and fail the regression if any appear.
- Soft locks are counted and fail the regression if any appear.
- Median outcomes are exposed by `runEconomyReplay()` and formatted by `formatEconomyReplaySummary()`.
- At least 900 of 1000 seeded sessions must produce a profitable sell before this gate stays green.

## Follow-Up

`oracle-p0-002` should use this harness to tune commodity volatility, Heat, Energy, raid, bounty, and courier thresholds against target launch bands.
