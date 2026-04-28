-- Rollback for kite-p1-003 SupabaseAuthority launch schema baseline.
--
-- Destructive by design: run only against disposable preview databases or after
-- a verified backup/export. Production rollback should prefer forward fixes or
-- targeted policy/function replacement.

drop function if exists public.set_player_resources(uuid, integer, integer, integer, integer, integer);
drop function if exists public.add_xp(uuid, integer);
drop function if exists public.bootstrap_dev_player(text, text);
drop function if exists public.cybertrader_rank_for_xp(bigint);

drop table if exists public.authority_events cascade;
drop table if exists public.trades cascade;
drop table if exists public.ledger_entries cascade;
drop table if exists public.positions cascade;
drop table if exists public.market_news cascade;
drop table if exists public.market_prices cascade;
drop table if exists public.commodities cascade;
drop table if exists public.resources cascade;
drop table if exists public.players cascade;
