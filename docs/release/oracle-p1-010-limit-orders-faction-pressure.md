# oracle-p1-010 - Limit Orders And Faction Pressure

This pass completes the deterministic engine contract for AgentOS-era limit orders and faction market pressure. It is intentionally engine-only so UI and Authority adapters can adopt the contract without changing the current first-session loop.

## Shipped

- Added serializable `LimitOrder`, `LimitOrderFill`, and `FactionMarketPressure` interfaces to `engine/types.ts`.
- Added `engine/limit-orders.ts` with deterministic limit-order creation, explicit cancellation, expiry, buy/sell resolution, resource updates, holding updates, and faction market pressure helpers.
- Added faction pressure profiles for Free Splinters, Blackwake, Null Crown, and Archivists so AgentOS standing can alter ticker prices without producing negative or non-finite prices.
- Added `npm run limit-orders:check` and regression coverage for order serialization, deterministic buy fills, deterministic sell fills, explicit cancellation, impossible sell cancellation, stale order expiry, faction-pressure determinism, and pressure-triggered sell execution.

## Validation

- `npm run limit-orders:check` passed: 7/7 tests.
- `npm run ship:check` passed: safety scan, typecheck, 173/173 Jest tests in 35 suites, and Expo web export.
- `npm run build:web -- --clear` passed after clearing the Metro export cache.

## Follow-ups

- Wire limit orders into the live terminal once Nyx defines the player-facing command flow.
- Let AgentOS faction missions award or expose faction pressure windows through mission outcomes.
- Extend Axiom smoke coverage after the terminal UI starts placing and cancelling limit orders.
