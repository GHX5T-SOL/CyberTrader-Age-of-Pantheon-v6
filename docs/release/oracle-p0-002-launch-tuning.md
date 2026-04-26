# oracle-p0-002 Launch Economy Tuning

Date: 2026-04-26
Owner: Oracle
Status: Complete

## Scope

This pass locks the launch tuning bands for commodity volatility, Energy, Heat,
raid cadence, bounty escalation, and high-risk reward pressure using the existing
`oracle-p0-001` replay harness and `nyx-p0-002` demo pressure routes.

The pass stays deterministic and local. It does not use credentials, remote
authority, wallet actions, on-chain actions, real-money actions, or production
data.

## Tuned Launch Bands

`engine/launch-tuning.ts` codifies the accepted launch bands:

- 1000 deterministic sessions across 60 ticks each.
- 0 soft locks and 0 impossible states.
- At least 980 profitable sessions.
- Median realized PnL between 25 and 100 0BOL.
- Median max Heat between 45 and 70.
- Median first profitable sell by tick 6.
- Raid exposure between 50 and 160 sessions per 1000 seeded sessions.
- Starter route stays below Heat 30.
- Route-runner route reaches Watchlist pressure between Heat 30 and 69.
- Contraband route reaches Priority Target pressure above Heat 70 but stays below the Heat ceiling.
- Contraband route pays at least 2x the route-runner realized PnL.

## Local Result

Focused launch tuning check on 2026-04-26:

```text
sessions=1000 ticks=60 profitableSessions=1000 raidSessions=81 softLocks=0 impossibleStates=0 medianPnl=48.88 medianFinalBalance=1000029.80 medianTrades=32 medianMaxHeat=60 medianFirstProfitTick=4
starter-stabilizer pnl=0.90 trades=2 profitable=1 maxHeat=8 firstProfitTick=4 issues=0
route-runner pnl=49.20 trades=16 profitable=8 maxHeat=39 firstProfitTick=4 issues=0
contraband-sprint pnl=179.53 trades=16 profitable=8 maxHeat=85 firstProfitTick=4 issues=0
launchTuningIssues=0
```

## Verification

```bash
npm run tuning:launch
npm run replay:economy
npm test -- --runInBand engine/__tests__/demo-pressure.test.ts
```

The full release check path for this pass also includes:

```bash
npm run typecheck
npm test -- --runInBand
npx expo export --platform web
```

## Acceptance

- New players retain a profitable first-session survival band.
- Medium-risk play crosses visible bounty pressure without becoming punitive.
- High-risk contraband play is materially more rewarding and visibly more
  dangerous.
- Raid and courier risk escalation remain deterministic and documented.
- Tuning regressions now fail through `engine/__tests__/launch-tuning.test.ts`.

## Follow-Ups

- `axiom-p0-001` should run the launch tuning routes in Web/iOS/Android smoke QA.
- `vex-p0-001` should verify the Heat, Bounty, Energy, and courier risk signals
  remain readable on small phones during these routes.
