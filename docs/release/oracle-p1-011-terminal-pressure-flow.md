# oracle-p1-011 Terminal Pressure Flow

Date: 2026-04-29
Owner: Oracle

## Summary

The terminal now wires the `oracle-p1-010` faction-pressure contracts into live play. Bound AgentOS factions generate deterministic 8-tick pressure windows from their aligned contact reputation, and the S1LKROAD ticket shows the current window before the buy/sell controls.

## Player Surface

- `PRESSURE WINDOW` strip appears inside `/terminal` when a faction is bound.
- The strip shows faction, reputation tier, supported/suppressed ticker, basis-point intensity, Heat posture, and expiry tick.
- The ticket summary adds a `LIMIT TRIGGER` preview with the current side, limit price, lot size, and remaining window.
- Players without a bound faction see a compact locked AgentOS pressure message rather than a dead control.

## Engine Notes

- `engine/terminal-pressure.ts` derives pressure reputation from aligned NPC contacts.
- Market repricing now applies the same deterministic faction-pressure window after location, district, and flash-event modifiers.
- The UI still previews limit triggers only. It does not create off-authority orders or mutate LocalAuthority outside the existing buy/sell path.

## SuperDesign

- Project: `CyberTrader v6 terminal pressure command flow`
- Project URL: `https://app.superdesign.dev/teams/cbf9e40e-5180-4061-94e7-aa2571efe072/projects/5644c939-eaa3-4b19-91f1-e3819f1cab59`
- Current terminal reproduction draft: `3973e1de-23d5-4242-9c8f-431409e153f1`
- Preview URL: `https://p.superdesign.dev/draft/3973e1de-23d5-4242-9c8f-431409e153f1`
- Branch iteration was blocked by SuperDesign account credits, so implementation stayed within the existing terminal/AgentOS design-system constraints.

## Validation

- `npm test -- engine/__tests__/terminal-pressure.test.ts engine/__tests__/limit-orders.test.ts --runInBand`
- `npm run typecheck`
- `npm run ship:check` (safety scan, typecheck, 178/178 Jest tests in 36 suites, Expo web export)
- `npm run qa:smoke`
- `npm run build:web -- --clear`
