# nyx-p1-001 — Glitch Echo (GLCH) commodity

Date: 2026-04-29
Owner: Nyx (Game Designer) with Palette (Brand) and Hydra (Swarm) review.
Status: Shipped to v6 main.

## Summary

CyberTrader's deterministic market grows from **10 to 11 commodities** with the
introduction of `GLCH` — *Glitch Echo*. GLCH lives in the mid-volatility,
mid-heat band and gives players a fresh AI-fragment narrative ticker between
the safe `VBLM`/`MTRX` floor and the high-risk `BLCK`/`AETH` ceiling.

This is an additive content expansion under the autonomous Daily Visible
Upgrade Rule. Determinism, oracle harnesses, store-safety boundaries, and
provenance workflow are all preserved.

## Lore

> *"Two Eidolon shards de-sync at 03:14 GMT — for half a second, the void
> reverberates. The runners who reach the harmonic first crystallise the
> echo. Glitch Echoes don't trade like data; they trade like ghosts."*

Glitch Echoes are crystallised AI-fragment shockwaves harvested from
S1LKROAD 4.0 archive collisions. They drift unpredictably with any
Eidolon-tagged news event; faction agents covet them for memory laddering
work, while corp counter-intel teams flag every transaction.

## Mechanic

| Field        | Value                              |
| ------------ | ---------------------------------- |
| ticker       | `GLCH`                             |
| name         | `Glitch Echo`                      |
| basePrice    | `95` 0BOL                          |
| volatility   | `med`                              |
| heatRisk     | `med`                              |
| eventTags    | `["ai_fragment", "drift"]`         |
| driftBias    | `0.0014`                           |
| heat-buy     | `+4`                               |
| heat-sell    | `+1` (`max(1, 4 − 3)`)             |
| festival eligible | `yes` (added to `FESTIVAL_TICKERS`) |

GLCH sits between `MTRX` (low volatility, heatRisk low) and `PGAS` (med, med)
on the risk curve. It is **not** in `HIGH_RISK_TICKERS`, **not** whitelisted
by current player archetype strategies, and is included in the festival
rotation so district `FESTIVAL` events can land on it.

## Files Touched

- `engine/demo-market.ts` — added `GLCH` to `DEMO_COMMODITIES` and
  `DRIFT_BIAS`.
- `engine/district-state.ts` — added `GLCH` to `FESTIVAL_TICKERS`.
- `assets/commodity-art.ts` — registered `GLCH` art handle.
- `assets/commodities/glitch_echo.png` — 1024×1024 HD source (668 KB).
- `assets/optimized/commodities/glitch_echo.png` — 256×256 in-app art (98 KB).
- `assets/provenance.json` — regenerated; now 39 assets.
- `scripts/generate-glch-sprite.py` — repeatable Pillow generator.
- `docs/release/nyx-p1-001-glch-glitch-echo.md` — this note.
- `docs/release/hydra-p0-001-market-swarm-simulation-plan.md` — archived
  planning doc preserved from the old `claude/upbeat-maxwell-wET5H` branch
  before that branch was deleted (PR #1 closed).

## Validation

- `npm run safety:autonomous` — `ok: true`, 9 files checked, 5 rules clean.
- `npm run typecheck` — clean.
- `npm test -- --runInBand` — **149/149** in 32 suites.
- `npm run provenance:assets:check` — current with 39 assets.
- `npx expo export --platform web` — clean (web bundle exported).

## Determinism contract

GLCH inherits the existing `seededStream` flow. Adding the ticker:

- **Does not** change the random sequence consumed by existing seeds for any
  ticker that was previously present (the new entry is appended; PRNG draws
  remain ticker-keyed via per-ticker streams).
- **Does** add new draws keyed `GLCH` for replay/swarm/retention harnesses.
  Existing harness output for the previously-tracked tickers stays
  byte-identical when GLCH is excluded by ticker filter.
- Player archetypes (`engine/player-archetypes.ts`) still whitelist
  `VBLM/NGLS/MTRX`, `VBLM/MTRX/PGAS`, etc. — they will not enter GLCH
  positions until Oracle drops a follow-up tuning task (`oracle-p1-007`)
  that explicitly admits GLCH.

## Brand & store safety

- Sprite is internally generated via Pillow; provenance is internal-only.
  No external/stock/AI-licensed artwork. Free for all store surfaces.
- The new ticker complies with `kite-p1-004` store-safety rules: it is
  in-game-only currency exposure, no real-money copy, no investment claims,
  no signing/wallet language.
- Capture pipeline (`npm run capture:screenshots`) will pick up the new art
  the next time it runs because it walks the live `DEMO_COMMODITIES` list.

## Follow-ups

- **oracle-p1-007** — admit GLCH into one or more player archetype mixes
  and re-run `npm run archetypes:report` to validate viability.
- **hydra-p1-003** — extend the synthetic market swarm scenarios to include
  GLCH as both target and counter-trade asset.
- **palette-p1-005** — promote the placeholder Pillow sprite to a proper
  hand-authored or SpriteCook-generated piece once Reel approves the
  visual direction.
- **vex-p1-006** — surface the `ai_fragment` tag in the terminal as a
  diegetic chip on the trade ticket so the player feels the lore.
