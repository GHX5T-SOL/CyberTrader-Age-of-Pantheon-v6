# talon-p1-003 - Rollback and Incident Protocol

Date: 2026-04-26
Owner: Talon / Zyra (ops)

## Scope

This protocol covers how to detect, classify, and recover from bad autonomous commits,
broken web deployments, and future native build regressions in CyberTrader v6.

It is the companion document to `talon-p0-002-autonomous-safety-rails.md` and fulfills
the Gate C prerequisite in `ghost-p0-001-release-authority.md`.

No rollback action in this protocol requires credentials, signing material, production
data deletion, or on-chain transactions. All recovery paths stay reversible and local
unless explicitly noted.

---

## 1. Severity Tiers

| Tier | Condition | Response SLA |
|------|-----------|--------------|
| **P0** | Live deployment down (non-200), secret committed, negative balance in engine, on-chain action executed | Immediate — stop autonomous runs, revert, escalate to Ghost |
| **P1** | Typecheck or Jest failure on `main`, visible regression on a Gate A route, bad commit merged without passing `ship:check` | Within one autonomous loop cycle — revert, run checks, push revert |
| **P2** | Flaky test (passes on retry), non-breaking quality regression, new npm advisory opened | Log in Dev Lab — fix forward in the next run, no immediate rollback |

---

## 2. Bad Commit Detection Signals

Run these checks to detect a bad commit before or after it lands on `main`:

```bash
# Full ship check (safety scan + typecheck + tests + web export)
npm run ship:check

# Fast health probe against live Vercel deployment
npm run health:live

# Jest alone for a quick regression signal
npm test -- --runInBand
```

A commit is confirmed bad when **any** of the following is true:

- `npm run health:live` returns a non-200 status or is missing the `CyberTrader` title marker.
- `npm run typecheck` exits non-zero.
- `npm test -- --runInBand` reports any test failure.
- `npm run safety:autonomous` reports a secret file, secret assignment, force-push, or on-chain action.
- The Vercel deployment preview URL shows a blank screen or hard error on any Gate A route (`/boot`, `/handle`, `/terminal`, `/market`).

---

## 3. Web Deployment Rollback (Vercel)

Vercel keeps every deployment immutable. Rolling back means promoting a previous
known-good deployment to production — no code deletion needed.

### Via Vercel Dashboard

1. Open `https://vercel.com` and navigate to the `CyberTrader-Age-of-Pantheon-v6` project.
2. Click **Deployments** in the left sidebar.
3. Identify the last deployment with status **Ready** that predates the incident.
4. Click the three-dot menu on that deployment → **Promote to Production**.
5. Confirm. The live URL reverts in under 60 seconds.
6. Run `npm run health:live` locally to confirm the live check is green again.

### Via Vercel CLI (if dashboard is unavailable)

```bash
# List recent deployments to find the known-good URL
npx vercel ls

# Promote a specific deployment by URL
npx vercel promote <deployment-url> --prod
```

No credentials for Vercel should be committed. The CLI uses the logged-in Vercel account
on the Mac mini.

---

## 4. Git Rollback (Bad Commit on `main`)

Never use `git push --force` on `main`. Create a revert commit instead:

```bash
# Identify the bad commit SHA
git log --oneline -10

# Create a revert commit
git revert <bad-commit-sha> --no-edit

# Run the full check path before pushing the revert
npm run ship:check

# Push the revert (this is a normal forward push, not a force push)
git push
```

The revert commit message should follow the task-ID convention:

```
revert(<task-id>) zyra: revert bad autonomous commit <bad-commit-sha>

Reverts: <bad-commit-sha>
Reason: [typecheck failure | test regression | secret exposure | health probe fail]
```

If multiple commits need reverting, revert them individually from newest to oldest so
each revert has a clean, auditable history.

---

## 5. Native Build Rollback (Gate B and beyond)

Native rollback paths apply once EAS preview/internal builds are active.

### TestFlight (iOS)

- Open App Store Connect → TestFlight → Builds.
- Locate the last known-good build by version/build number.
- Testers automatically receive the new build; App Store Connect does not expose a
  "rollback to previous build" button. Instead, stop the bad build's distribution:
  - Select the bad build → **Expire Build** (removes it from all testers).
  - The previous build remains available to testers who already installed it.
- For internal distribution: re-submit the known-good build via EAS if it was not
  expired.

### Play Internal Testing (Android)

- Open Play Console → Internal Testing → Releases.
- Click **Create new release** and upload the known-good `.aab`.
- Do not use "Roll back" unless Play Console explicitly offers it for the track.
- Internal testing releases do not affect production users.

### EAS Build Re-submission

EAS builds are immutable. To re-promote a prior build:

```bash
# List prior builds for the channel
eas build:list --channel internal --platform ios

# Submit an existing build (by build ID) instead of triggering a new one
eas submit --platform ios --id <known-good-build-id>
```

All EAS commands that submit remotely require credentials. These are not autonomous
actions — they require Ghost approval before execution per `ghost-p0-001-release-authority.md`.

---

## 6. Escalation Protocol

| Tier | Who to notify | Where to write the blocker |
|------|--------------|---------------------------|
| P0 | Ghost (immediate), Zoro if store assets are affected | Dev Lab `docs/automation-runs/<run-id>-<agent>-blocked.md` + `TASKS.md` top-line blocker |
| P1 | Ghost (within one autonomous cycle) | Dev Lab `docs/automation-runs/<run-id>-<agent>-blocked.md` |
| P2 | Log in Dev Lab `TASKS.md` notes | No immediate escalation |

The escalation channel is the Dev Lab TASKS.md blocker note and the `docs/automation-runs/`
ledger. Ghost is the single release authority and the final decision-maker for any
revert affecting Gate A, B, or C.

---

## 7. Autonomous Agent Obligations

An autonomous agent (Zara, Zyra, or any future executor) **must stop and log a blocker**
instead of pushing when:

- `npm run ship:check` exits non-zero on the working branch.
- `npm run health:live` returns non-200 after a push.
- The agent detects that its own previous commit caused a test or health regression.

After detecting a regression caused by a prior commit:

1. Run `git revert <bad-sha> --no-edit`.
2. Run `npm run ship:check` on the revert commit.
3. If checks pass: push the revert commit with the standard task-ID format.
4. Write a blocker note in `docs/automation-runs/<run-id>-<agent>-blocked.md` with:
   - What the bad commit did.
   - What the revert restores.
   - What checks now pass.
   - What the next action should be.
5. Update `TASKS.md` to reflect the blocked state.

The agent must not attempt to re-implement the failed work in the same run that triggered
the rollback.

---

## 8. Post-Incident Documentation

For every P0 or P1 incident, create a dated note in Dev Lab `docs/automation-runs/`:

```
docs/automation-runs/<YYYYMMDDTHHMMSSZ>-<agent>-incident.md
```

The note must include:

- **Run ID** — the agent run that caused or detected the incident.
- **Incident tier** — P0 or P1.
- **Detection signal** — which check failed and what the exact output was.
- **Commits affected** — the bad commit SHA(s).
- **Recovery action** — what was reverted or promoted.
- **Checks passing post-recovery** — output of `npm run ship:check` and `npm run health:live`.
- **Root cause** — what the agent did wrong (missing check, bad assumption, etc.).
- **Prevention** — what guardrail would have caught this earlier.

---

## 9. Validation

This is a documentation-only task. No code was changed.

Current check results on 2026-04-26 (run `20260426T174449Z-zyra`):

```
npm run typecheck      → pass (no output)
npm test -- --runInBand → 73/73 tests, 23 suites
npm run health:live    → HTTP 200, Vercel cache HIT
```

---

## Follow-Ups

- `talon-p1-004`: Add automated detection of CI-style test regression as a post-push
  Vercel webhook or launchd monitor (requires Mac mini cron/webhook setup).
- `axiom-p1-004`: Add the repeatable intro/login/trading/settings smoke route that runs
  as part of the post-deploy health signal.
- `ghost-p1-004`: Continue daily review of autonomous commits until the release branch
  stabilizes, with specific attention to revert commit quality.
