# kite-p0-001 SupabaseAuthority Flag Boundary

Date: 2026-04-26
Owner: Kite

## Summary

`SupabaseAuthority` is implemented as a launch-safe adapter behind an explicit feature flag. `LocalAuthority` remains the default authority path for the playable demo and is selected whenever Supabase is disabled or the public URL/anon key are missing.

## Runtime Selection

- Default: `LocalAuthority`.
- Supabase authority: set `EXPO_PUBLIC_USE_SUPABASE_AUTHORITY=true`, `EXPO_PUBLIC_SUPABASE_URL`, and `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
- Legacy/client-only Supabase: `EXPO_PUBLIC_USE_SUPABASE=true` still enables the Supabase client. Set `EXPO_PUBLIC_USE_SUPABASE_AUTHORITY=false` to keep the authority local while using the client for non-authority reads.
- Server-side aliases are supported for local tools: `USE_SUPABASE_AUTHORITY`, `USE_SUPABASE`, `SUPABASE_URL`, and `SUPABASE_ANON_KEY`.

No service-role key, wallet private key, or project secret is required in the app bundle.

## Adapter Contract

`SupabaseAuthority` implements the shared `Authority` interface for:

- profile bootstrap through `bootstrap_dev_player`,
- player/profile/resource reads from `players` and `resources`,
- open positions from `positions`,
- ledger history from `ledger_entries`,
- commodity and market news reads from `commodities`, `market_prices`, and `market_news`,
- trade execution through the `trade-execute` Edge Function,
- Energy purchase through the `energy-purchase` Edge Function,
- XP/rank updates through `add_xp`,
- wallet connection as dev identity only.

On-chain `$OBOL` remains feature-flagged off by default. The adapter can expose a configured balance read placeholder, but it does not sign transactions or perform real-money actions.

## RLS Baseline

The launch database must keep RLS enabled on all player-scoped tables. Required policy shape:

- `players`: authenticated users can select/update only rows linked to their dev identity or account binding.
- `resources`: authenticated users can select only their resource row; direct client updates should be blocked unless routed through a vetted RPC.
- `positions`: authenticated users can select only their open/closed positions; write access should be denied to direct clients.
- `ledger_entries`: authenticated users can select only their ledger rows; insert/update/delete should be denied to direct clients.
- `trades`: authenticated users can select only their trade rows; insert/update/delete should be denied to direct clients.
- `commodities`, `market_prices`, and `market_news`: public read is acceptable; writes stay server-only.

Authoritative state changes should go through SECURITY DEFINER RPCs or Edge Functions that validate player ownership, quantity bounds, balance, Energy, Heat, and inventory limits before writing.

## Verification

- `authority/__tests__/authority-config.test.ts` proves LocalAuthority is the default, incomplete Supabase config falls back to LocalAuthority, full flagged config selects SupabaseAuthority, and an explicit authority-off override keeps the local demo path active.
- Existing LocalAuthority tests continue to prove the local first trade loop, inventory caps, deterministic replay, and snapshot restore behavior.
