# axiom-p1-003 - Performance Budgets

Status: Complete
Owner: Axiom
Date: 2026-04-28

## Scope

This pass defines the first launch-performance budget set for CyberTrader v6 and adds a repeatable web-export budget check. Native cold-start and memory numbers still require the `axiom-p0-001` simulator/emulator pass because this machine does not expose Xcode `simctl`, Android Emulator, or `adb`.

## Enforced Web Budgets

Run:

```bash
npm run perf:budgets
```

The command rebuilds the Expo web export and runs `scripts/check-performance-budgets.mjs`.

| Budget | Limit | Current owner |
| --- | ---: | --- |
| Web export total | <= 30 MiB | Axiom / Rune |
| Main web JS raw | <= 2.8 MiB | Rune / Vex |
| Main web JS gzip | <= 700 KiB | Rune / Vex |
| Intro cinematic media | <= 24 MiB | Reel / Palette |
| Optimized active art | <= 1.5 MiB | Palette / Zara |

Any miss exits non-zero and prints the owner pair responsible for triage.

## Native Budgets For Gate B

These are the required targets for the first iOS Simulator and Android Emulator QA pass:

| Area | Target | Owner for misses | Measurement path |
| --- | ---: | --- | --- |
| Cold launch to first visible CyberTrader shell | p50 <= 2.5s, p95 <= 4.0s | Rune / Axiom | Release-preview simulator/emulator run with screen-record or native timing log |
| Warm resume to interactive home/terminal | p95 <= 1.2s | Rune / Axiom | Background/foreground cycle during native QA |
| Trade command feedback latency | p95 <= 150ms | Rune / Vex | Buy/sell tap to visible feedback using Axiom route |
| Menu route transition latency | p95 <= 300ms | Rune / Vex | Home -> terminal -> inventory -> settings route sweep |
| iOS resident memory during first-session path | p95 <= 350 MB | Rune / Axiom | Xcode Instruments or `xcrun simctl spawn booted log` evidence |
| Android total PSS during first-session path | p95 <= 450 MB | Rune / Axiom | `adb shell dumpsys meminfo ai.cybertrader.app` evidence |
| Runtime console/error budget | 0 raw runtime errors | Rune / Axiom | Existing diagnostics bridge plus Axiom native notes |

## Validation

Local validation for this pass:

```bash
npm run perf:budgets
npm run typecheck
npm test -- --runInBand
npm run build:web
```

`npm run perf:budgets` is intentionally web-only. The native budget rows become pass/fail evidence during `axiom-p0-001`, once the QA host has Xcode and Android tooling available.
