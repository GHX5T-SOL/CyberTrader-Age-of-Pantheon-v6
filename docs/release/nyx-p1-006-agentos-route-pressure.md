# nyx-p1-006 / oracle-p1-012 - AgentOS Route Pressure Hooks

Date: 2026-04-29
Owner: Nyx / Oracle / Codex

## Summary

This pass turns AgentOS contract-chain copy into live mission consequences. Bound faction missions now carry deterministic route-pressure parameters for reward, timer, and Heat outcome, and the `/missions` contract strip exposes the compact route summary before the player accepts the contract.

SuperDesign was used first per project rules:

- Project: `CyberTrader v6 AgentOS Route Consequences`
- Project URL: `https://app.superdesign.dev/teams/cbf9e40e-5180-4061-94e7-aa2571efe072/projects/ec4dca81-d196-4656-9287-5e20e26fcc48`
- Draft generation was blocked by `insufficient_credits`, so implementation followed the existing `.superdesign/design-system.md` AgentOS contract-chain direction and the current `nyx-p1-005` mission strip pattern.

## Player-Facing Changes

- Each AgentOS contract stage now owns a route-pressure profile:
  - reward multiplier
  - timer multiplier
  - Heat delta on success
  - Heat delta on failure
- Generated faction missions inherit the active contact reputation tier, so higher-standing Blackwake / Null Crown work gets tighter timers and stronger Heat pressure, while Free Splinters / Archivists routes can soften Heat when completed cleanly.
- `/missions` now shows a third compact line in the contract strip:
  - `ROUTE // <label> // REWARD <delta> // TIMER <delta> // HEAT <success>/<fail>`
- Completed or failed mission route pressure is applied through the active Authority boundary:
  - `LocalAuthority.applyMissionPressure` persists the Heat delta into snapshots.
  - `SupabaseAuthority.applyMissionPressure` uses the existing resource RPC path when the flagged authority is enabled.
- Route-pressure notifications describe the settled/spiked Heat effect without implying real money, prizes, wallet signing, or regulated trading.

## Validation

- `npm test -- --runInBand engine/__tests__/factions.test.ts engine/__tests__/mission-generator.test.ts authority/__tests__/local-authority.test.ts`
- `npm run safety:autonomous`
- `npm run typecheck`
- `npm run regression:check`
- `npm run qa:smoke`
- `npm run build:web -- --clear`
- `npm run qa:axiom:live`

Full ship-loop validation is recorded in the matching Dev Lab automation run note after the final checks complete.
