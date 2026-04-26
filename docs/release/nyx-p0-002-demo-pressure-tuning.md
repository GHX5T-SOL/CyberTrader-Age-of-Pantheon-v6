# nyx-p0-002 Demo Pressure Tuning

Date: 2026-04-26
Owner: Nyx
Status: Complete

## Scope

This pass locks the 10-minute Gate A demo pressure bands after `oracle-p0-001` proved the 1000-seed replay baseline.

It does not use credentials, remote authority, wallet actions, real-money actions, or production data.

## Tuning Targets

- 60 ticks represent the 10-minute demo pressure window.
- The starter route must close a profitable `VBLM` sell within 6 ticks.
- At least 3 repeatable strategies must remain viable with no soft locks or impossible states.
- Medium pressure must visibly cross the Watchlist bounty band.
- High pressure must reach Priority Target pressure without crossing the Heat ceiling.
- Courier risk must scale with the highest Heat reached in the strategy.

## Implemented Strategy Bands

`engine/demo-pressure.ts` adds a deterministic pressure audit with three player routes:

| Strategy | Intent | Result |
| --- | --- | --- |
| Starter VBLM stabilizer | First-session safe path. Buy one `VBLM` lot, wait for green, sell. | `pnl=0.90`, `trades=2`, `profitable=1`, `maxHeat=8`, `firstProfitTick=4`. |
| Route runner medium tape | Repeatable low/medium-risk trading across `NGLS`, `PGAS`, and `ORRS`. | `pnl=49.20`, `trades=16`, `profitable=8`, `maxHeat=39`, `firstProfitTick=4`. |
| Contraband sprint | High-risk route across `AETH`, `FDST`, and `BLCK`. | `pnl=179.53`, `trades=16`, `profitable=8`, `maxHeat=85`, `firstProfitTick=4`. |

The high-risk route reaches `PRIORITY TARGET` bounty pressure and raises courier risk to `critical` for Ghost Runner and `high` for Shadow Haul / Armored Conduit.

## Verification

```bash
NYX_PRESSURE_LOG=1 npm test -- --runInBand engine/__tests__/demo-pressure.test.ts
```

Passing assertions:

- all three strategies have zero issues, positive realized PnL, positive profitable trades, remaining Energy, and Heat below 100;
- starter first profitable sell lands by tick 6 and stays in `SAFE`;
- route runner crosses `WATCHED`;
- contraband sprint crosses `PRIORITY TARGET` and exposes high/critical courier risk.

## Follow-ups

- `oracle-p0-002` can now tune commodity volatility and thresholds against these Nyx bands.
- `axiom-p0-001` should use the three strategies as Web/iOS/Android QA smoke scenarios.
- `vex-p0-001` should ensure Energy, Heat, Bounty, and courier risk are readable on small phones while running these paths.
