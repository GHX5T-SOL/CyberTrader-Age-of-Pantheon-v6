# kite-p1-003 - Supabase Authority Migrations

Date: 2026-04-28
Owner: Kite

## Summary

This pass prepares the launch Supabase schema for the flagged `SupabaseAuthority` path without requiring live project credentials. LocalAuthority remains the default launch mode.

Added files:

- `supabase/migrations/20260428183000_kite_p1_003_authority_schema.sql`
- `supabase/rollbacks/20260428183000_kite_p1_003_authority_schema.sql`
- `authority/__tests__/supabase-migrations.test.ts`

## Schema Coverage

The migration creates the authority tables required by the current adapter contract:

- `players`
- `resources`
- `commodities`
- `market_prices`
- `positions`
- `ledger_entries`
- `trades`
- `market_news`
- `authority_events`

The commodity catalog is seeded from the in-app launch commodities, including `VBLM` as the starter stabilizer commodity.

## Write Boundary

Player-owned reads are protected with RLS policies tied to `auth.uid()`. Direct client writes are deliberately narrow:

- `players` allows only owner profile/location update columns.
- `resources`, `positions`, `ledger_entries`, `trades`, and `authority_events` are read-only to authenticated clients.
- authoritative writes are routed through `bootstrap_dev_player`, `add_xp`, `set_player_resources`, or future Edge Functions such as `trade-execute` and `energy-purchase`.

`SupabaseAuthority.updateXp()` and `SupabaseAuthority.updateResources()` now use RPCs instead of direct table updates so the adapter matches the migration boundary.

## Rollback

The rollback script drops the functions and tables created by this migration. It is destructive and intended for disposable preview databases or backed-up environments only. Production rollback should prefer forward fixes or targeted policy/function replacement.

## Validation

Local validation:

- `npm test -- --runInBand authority/__tests__/supabase-migrations.test.ts`
- `npm run typecheck`
- `npm run ship:check`

Live Supabase validation remains pending until a project URL and anon key are provided through the existing feature-flagged config path.
