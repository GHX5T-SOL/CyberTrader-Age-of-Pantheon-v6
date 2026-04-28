# hydra-p1-002 Retention and Churn Scenarios

**Task:** hydra-p1-002
**Agent:** Hydra (ElizaOS Swarm Coordinator)
**Date:** 2026-04-28

## Summary

Adds a deterministic first-20-player retention harness for beta planning. The harness stays local and seed-based: no live ElizaOS credentials, no production analytics, no on-chain calls, and no player data are required.

The model builds on the completed Oracle beta tuning and Hydra market swarm work. It estimates D1 return risk from synthetic session outcomes, then logs churn triggers and Game Designer handoff notes for Nyx, Oracle, and Vex.

## Files Added / Modified

- `engine/retention-scenarios.ts` - five retention player archetypes, four first-20 beta scenarios, churn trigger scoring, D1 return estimates, and Game Designer recommendations.
- `engine/__tests__/retention-scenarios.test.ts` - deterministic regression coverage for scenario shape, viability floors, churn trigger logging, Heat-risk watch behavior, and report formatting.
- `package.json` - adds `npm run retention:beta`.
- `docs/release/hydra-p1-002-retention-churn-scenarios.md` - this release note.

## Retention Archetypes

| Persona | Source tuning archetype | Retention risk focus |
|---|---|---|
| `guided-newcomer` | `cautious-grinder` | Needs an early safe-loop win and clear tutorial reward. |
| `steady-upgrader` | `momentum-trader` | Returns if the medium-risk upgrade path is legible. |
| `contraband-tourist` | `heat-seeker` | Churns if Heat or raid pressure feels unfair. |
| `clip-speedrunner` | `speed-runner` | Needs high-frequency progress without fatigue. |
| `returning-casual` | `cautious-grinder` variant | Needs short-session progress and clear resume state. |

## Scenario Set

| Scenario | Cohort Shape | Purpose |
|---|---:|---|
| `balanced-first-week` | 6 newcomer, 5 upgrader, 3 contraband, 3 speedrunner, 3 casual | Default first-20 beta retention fixture. |
| `tutorial-friction` | 10 newcomer, 4 casual, 3 upgrader, 2 speedrunner, 1 contraband | Detects slow first-profit and low-reward onboarding churn. |
| `risk-event-pulse` | 7 contraband, 5 upgrader, 3 speedrunner, 3 newcomer, 2 casual | Tests weekend rumor or contraband-event Heat anxiety. |
| `short-session-return` | 8 casual, 5 speedrunner, 3 newcomer, 2 upgrader, 2 contraband | Tests whether returning low-time players see progress quickly. |

Each scenario uses:

- 20 weighted beta players.
- 10 deterministic seeds per player.
- 60 ticks per synthetic session.
- Scenario-specific seed prefixes under `hydra-p1-002:{scenario}:{persona}`.

## Churn Triggers

The harness logs these triggers per persona and aggregates them by affected player count:

- `slow-first-profit`
- `low-reward`
- `heat-anxiety`
- `low-agency`
- `action-fatigue`
- `no-trade-risk`
- `unstable-state`

## Recorded Results

`npm run retention:beta` passed on 2026-04-28.

| Scenario | Status | Estimated D1 | Retained Players | At-Risk Players | Primary Triggers |
|---|---|---:|---:|---:|---|
| `balanced-first-week` | watch | 76.9% | 15.39 / 20 | 30.0% | action fatigue, Heat anxiety |
| `tutorial-friction` | watch | 71.0% | 14.20 / 20 | 40.0% | low reward, action fatigue, Heat anxiety |
| `risk-event-pulse` | watch | 76.4% | 15.28 / 20 | 45.0% | action fatigue, Heat anxiety |
| `short-session-return` | watch | 74.6% | 14.93 / 20 | 50.0% | action fatigue, Heat anxiety, low reward |

No scenario fails the viability floor:

- 0 impossible states.
- 200 synthetic sessions per scenario.
- All estimated D1 return fractions are at least 62%.
- Risk-heavy and short-session cohorts are correctly marked `watch`, not `fail`.

## Game Designer Handoff

- Keep first-profit guidance visible through the first profitable sell for tutorial-heavy cohorts.
- Raise safe-loop reward clarity before inviting a new-player-heavy beta mix.
- Tune Heat warning copy and raid expectations before contraband event cohorts.
- Watch high-frequency loops for action fatigue and keep progress summaries visible.
- Keep these four first-20 cohorts as regression fixtures after economy, tutorial, or HUD changes.

## Command

```bash
npm run retention:beta
```

The command runs the focused Jest suite with `HYDRA_RETENTION_LOG=1`, printing each scenario report, churn triggers, and Game Designer handoff.
