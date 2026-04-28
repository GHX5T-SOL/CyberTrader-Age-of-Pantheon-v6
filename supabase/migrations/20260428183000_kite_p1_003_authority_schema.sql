-- kite-p1-003 - SupabaseAuthority launch schema baseline
--
-- Purpose:
-- - Create deterministic tables for player state, resources, positions, ledger,
--   trades, market data, and authority events.
-- - Keep LocalAuthority parity while preserving a safe RLS boundary.
-- - Route player-state mutations through SECURITY DEFINER RPCs or Edge
--   Functions instead of direct client writes.

create extension if not exists pgcrypto;

create or replace function public.cybertrader_rank_for_xp(p_xp bigint)
returns integer
language sql
immutable
as $$
  select case
    when greatest(0, coalesce(p_xp, 0)) >= 250000 then 30
    when greatest(0, coalesce(p_xp, 0)) >= 145000 then 25
    when greatest(0, coalesce(p_xp, 0)) >= 75000 then 20
    when greatest(0, coalesce(p_xp, 0)) >= 31000 then 15
    when greatest(0, coalesce(p_xp, 0)) >= 17000 then 12
    when greatest(0, coalesce(p_xp, 0)) >= 11000 then 10
    when greatest(0, coalesce(p_xp, 0)) >= 8600 then 9
    when greatest(0, coalesce(p_xp, 0)) >= 6500 then 8
    when greatest(0, coalesce(p_xp, 0)) >= 4700 then 7
    when greatest(0, coalesce(p_xp, 0)) >= 3200 then 6
    when greatest(0, coalesce(p_xp, 0)) >= 2000 then 5
    when greatest(0, coalesce(p_xp, 0)) >= 1000 then 4
    when greatest(0, coalesce(p_xp, 0)) >= 500 then 3
    when greatest(0, coalesce(p_xp, 0)) >= 200 then 2
    else 1
  end
$$;

create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid references auth.users(id) on delete set null,
  wallet_address text,
  dev_identity text not null,
  eidolon_handle text not null,
  os_tier text not null default 'PIRATE'
    check (os_tier in ('PIRATE', 'AGENT', 'PANTHEON')),
  rank integer not null default 1 check (rank >= 1),
  xp bigint not null default 0 check (xp >= 0),
  faction text check (faction in ('FREE_SPLINTERS', 'BLACKWAKE', 'NULL_CROWN', 'ARCHIVISTS')),
  current_location_id text not null default 'neon_plaza',
  travel_destination_id text,
  travel_end_time timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (eidolon_handle ~ '^[A-Za-z0-9_]{3,20}$')
);

create unique index if not exists players_auth_user_id_key
  on public.players(auth_user_id)
  where auth_user_id is not null;

create unique index if not exists players_dev_identity_key
  on public.players(lower(dev_identity));

create table if not exists public.resources (
  player_id uuid primary key references public.players(id) on delete cascade,
  energy_seconds integer not null default 259200 check (energy_seconds >= 0),
  heat integer not null default 6 check (heat between 0 and 100),
  integrity integer not null default 82 check (integrity between 0 and 100),
  stealth integer not null default 64 check (stealth between 0 and 100),
  influence integer not null default 3 check (influence >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.commodities (
  ticker text primary key,
  name text not null,
  base_price numeric(14, 2) not null check (base_price > 0),
  volatility text not null
    check (volatility in ('very_low', 'low', 'med', 'high', 'very_high')),
  heat_risk text not null
    check (heat_risk in ('very_low', 'low', 'med', 'high', 'very_high')),
  tags text[] not null default '{}',
  updated_at timestamptz not null default now()
);

create table if not exists public.market_prices (
  ticker text not null references public.commodities(ticker) on delete cascade,
  tick integer not null check (tick >= 0),
  price numeric(14, 2) not null check (price > 0),
  created_at timestamptz not null default now(),
  primary key (ticker, tick)
);

create index if not exists market_prices_latest_idx
  on public.market_prices(ticker, tick desc);

create table if not exists public.positions (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  ticker text not null references public.commodities(ticker),
  quantity numeric(18, 4) not null default 0 check (quantity >= 0),
  avg_entry numeric(14, 2) not null check (avg_entry >= 0),
  realized_pnl numeric(14, 2) not null default 0,
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists positions_player_open_idx
  on public.positions(player_id, ticker)
  where quantity > 0;

create table if not exists public.ledger_entries (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  currency text not null check (currency in ('0BOL', '$OBOL')),
  delta numeric(14, 2) not null,
  reason text not null,
  balance_after numeric(14, 2) not null,
  created_at timestamptz not null default now()
);

create index if not exists ledger_entries_player_created_idx
  on public.ledger_entries(player_id, created_at);

create table if not exists public.trades (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  ticker text not null references public.commodities(ticker),
  side text not null check (side in ('BUY', 'SELL')),
  quantity numeric(18, 4) not null check (quantity > 0),
  price numeric(14, 2) not null check (price > 0),
  heat_delta integer not null default 0,
  location_id text,
  executed_at timestamptz not null default now()
);

create index if not exists trades_player_executed_idx
  on public.trades(player_id, executed_at);

create table if not exists public.market_news (
  id text primary key,
  headline text not null,
  body text,
  affected_tickers text[] not null default '{}',
  direction text check (direction in ('up', 'down')),
  credibility numeric(4, 3) not null check (credibility between 0 and 1),
  price_multiplier numeric(8, 4) not null default 1 check (price_multiplier > 0),
  tick_published integer not null check (tick_published >= 0),
  tick_expires integer not null check (tick_expires >= tick_published),
  duration_ticks integer check (duration_ticks is null or duration_ticks >= 0),
  created_at timestamptz not null default now()
);

create index if not exists market_news_active_idx
  on public.market_news(tick_published, tick_expires);

create table if not exists public.authority_events (
  id uuid primary key default gen_random_uuid(),
  player_id uuid references public.players(id) on delete cascade,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists authority_events_player_created_idx
  on public.authority_events(player_id, created_at);

insert into public.commodities (ticker, name, base_price, volatility, heat_risk, tags)
values
  ('FDST', 'Fractal Dust', 138, 'high', 'high', array['supply_shock', 'evasion']),
  ('PGAS', 'Plutonion Gas', 91, 'med', 'med', array['infrastructure', 'launch']),
  ('NGLS', 'Neon Glass', 73, 'low', 'low', array['archivist', 'memory']),
  ('HXMD', 'Helix Mud', 66, 'med', 'high', array['biohack', 'raid']),
  ('VBLM', 'Void Bloom', 24, 'low', 'very_low', array['starter', 'stabilizer']),
  ('ORRS', 'Oracle Resin', 112, 'med', 'med', array['news', 'signal']),
  ('SNPS', 'Synapse Silk', 84, 'med', 'med', array['faction', 'fiber']),
  ('MTRX', 'Matrix Salt', 58, 'low', 'low', array['lattice', 'unlock']),
  ('AETH', 'Aether Tabs', 41, 'high', 'high', array['rumor', 'pump']),
  ('BLCK', 'Blacklight Serum', 179, 'very_high', 'very_high', array['contraband', 'margin'])
on conflict (ticker) do update set
  name = excluded.name,
  base_price = excluded.base_price,
  volatility = excluded.volatility,
  heat_risk = excluded.heat_risk,
  tags = excluded.tags,
  updated_at = now();

create or replace function public.bootstrap_dev_player(
  p_eidolon_handle text,
  p_dev_identity text
)
returns public.players
language plpgsql
security definer
set search_path = public
as $$
declare
  v_auth_user_id uuid := auth.uid();
  v_handle text := upper(trim(p_eidolon_handle));
  v_dev_identity text := lower(coalesce(nullif(trim(p_dev_identity), ''), trim(p_eidolon_handle)));
  v_player public.players%rowtype;
begin
  if v_auth_user_id is null then
    raise exception 'Authenticated Supabase session required';
  end if;

  if v_handle !~ '^[A-Z0-9_]{3,20}$' then
    raise exception 'Invalid Eidolon handle';
  end if;

  select *
    into v_player
    from public.players
    where auth_user_id = v_auth_user_id
    limit 1;

  if found then
    return v_player;
  end if;

  insert into public.players (
    auth_user_id,
    wallet_address,
    dev_identity,
    eidolon_handle,
    os_tier,
    rank,
    xp,
    faction,
    current_location_id
  )
  values (
    v_auth_user_id,
    null,
    v_dev_identity,
    v_handle,
    'PIRATE',
    1,
    0,
    null,
    'neon_plaza'
  )
  returning * into v_player;

  insert into public.resources (player_id)
  values (v_player.id);

  insert into public.ledger_entries (
    player_id,
    currency,
    delta,
    reason,
    balance_after
  )
  values (
    v_player.id,
    '0BOL',
    1000000,
    'bootstrap_seed',
    1000000
  );

  insert into public.authority_events (player_id, event_type, payload)
  values (
    v_player.id,
    'bootstrap_dev_player',
    jsonb_build_object('osTier', 'PIRATE', 'localAuthorityParity', true)
  );

  return v_player;
end;
$$;

create or replace function public.add_xp(
  p_player_id uuid,
  p_delta integer
)
returns public.players
language plpgsql
security definer
set search_path = public
as $$
declare
  v_player public.players%rowtype;
  v_next_xp bigint;
begin
  select *
    into v_player
    from public.players
    where id = p_player_id
      and auth_user_id = auth.uid()
    for update;

  if not found then
    raise exception 'Player not found for current session';
  end if;

  v_next_xp := greatest(0, v_player.xp + coalesce(p_delta, 0));

  update public.players
    set xp = v_next_xp,
        rank = public.cybertrader_rank_for_xp(v_next_xp),
        updated_at = now()
    where id = p_player_id
    returning * into v_player;

  insert into public.authority_events (player_id, event_type, payload)
  values (
    p_player_id,
    'add_xp',
    jsonb_build_object('delta', coalesce(p_delta, 0), 'xp', v_player.xp, 'rank', v_player.rank)
  );

  return v_player;
end;
$$;

create or replace function public.set_player_resources(
  p_player_id uuid,
  p_energy_seconds integer default null,
  p_heat integer default null,
  p_integrity integer default null,
  p_stealth integer default null,
  p_influence integer default null
)
returns public.resources
language plpgsql
security definer
set search_path = public
as $$
declare
  v_resources public.resources%rowtype;
begin
  if not exists (
    select 1
      from public.players
      where id = p_player_id
        and auth_user_id = auth.uid()
  ) then
    raise exception 'Player not found for current session';
  end if;

  update public.resources
    set energy_seconds = coalesce(greatest(0, p_energy_seconds), energy_seconds),
        heat = coalesce(least(100, greatest(0, p_heat)), heat),
        integrity = coalesce(least(100, greatest(0, p_integrity)), integrity),
        stealth = coalesce(least(100, greatest(0, p_stealth)), stealth),
        influence = coalesce(greatest(0, p_influence), influence),
        updated_at = now()
    where player_id = p_player_id
    returning * into v_resources;

  if not found then
    raise exception 'Resources not found for current session';
  end if;

  insert into public.authority_events (player_id, event_type, payload)
  values (
    p_player_id,
    'set_player_resources',
    jsonb_build_object(
      'energySeconds', v_resources.energy_seconds,
      'heat', v_resources.heat,
      'integrity', v_resources.integrity,
      'stealth', v_resources.stealth,
      'influence', v_resources.influence
    )
  );

  return v_resources;
end;
$$;

alter table public.players enable row level security;
alter table public.resources enable row level security;
alter table public.positions enable row level security;
alter table public.ledger_entries enable row level security;
alter table public.trades enable row level security;
alter table public.market_news enable row level security;
alter table public.market_prices enable row level security;
alter table public.commodities enable row level security;
alter table public.authority_events enable row level security;

revoke all on table
  public.players,
  public.resources,
  public.positions,
  public.ledger_entries,
  public.trades,
  public.market_news,
  public.market_prices,
  public.commodities,
  public.authority_events
from anon, authenticated;

grant select on public.players to authenticated;
grant update (
  eidolon_handle,
  wallet_address,
  current_location_id,
  travel_destination_id,
  travel_end_time,
  updated_at
) on public.players to authenticated;
grant select on public.resources to authenticated;
grant select on public.positions to authenticated;
grant select on public.ledger_entries to authenticated;
grant select on public.trades to authenticated;
grant select on public.authority_events to authenticated;
grant select on public.commodities to anon, authenticated;
grant select on public.market_prices to anon, authenticated;
grant select on public.market_news to anon, authenticated;

grant execute on function public.bootstrap_dev_player(text, text) to authenticated;
grant execute on function public.add_xp(uuid, integer) to authenticated;
grant execute on function public.set_player_resources(uuid, integer, integer, integer, integer, integer) to authenticated;

create policy players_select_own
  on public.players
  for select
  to authenticated
  using (auth_user_id = auth.uid());

create policy players_update_own_profile
  on public.players
  for update
  to authenticated
  using (auth_user_id = auth.uid())
  with check (auth_user_id = auth.uid());

create policy resources_select_own
  on public.resources
  for select
  to authenticated
  using (
    exists (
      select 1 from public.players
      where players.id = resources.player_id
        and players.auth_user_id = auth.uid()
    )
  );

create policy positions_select_own
  on public.positions
  for select
  to authenticated
  using (
    exists (
      select 1 from public.players
      where players.id = positions.player_id
        and players.auth_user_id = auth.uid()
    )
  );

create policy ledger_entries_select_own
  on public.ledger_entries
  for select
  to authenticated
  using (
    exists (
      select 1 from public.players
      where players.id = ledger_entries.player_id
        and players.auth_user_id = auth.uid()
    )
  );

create policy trades_select_own
  on public.trades
  for select
  to authenticated
  using (
    exists (
      select 1 from public.players
      where players.id = trades.player_id
        and players.auth_user_id = auth.uid()
    )
  );

create policy authority_events_select_own
  on public.authority_events
  for select
  to authenticated
  using (
    player_id is null or exists (
      select 1 from public.players
      where players.id = authority_events.player_id
        and players.auth_user_id = auth.uid()
    )
  );

create policy commodities_read_public
  on public.commodities
  for select
  to anon, authenticated
  using (true);

create policy market_prices_read_public
  on public.market_prices
  for select
  to anon, authenticated
  using (true);

create policy market_news_read_public
  on public.market_news
  for select
  to anon, authenticated
  using (true);
