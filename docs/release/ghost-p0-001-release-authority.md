# ghost-p0-001 - Release Authority Bar

Date: 2026-04-26
Owner: Ghost

## Scope

This note sets the technical release bar for CyberTrader v6 and defines when autonomous agents may push directly to `main`.

The app remains a fictional, simulated trading game. No task in this release plan may perform on-chain actions, real-money actions, credential changes, or production data deletion.

## Current Release Authority

Ghost owns final technical release authority for:

- Reliable Demo gate acceptance.
- Native Internal Testing readiness.
- Store Candidate readiness.
- Automation direct-push rules.
- Release rollback approval after a bad autonomous commit.

Zoro owns creative/store-presentation approval. Cipher and Kite own legal/security escalation inputs. Axiom and Rune own QA/build evidence. Oracle and Nyx own economy tuning evidence.

## Release Blockers

These issues block store submission until resolved or explicitly deferred by Ghost in the Dev Lab task map:

| Area | Blocker | Required Evidence |
| --- | --- | --- |
| Web demo | Production web smoke must cover intro, login, terminal, buy, sell, inventory, profile, and settings. | Axiom QA note or automated smoke output. |
| Native runtime | iOS simulator and Android emulator smoke runs are pending. | Simulator/emulator logs plus screenshots or a QA report. |
| Persistence | Cold-launch native hydration still needs simulator/device validation. | Rune/Axiom validation note referencing storage reset and corrupt-data recovery. |
| SupabaseAuthority | LocalAuthority-only launch scope is accepted; online authority remains deferred. | `ghost-p1-005` scope decision plus future live RLS/privacy/native evidence before enabling SupabaseAuthority in a submitted build. |
| Store policy | Privacy, simulated trading, token naming, age rating, and support URL copy are not ready. | Cipher/Kite policy matrix and final store copy. |
| Assets | Screenshots, preview video, icon/splash, and ownership notes are incomplete. | Zoro/Palette/Reel approval notes and asset manifest. |
| Dependency audit | Expo toolchain transitive advisories remain open. | Planned Expo SDK/override decision with passing checks after remediation or explicit risk acceptance. |
| Automation safety | Direct pushes must stay reversible and test-backed. | Commit includes task ID, checks pass, and Dev Lab truth is updated when status changes. |

## Direct-To-Main Automation Criteria

Autonomous agents may push directly to `main` only when all criteria are true:

- The work maps to a task in the Dev Lab App Store readiness board, or is a directly necessary follow-up to keep that board truthful.
- The change is scoped, reversible, and avoids credentials, signing material, production data, real money, and on-chain execution.
- The agent runs `git pull --ff-only` before editing each touched repo.
- The commit message includes the task ID and owner.
- Code changes pass `npm run typecheck`, `npm test -- --runInBand`, and `npx expo export --platform web` in the v6 repo unless Ghost has documented a narrower check path for that task type.
- Dev Lab planning data changes pass `cd web && npm run typecheck && npm run build`.
- Status changes update `TASKS.md`, `web/src/data/tasks.ts`, `docs/V6-App-Store-Readiness-Task-Map.md`, `docs/Roadmap.md`, `web/src/data/roadmap.ts`, and `web/src/data/status.ts`.
- The agent stops and records a blocker instead of pushing when a required check fails.

Allowed direct-push examples:

- Focused deterministic engine tests and tuning patches.
- Route, persistence, and QA harness fixes with passing checks.
- Release docs that update task truth and pass Dev Lab web checks.
- Reversible safety-rail improvements that do not touch secrets or production data.

Blocked without Ghost review:

- Dependency upgrades that change Expo, React Native, EAS, Supabase, auth, storage, or build tooling behavior.
- Any signing, Apple, Google, Supabase, or wallet credential operation.
- Any remote EAS build that requires credentials not already configured.
- Any on-chain, token, wallet, or real-money action.
- Destructive data deletion or reset outside local test fixtures.

## Gate Sign-Off

### Gate A - Reliable Demo

Ghost may approve Gate A after:

- `npm run typecheck`, `npm test -- --runInBand`, and `npx expo export --platform web` pass.
- Production web smoke completes the first loop without guidance.
- No blank screens, route dead ends, raw runtime errors, or clipped critical text remain on the checked paths.
- Economy replay reports 0 soft locks and 0 impossible states for the launch baseline.
- First-session design and creative issues are either fixed or tracked as non-blocking.

### Gate B - Native Internal Testing

Ghost may approve Gate B after:

- EAS profiles exist for simulator, internal, store, and production builds.
- iOS simulator and Android emulator smoke runs pass.
- Cold-launch persistence, reset clearing, and corrupt storage recovery are validated on native runtime.
- Crash/log capture is available without printing secrets.
- SupabaseAuthority stays feature-flagged off for launch builds unless a later reviewed online-authority pass proves live RLS, privacy, and native runtime evidence.

### Gate C - Store Candidate

Ghost may approve Gate C after:

- Store metadata, privacy copy, age-rating notes, support URL, screenshots, icon/splash, and preview video are ready.
- Legal/security review covers simulated trading, `0BOL` naming, wallet flags, privacy, and non-custodial boundaries.
- Regression checklist passes across Web, iOS simulator, and Android emulator.
- Dependency advisory handling is documented.
- Rollback and incident protocol is ready for the release branch.

## Validation

This is a documentation-only release authority update. Required validation for this pass:

- Dev Lab planning sync must pass `cd web && npm run typecheck && npm run build` after the linked task status changes.
- v6 code checks are unchanged by this document, but future code tasks remain bound to the full v6 check path above.

## Follow-Ups

- Axiom: create the store-submission regression checklist and automated smoke path.
- Rune/Axiom: run iOS simulator and Android emulator validation.
- Ghost/Kite: keep SupabaseAuthority deferred until live RLS, privacy, and native evidence are ready.
- Cipher/Kite: finish store policy and legal/security review.
- Talon: expand the rollback and incident protocol for autonomous commits.
