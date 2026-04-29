# oracle-p1-011 - Terminal Limit-Order Command Flow

Date: 2026-04-29
Owner: Oracle / Nyx / Vex
Status: Complete

## Summary

The deterministic `oracle-p1-010` limit-order and faction-pressure contracts are now wired into the live `/terminal` command surface.

Players can keep using immediate market BUY/SELL commands, or switch the terminal into LIMIT mode, set a trigger price, and arm one open limit order per ticker/side. The order queue persists with the local session, can be cancelled from the terminal, expires after 12 ticks, and resolves on manual or background market ticks by rechecking Energy, Heat, 0BOL, holdings, travel locks, district locks, and blackout state at fill time.

## SuperDesign

- Project: `CyberTrader v6 Terminal Limit Orders`
- Project URL: `https://app.superdesign.dev/teams/cbf9e40e-5180-4061-94e7-aa2571efe072/projects/d6bdee8a-9d86-4685-9130-3657395e17c2`
- Current-state draft: `b310cfdb-95ac-4bf6-b6bc-1a77d69a770b`
- Implemented branch: `0522b707-41bf-4bf3-82f0-1671758fca49`
- Preview URL: `https://p.superdesign.dev/draft/0522b707-41bf-4bf3-82f0-1671758fca49`

## What Changed

- `state/demo-store.ts` now persists `LimitOrder[]`, arms/cancels terminal limit orders, and resolves open orders on market ticks through the existing deterministic limit-order helper contracts.
- `/terminal` now has a compact AgentOS limit-order module with MARKET/LIMIT mode, trigger price input, expiry copy, faction pressure hint, cancel action, open/recent order rail, and last-fill feedback.
- Home and terminal market surfaces now use compact deck section headers and market tape column labels to reduce generic-dashboard feel without changing route structure.
- `state/demo-storage.ts` persists armed limit orders with the rest of the LocalAuthority session state.

## Store-Safety Notes

- No real-money, wallet, staking, investment, yield, prize, or cash-out language was added.
- Limit orders are fictional local gameplay commands; no funds are reserved and no on-chain or external market action occurs.
- Fill copy makes the local recheck explicit: Energy, Heat, 0BOL, and holdings are validated at fill time.

## Validation

- `npm run typecheck`
- `npm run limit-orders:check`
- `npm run ship:check` (safety scan, typecheck, 178/178 Jest tests in 36 suites, Expo web export)
- `npm run qa:smoke`
- `npm run build:web -- --clear`
- `npm run qa:axiom` (11/11 Playwright checks)
- `npm run qa:responsive` (4/4 responsive captures)
