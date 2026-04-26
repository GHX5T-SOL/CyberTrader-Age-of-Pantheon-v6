# talon-p0-002 - Autonomous Safety Rails

Date: 2026-04-26
Owner: Talon

## Scope

This pass hardens the v6 direct-push automation path so Zara, Zyra, Codex, and future OpenClaw executors can make bounded commits without requiring human review for every safe task.

The rail stays local and reversible. It does not touch credentials, signing material, Supabase production data, wallet state, remote EAS builds, store submission, on-chain execution, or real-money actions.

## Implemented Guardrails

- Added `npm run safety:autonomous`.
- Added `npm run ship:check`.
- Added a static preflight at `scripts/check-autonomous-safety.mjs`.
- The preflight scans the current unpushed commit range when the branch is ahead of upstream.
- If there are no unpushed commits, it scans staged, unstaged, and untracked files.
- Findings report only file paths and rule names. Diff contents and suspected secret values are never printed.

## Blocked By The Preflight

| Rail | Blocked evidence |
| --- | --- |
| No secret files | New `.env` files, mobile signing files, keystores, private keys, and platform secret config files. |
| No committed secrets | Concrete secret-style assignments for service-role keys, private keys, seed phrases, signing keys, keystore passwords, or store API keys. |
| No force pushes | Added code/config commands that call force push variants. |
| No destructive reset | Added code/config commands that call hard reset. |
| No unsafe dependency remediation | Added code/config commands that call forced audit remediation. |
| No autonomous store credentials path | Added code/config commands that call remote EAS build or submit. |
| No on-chain execution | Added code/config transaction send/sign actions. |

Docs can still describe the release rules, blockers, and escalation paths. The command scan intentionally targets code/config files, while secret-file and secret-assignment checks still cover changed files broadly.

## Required Direct-Push Sequence

Autonomous v6 agents must use this sequence before pushing implementation commits:

```bash
git pull --ff-only --no-rebase
npm run ship:check
git push
```

For Dev Lab planning changes in the same run, the matching control-plane check remains:

```bash
cd web
npm run typecheck
npm run build
```

If any required check fails, the agent must stop, leave the task unpushed, and record a blocker in the Dev Lab status truth.

## Human-Review Triggers

Ghost review is still required before:

- Dependency upgrades that alter Expo, React Native, Supabase, storage, auth, EAS, or build behavior.
- Remote EAS build or submit commands that require Apple, Google, or Expo credentials.
- Any wallet, token, transaction, signing, or real-money flow.
- Production data migration, deletion, reset, or RLS policy changes.
- Any bypass of `npm run ship:check`.

## Validation

Required validation for this task:

- `npm run safety:autonomous`
- `npm run typecheck`
- `npm test -- --runInBand`
- `npm run build:web`
- Dev Lab `web` typecheck and build after planning truth updates.

Current run result on 2026-04-26:

- `npm run ship:check` passed, including `safety:autonomous`, TypeScript, Jest, and Expo web export.
- Dev Lab `web` typecheck and build passed after task/status/roadmap sync.

## Follow-Ups

- `talon-p1-003`: add the rollback and incident protocol for bad autonomous commits.
- `axiom-p1-004`: add the repeatable intro/login/trading/settings smoke route.
- `ghost-p1-004`: continue daily review of autonomous commits until the release branch stabilizes.
