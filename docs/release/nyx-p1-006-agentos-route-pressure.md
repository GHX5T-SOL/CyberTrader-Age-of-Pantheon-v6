# nyx-p1-006 / oracle-p1-012 - AgentOS Route Pressure

## Outcome

AgentOS contract chains now do more than describe route consequences. Each faction contract stage carries a serializable route-pressure effect that adjusts live generated missions:

- Mission reward multiplier for fictional `0BOL` payouts.
- Mission timer multiplier for safer lanes, timed hauls, and blind-spot windows.
- Heat delta on mission success or failure.
- Compact route-pressure summary for mission banners and contact rows.

This completes the next AgentOS follow-up from the Dev Lab task map: route-map consequences and deeper live mission pressure hooks after `nyx-p1-005`.

## Player-Facing Behavior

- Free Splinters and Archivists lean safer: longer timers, lower Heat on clean runs, smaller reward bumps.
- Blackwake and Null Crown lean sharper: higher reward pressure, tighter timers, and stronger Heat consequences.
- `/missions` now shows the route modifier inside the existing compact contract strip:
  - `ROUTE // HOT CARGO // REWARD +11% // TIMER -14% // HEAT +3/+5`
- Mission completion/failure now applies the configured Heat pressure through `LocalAuthority`, then emits in-world feedback such as `Route pressure settled` or `Route pressure spiked`.

## Store Safety

The copy remains fictional and local-mode safe. It refers to missions, routes, Heat, timers, reputation, and `0BOL` only as in-game systems. It does not introduce wallet, real-money, investment, staking, yield, prize, cash-out, or regulated-market claims.

## Implementation Notes

- `engine/types.ts` adds `FactionRoutePressure`, route-pressure fields on `FactionContractStage` / `FactionContractSignal`, optional mission pressure fields, and optional `Authority.applyMissionPressure`.
- `engine/factions.ts` defines deterministic pressure tables for every launch faction stage and a shared `getFactionRoutePressureSummary` formatter.
- `engine/mission-generator.ts` applies route pressure when creating faction missions while keeping missions serializable.
- `authority/local-authority.ts` persists mission Heat deltas in local authority snapshots.
- `state/demo-store.ts` applies mission Heat pressure on completion/failure before the normal Heat warning and bounty feedback pass.
- `components/mission-banner.tsx` renders route pressure in the existing contract strip without adding new colors or layout primitives.
- `qa/axiom-web-regression.spec.ts` now clears local browser state and re-enters demo sessions through the real intro-to-login path, removing flaky serial direct-login reset behavior found during verification.

## Validation

- `npm test -- --runInBand engine/__tests__/factions.test.ts engine/__tests__/mission-generator.test.ts authority/__tests__/local-authority.test.ts`
- `npm run typecheck`
- `npm run ship:check` (safety scan, typecheck, 181/181 Jest tests in 37 suites, Expo web export)
- `npm run build:web -- --clear`
- `npm run qa:axiom` (11/11)
- `npm run qa:responsive` (4/4)
