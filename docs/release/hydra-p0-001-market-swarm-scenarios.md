# hydra-p0-001 Market Swarm Simulation Scenarios

**Task:** hydra-p0-001  
**Agent:** Hydra (ElizaOS Swarm Coordinator)  
**Date:** 2026-04-27

## Summary

Adds a deterministic market-swarm simulation harness that turns the completed Oracle archetype and beta-tuning work into four launch-readiness cohort scenarios. The harness is local and seed-based, so it can run in CI or autonomous loops without live services, API keys, ElizaOS credentials, on-chain actions, or production data.

## Files Added / Modified

- `engine/market-swarm.ts` — four deterministic 20-agent swarm scenarios, weighted cohort metrics, status gates, and Oracle handoff recommendations.
- `engine/__tests__/market-swarm.test.ts` — regression coverage for scenario definitions, deterministic replay, no impossible states, viability floors, and risk-spike raid pressure.
- `engine/player-archetypes.ts` — optional `seedPrefix` input for scenario-specific deterministic seeds while preserving existing Oracle defaults.
- `package.json` — adds `npm run swarm:market`.
- `docs/release/hydra-p0-001-market-swarm-scenarios.md` — this release note.

## Scenario Set

| Scenario | Cohort Shape | Purpose |
|---|---:|---|
| `balanced-beta` | 8 cautious, 6 momentum, 3 heat, 3 speed | Default 20-player beta room for regression checks. |
| `novice-onramp` | 14 cautious, 3 momentum, 1 heat, 2 speed | Store-demo cohort dominated by first-session learners. |
| `risk-spike` | 3 cautious, 5 momentum, 9 heat, 3 speed | Contraband rumor/event cohort for raid and Heat pressure. |
| `speedrun-race` | 3 cautious, 4 momentum, 2 heat, 11 speed | High-frequency trade cohort for clip/social pacing risk. |

Each scenario uses:

- 20 weighted agents.
- 40 deterministic seeds per agent.
- 60 ticks per session.
- Scenario-specific seed prefixes under `hydra-p0-001:{scenario}:{archetype}`.
- The `oracle-p0-006` beta-tuned archetype parameters as inputs.

## Validation Gates

The swarm report fails when:

- any impossible state appears,
- profitable sessions fall below 85%,
- no-trade sessions exceed 2%.

It enters watch status when:

- raid sessions exceed 60%,
- weighted median max Heat reaches 50 or higher,
- weighted median PnL falls below 10 0BOL,
- median first-profit tick drifts beyond tick 4.

## Oracle Handoff

The reports are designed to feed the next Oracle/Nyx/Vex tuning tasks:

- Keep `balanced-beta` as the default economy-regression fixture after tuning changes.
- Use `novice-onramp` to protect first-session reward clarity and safe-loop retention.
- Use `risk-spike` before any contraband/faction event tuning; high Heat exposure is the primary warning signal, and raid cadence remains the follow-up threshold to watch in longer event simulations.
- Use `speedrun-race` to catch trade-count inflation and low PnL-per-action fatigue.

## Command

```bash
npm run swarm:market
```

The command runs the focused Jest suite with `HYDRA_SWARM_LOG=1`, printing each scenario report and Oracle handoff.

## Validation

Recorded for this pass:

- `npm run swarm:market` — PASS.
- Full ship checks are recorded in the automation run that shipped this task.
