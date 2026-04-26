# talon-p1-004 — Automated Post-Push Regression Detection

**Completed:** 2026-04-27  
**Agent:** Zyra — OpenClaw QA (run 20260426T222020Z)  
**Depends on:** talon-p0-002 (safety rails), talon-p1-003 (rollback protocol), zyra-p0-002 (health:live)

---

## Summary

Implements a Node.js regression-monitor script (`scripts/regression-monitor.mjs`) that detects new commits on `origin/main` and automatically runs the regression suite (`typecheck + jest + health:live`). A launchd plist template is included for installation on the Mac mini so every 15-minute tick catches regressions before the next autonomous agent run.

---

## Deliverables

### `scripts/regression-monitor.mjs`

Stateful regression monitor. Persists last-checked commit in `.git/regression-state.json` (not tracked).

**Two modes:**

| Invocation | Behaviour |
|---|---|
| `node scripts/regression-monitor.mjs` | Monitor mode — runs suite only if `origin/main` has advanced since last check |
| `node scripts/regression-monitor.mjs --force` | Force mode — always runs the full suite |

**Regression suite steps:**

| Step | Command | Gate |
|---|---|---|
| typecheck | `npm run typecheck` | TypeScript compiler — 0 errors |
| jest | `npm test -- --runInBand --forceExit` | All suites green |
| health:live | `npm run health:live` | HTTP 200, Vercel markers present |

**Output:** JSON to stdout. Exit 0 on pass or skip; exit 1 on regression or upstream error.

**State file:** `.git/regression-state.json` — records `lastCheckedCommit`, `lastRunAt`, and the last result payload. Reset by deleting the file.

### `scripts/launchd/com.cybertrader.v6.regression-monitor.plist.template`

LaunchAgent plist template for the Mac mini. Fires every 900 seconds (15 min). Instructions embedded in the file:

1. Copy to `~/Library/LaunchAgents/` (drop the `.template` suffix).
2. Replace `REPLACE_NODE_PATH` with `which node` output.
3. Replace `REPLACE_REPO_ROOT` with the absolute checkout path.
4. Replace `REPLACE_LOG_DIR` with a log directory (e.g. `~/Library/Logs/cybertrader`).
5. `launchctl load ~/Library/LaunchAgents/com.cybertrader.v6.regression-monitor.plist`

### `package.json` additions

```
"regression:check"   → node scripts/regression-monitor.mjs --force   (manual full run)
"regression:monitor" → node scripts/regression-monitor.mjs            (monitor/skip mode)
```

---

## Integration with Incident Protocol

Connects directly to `talon-p1-003` rollback/incident protocol:

- A non-zero exit triggers P0/P1 detection signals: typecheck failure, jest regression, or health:live non-200.
- The Mac mini launchd log (`regression-monitor.log`) is the first signal source for the incident checklist.
- The autonomous agent (Zyra/Zara) should run `npm run regression:check` and log the result to `docs/automation-runs/` before committing or pushing.

---

## Validation

| Check | Result |
|---|---|
| `npm run typecheck` | Clean — PASS |
| `npm test -- --runInBand` | 109/109 tests, 26 suites — PASS |
| `npm run regression:check` (force mode) | typecheck ✓, jest ✓, health:live HTTP 200 Vercel HIT ✓ — OK |
| Monitor mode (no new commits) | `skipped: true` — correct skip behaviour confirmed |

---

## Remaining Work

- **Mac mini installation** (Talon/admin): fill in the plist template and `launchctl load` it; verify the 15-minute timer fires.
- **talon-p1-005 (future)**: webhook-based detection (GitHub Actions or Vercel deploy hook → Mac mini endpoint) for sub-minute detection latency vs the current 15-minute polling window.
