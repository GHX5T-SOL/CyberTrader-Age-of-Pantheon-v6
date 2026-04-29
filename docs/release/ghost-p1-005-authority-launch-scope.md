# ghost-p1-005 - Authority Launch Scope Decision

Date: 2026-04-29
Owner: Ghost

## Decision

CyberTrader v6 first launch remains **LocalAuthority-only**.

`SupabaseAuthority` is code-complete enough to keep behind the existing feature flag, but it is not part of the first TestFlight, Play Internal Testing, or store-candidate scope until a later reviewed online-authority pass proves live project configuration, RLS behavior, privacy disclosures, retention/deletion handling, and native runtime behavior.

This decision does not submit builds, run remote EAS jobs, access Supabase secrets, perform on-chain actions, enable wallet features, or introduce real-money functionality.

## Accepted Feature-Flag Policy

- Default runtime authority: `LocalAuthority`.
- First launch environment: no `EXPO_PUBLIC_USE_SUPABASE_AUTHORITY=true` in submitted builds.
- SupabaseAuthority can be selected only when `EXPO_PUBLIC_USE_SUPABASE_AUTHORITY=true`, `EXPO_PUBLIC_SUPABASE_URL`, and `EXPO_PUBLIC_SUPABASE_ANON_KEY` are all configured.
- `EXPO_PUBLIC_USE_SUPABASE=true` can remain separate from authority selection; an explicit `EXPO_PUBLIC_USE_SUPABASE_AUTHORITY=false` keeps the gameplay authority local.
- No service-role key, signing secret, wallet private key, or production credential belongs in the app bundle or repo.

## Offline-First Behavior

The accepted first-launch path is:

1. Player claims a local Eidolon handle.
2. `LocalAuthority` creates the profile, resources, ledger, positions, missions, faction choice, and market state locally.
3. Demo state persists on the current device through the local storage adapter.
4. `CLEAR LOCAL DATA` remains the deletion/reset path.
5. Cross-device recovery, backend account recovery, server retention, and deletion requests are explicitly deferred until SupabaseAuthority is enabled in a later scope.

This keeps Gate A and the first native internal testing loop independent of live Supabase credentials and removes launch ambiguity: online authority is an enhancement track, not a blocker for the LocalAuthority store-candidate path.

## Evidence Already In Place

- `authority/__tests__/authority-config.test.ts` proves LocalAuthority is default, incomplete Supabase config falls back to LocalAuthority, and full flagged config selects SupabaseAuthority.
- `docs/release/kite-p0-001-supabase-authority.md` documents the adapter boundary and RLS baseline.
- `docs/release/kite-p0-002-launch-identity-recovery.md` documents the no-wallet/no-backend first identity model.
- `docs/release/kite-p1-004-store-safe-boundaries.md` documents the wallet/token and store-copy guardrails.
- `supabase/migrations/20260428183000_kite_p1_003_authority_schema.sql` and rollback SQL provide the future online-authority migration baseline.

## Deferred Online-Authority Gate

Before a build enables SupabaseAuthority, the team must attach evidence for:

- live Supabase project migration application and rollback readiness,
- RLS policy validation against a real project,
- App Privacy and Google Data Safety updates for backend identifiers and authority events,
- account recovery, retention, deletion, and support copy,
- native runtime smoke with SupabaseAuthority enabled,
- regression evidence proving LocalAuthority still works when SupabaseAuthority is disabled.

Until that evidence exists, SupabaseAuthority remains disabled for launch builds.

## Validation

This pass is a scoped authority-scope release decision with a small copy clarification. Required checks:

```bash
npm test -- authority/__tests__/authority-config.test.ts authority/__tests__/launch-identity.test.ts --runInBand
npm run typecheck
npm run ship:check
```
