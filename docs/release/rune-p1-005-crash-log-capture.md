# rune-p1-005 - Crash and Log Capture Hooks

**Completed:** 2026-04-28  
**Agent:** Rune / Codex automation  
**Depends on:** axiom-p0-002

---

## Summary

Adds a local runtime diagnostics layer for TestFlight and Play Internal Testing preparation. The app now captures runtime exceptions, unhandled promise rejections, and console errors into a bounded in-memory buffer, with current route/session context attached for QA.

No external telemetry service is introduced. Diagnostics stay local unless a tester explicitly exports the report from the debug bridge.

---

## Deliverables

### `state/runtime-diagnostics.ts`

- Installs web `error` and `unhandledrejection` listeners.
- Installs the React Native global error handler when `ErrorUtils` is available.
- Wraps `console.error` so critical logs are captured alongside thrown exceptions.
- Keeps only the latest 20 diagnostic entries to avoid runaway local logs.
- Redacts credential-shaped values before storage or export.

### Root app wiring

`app/_layout.tsx` installs diagnostics once and supplies safe QA context:

- current route
- platform
- demo phase and active terminal view
- tick and Heat
- balance band, not exact wallet/account identifiers
- selected ticker
- booleans for handle/player presence, without storing the handle or player id
- hydration state

### QA export bridge

When the app boots, diagnostics are exposed on:

```ts
globalThis.__CYBERTRADER_QA_DIAGNOSTICS__
```

Useful debug-console methods:

| Method | Purpose |
|---|---|
| `getSnapshot()` | Return the current diagnostic object |
| `formatReport()` | Return a pretty JSON report for QA attachment |
| `record(message)` | Add a manual QA marker |
| `clear()` | Clear the local diagnostics buffer |

---

## Privacy and Store-Safety Notes

- No secrets, credentials, wallet addresses, player ids, or raw handles are intentionally recorded.
- Query-string credentials and common token/header shapes are redacted before storage.
- The report is local-only and suitable for attaching to a QA ticket during internal testing.
- This is a launch-safe hook layer, not a replacement for a future approved crash-reporting vendor decision.

---

## Validation

| Check | Result |
|---|---|
| Runtime diagnostics Jest coverage | 5/5 focused tests pass |
| `npm run safety:autonomous` | PASS |
| `npm run typecheck` | PASS |
| `npm test -- --runInBand` | 123/123 tests, 28 suites - PASS |
| `npx expo export --platform web` | PASS |
