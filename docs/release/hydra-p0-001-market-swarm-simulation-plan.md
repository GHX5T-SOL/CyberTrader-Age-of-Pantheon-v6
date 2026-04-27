# hydra-p0-001 Market Swarm Simulation Plan

Date: 2026-04-27
Owner: Hydra (ElizaOS Swarm)
Status: Plan accepted; implementation deferred to a follow-up task once Oracle's launch tuning bands stop changing.

## Scope

This note defines the synthetic market swarm that Hydra will run on top of the existing Oracle determinism harnesses to stress the v6 economy with **NPC trader pressure** in addition to the **player-archetype** strategies Oracle already covers in `engine/player-archetypes.ts` (`oracle-p0-005`) and `engine/beta-tuning.ts` (`oracle-p0-006`).

This is a documentation-only deliverable. No engine code, no on-chain action, no real-money path is added by this task. ElizaOS runtime hookup is explicitly listed in the follow-up section.

## Why a Swarm

Oracle's current evidence proves the deterministic engine survives 1000 seeds × 60 ticks (`oracle-p0-001`), 1000 seeds × 300 ticks (`oracle-p0-004`), four adversarial starting conditions × 200 seeds (`oracle-p0-003`), and four player archetypes × 200 seeds (`oracle-p0-005`). All of these treat the rest of the market as a **price-process driven by seeded PRNG drift, volatility, district modifiers, and flash events** — there are no synthetic counter-parties trading against the player.

For Phase 1 launch tuning that is enough. For Phase 2 economy tuning, retention scenarios, and Oracle's `oracle-p1-003` ElizaOS scenarios, we need to know what happens when:

- A whale agent dumps `BLCK` while the player is long.
- An HFT cluster mean-reverts `PGAS` faster than the player can size into it.
- A faction-aligned agent hoards `SNPS` because of a deterministic news event.
- A rumor agent front-runs an `AETH` pump sourced from the news generator.
- A retail crowd amplifies whatever direction the most recent flash event points in.

These are NPC behaviors, not player behaviors. They should be modeled inside the existing seeded market loop so the result is reproducible.

## NPC Agent Archetypes

Five NPC archetypes; each is fully described by a typed config. The runtime pulls all randomness through `seededStream(seed)` so a swarm seed plus archetype mix reproduces exactly.

| Archetype | Behavior | Touches | Primary Effect on Player |
| --- | --- | --- | --- |
| `whale` | Holds large positions; trades infrequently in chunks ≥ 3× `ORDER_SIZES.max`; biased toward `very_high` and `high` volatility tickers. | `BLCK`, `AETH`, `HXMD` | Sudden one-tick price gaps; raises observed volatility on contraband; stresses the player's stop-loss path. |
| `hft` | High-frequency mean-reverter; trades every 1-2 ticks at small size; targets `med` volatility tickers. | `PGAS`, `ORRS`, `SNPS` | Compresses spread; reduces drift profit; directly tests `oracle-p0-005` momentum-trader assumptions. |
| `faction` | Deterministic news-reactive holder; buys when `news-generator` emits a positive `signal`/`faction` tag, sells on negative `raid`/`evasion` tag. | `SNPS`, `ORRS`, `NGLS` | Aligns price moves with on-screen news; tests Nyx's first-session readability and Vex's HUD. |
| `rumor` | Front-runs scheduled flash events by 1-2 ticks using the same seed; partial information leakage. | `AETH`, `FDST`, `BLCK` | Stresses the player's reaction window; bounds how much expected value an unprepared player can lose to "smart money". |
| `retail` | Trend-follower; buys after two consecutive up-ticks, sells after two consecutive down-ticks; very low capital per agent. | All tickers | Adds momentum to whatever direction the price process is already drifting; amplifies tail moves. |

Each archetype is parameterised by:

```ts
interface NpcArchetypeConfig {
  id: "whale" | "hft" | "faction" | "rumor" | "retail";
  population: number;          // number of independent agents in the swarm
  capitalObolPerAgent: number; // starting balance for each agent (NPC ledger only)
  tickers: readonly string[];  // subset of DEMO_COMMODITIES
  cooldownTicks: number;       // minimum gap between trades per agent
  reactionLatencyTicks: number; // 0 for whale, 1-2 for rumor, etc.
  sizeBand: { min: number; max: number };
  triggerKind:
    | "interval"
    | "mean_revert"
    | "news_tag"
    | "flash_lookahead"
    | "trend_follow";
  triggerParams: Record<string, number | string>;
}
```

The five archetypes ship as `readonly` constants (mirroring `PLAYER_ARCHETYPES`), and the swarm-sim runner consumes a `readonly NpcArchetypeConfig[]`.

## Simulation Inputs

Inputs are reproducible through three knobs:

1. `swarmSeed: string` — deterministic PRNG seed shared by every NPC agent. Different seed = different swarm session, identical behaviour given the same seed.
2. `archetypeMix: NpcArchetypeConfig[]` — at least the five defaults above; tests can override population per archetype to model "whale-heavy" or "retail-heavy" markets.
3. `tickCount: number` — defaults to `ECONOMY_REPLAY_TICKS` (60) for Gate A scenarios and `300` for endurance scenarios (`oracle-p0-004` parity).

The runner re-uses Oracle's existing primitives:

- `createInitialPrices()` and `advancePrices()` from `engine/demo-market.ts` to drive the underlying price process.
- `seededStream(swarmSeed)` from `engine/prng.ts` for every NPC randomness call.
- `DEMO_COMMODITIES` for the canonical ticker universe.
- `news-generator.ts` taps for the `faction` archetype.
- `flash-events.ts` taps for the `rumor` archetype's lookahead window.

NPC trades affect the **observed** market by adjusting per-tick price drift through a bounded **swarm impact term** (clamped to `±2 × volatility`), so the engine never violates its existing safety invariants (no negative balance, no impossible state). The impact term is added to the existing `advancePrices()` output before the player's strategy reacts.

## Determinism Contract

- Same `swarmSeed + archetypeMix + tickCount + commodity tape` → identical NPC trade ledger and identical price impact, byte-for-byte.
- The NPC ledger is computed *before* the player strategy step each tick, so player strategies remain reproducible.
- No floating-point time, no `Math.random()`, no `Date.now()` may enter the swarm path. Every random draw routes through `seededStream()`.
- Swarm runs are independently reproducible per archetype: setting `archetypeMix` to a single archetype and verifying its trade count and PnL distribution must produce identical numbers across two runs (mirrors how `oracle-p0-005` proves determinism per archetype).

## Reports That Feed Oracle Tuning

Each swarm run emits a structured summary that maps directly to the tuning levers Oracle already maintains in `engine/launch-tuning.ts`, `engine/beta-tuning.ts`, and `engine/economy-stress.ts`.

| Metric | Source | Feeds Oracle Task |
| --- | --- | --- |
| `swarmTradeCount` per archetype | NPC ledger | Calibrates `population` so a single seed feels alive but not gamed. |
| `priceImpactDistribution` per ticker | Per-tick swarm impact term | Tightens the `±2 × volatility` clamp if outliers appear; informs `oracle-p0-002` launch tuning bands. |
| `playerPnlDeltaVsBaseline` | `(player PnL with swarm) − (player PnL without swarm)` for each `PLAYER_ARCHETYPES` archetype | Direct input to `oracle-p0-006` beta tuning; if grinder PnL drops below `medianPnl=4.0` the cautious-grinder band must be re-tuned. |
| `raidSessionRateDelta` | Compared against `oracle-p0-001` baseline (8.1 % at 60 ticks, 75.6 % at 300 ticks) | Tells `nyx-p0-002` whether NPC pressure changes raid frequency outside the accepted band. |
| `softLockCount` and `impossibleStateCount` | Same invariants as `oracle-p0-001` | Hard-fail if non-zero; the swarm is rejected before it can change tuning. |
| `firstProfitableSellTickDelta` | Per `PLAYER_ARCHETYPES` archetype | Feeds `nyx-p0-001` first-session loop tightening — a >2-tick regression vs. the no-swarm baseline blocks Gate A. |

The runner produces both the structured JSON summary (Jest-readable) and a printable Markdown table for the `docs/release/` follow-up that ships the actual numbers.

## Default Swarm Mix (Gate A Baseline)

```ts
const DEFAULT_SWARM_MIX: readonly NpcArchetypeConfig[] = [
  { id: "whale",  population: 2,  capitalObolPerAgent: 500_000, tickers: ["BLCK", "AETH", "HXMD"],
    cooldownTicks: 6, reactionLatencyTicks: 0, sizeBand: { min: 75, max: 200 },
    triggerKind: "interval", triggerParams: { everyTicks: 8 } },
  { id: "hft",    population: 6,  capitalObolPerAgent: 50_000,  tickers: ["PGAS", "ORRS", "SNPS"],
    cooldownTicks: 1, reactionLatencyTicks: 0, sizeBand: { min: 5,  max: 25  },
    triggerKind: "mean_revert", triggerParams: { lookbackTicks: 3, deviationPct: 0.012 } },
  { id: "faction", population: 4, capitalObolPerAgent: 80_000,  tickers: ["SNPS", "ORRS", "NGLS"],
    cooldownTicks: 4, reactionLatencyTicks: 1, sizeBand: { min: 20, max: 60  },
    triggerKind: "news_tag", triggerParams: { tags: "signal,faction,raid" } },
  { id: "rumor",  population: 3,  capitalObolPerAgent: 60_000,  tickers: ["AETH", "FDST", "BLCK"],
    cooldownTicks: 5, reactionLatencyTicks: 1, sizeBand: { min: 15, max: 45  },
    triggerKind: "flash_lookahead", triggerParams: { lookaheadTicks: 2 } },
  { id: "retail", population: 30, capitalObolPerAgent: 1_500,   tickers: ["VBLM","NGLS","MTRX","PGAS","FDST","ORRS","SNPS","HXMD","AETH","BLCK"],
    cooldownTicks: 2, reactionLatencyTicks: 0, sizeBand: { min: 1,  max: 5   },
    triggerKind: "trend_follow", triggerParams: { upTicks: 2, downTicks: 2 } },
];
```

Population numbers are first-pass values; the implementation task must converge on values that keep the four `PLAYER_ARCHETYPES` viable per `oracle-p0-005` viability gates (`profitableSessionRate ≥ 0.7`, zero impossible states).

## Acceptance Criteria

| Criterion | Evidence Required |
| --- | --- |
| Agent archetypes are defined | This document plus `NpcArchetypeConfig` typing committed in v6 follow-up. |
| Simulation inputs are reproducible | `swarmSeed + archetypeMix + tickCount` produces identical NPC ledger and price impact across two runs (Jest determinism test in follow-up). |
| Reports feed Oracle tuning | Structured summary maps to launch-tuning, beta-tuning, economy-stress, and nyx first-session metrics as per the table above. |

This task is now satisfied for the planning gate. The implementation gate is the follow-up below.

## Implementation Follow-Up

The implementation will land as a separate task (proposed `hydra-p1-002` ElizaOS swarm runtime) with this acceptance shape:

- `engine/market-swarm.ts` exports `runMarketSwarm(swarmSeed, archetypeMix, tickCount, playerStrategy)` and `summariseSwarm(result)`.
- `engine/__tests__/market-swarm.test.ts` proves: determinism per seed, zero soft-locks/impossible states, viability of all four `PLAYER_ARCHETYPES` under `DEFAULT_SWARM_MIX`, and bounded price impact (clamp respected on every tick).
- `npm run swarm:simulate` runs a focused jest target that prints the structured summary.
- `docs/release/hydra-p1-002-market-swarm.md` records the local baseline numbers and any tuning changes Oracle must apply downstream.

ElizaOS runtime integration (running these archetypes as live agents in dev) is explicitly out of scope for `hydra-p0-001` and remains owned by Hydra in the readiness map.

## Validation

This is a documentation-only deliverable. The required v6 validation for this pass mirrors any other doc commit:

- `npm run typecheck`: pass.
- `npm test -- --runInBand`: pass with no test count change.
- `npx expo export --platform web`: pass.

Dev Lab planning sync: `cd web && npm run typecheck && npm run build` after the linked task status changes.

## Hard Stops

- No on-chain action.
- No real-money trade path.
- No external broker / oracle integration.
- No production data deletion or schema migration.
- No dependency upgrade in `package.json`.

These are confirmed against `docs/release/ghost-p0-001-release-authority.md` and `docs/release/talon-p0-002-autonomous-safety-rails.md`.
