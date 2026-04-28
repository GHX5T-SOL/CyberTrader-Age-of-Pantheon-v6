import { readFileSync } from "node:fs";
import { join } from "node:path";

const MIGRATION_PATH = join(
  process.cwd(),
  "supabase/migrations/20260428183000_kite_p1_003_authority_schema.sql",
);
const ROLLBACK_PATH = join(
  process.cwd(),
  "supabase/rollbacks/20260428183000_kite_p1_003_authority_schema.sql",
);

function compactSql(sql: string): string {
  return sql.replace(/\s+/g, " ").toLowerCase();
}

describe("kite-p1-003 Supabase authority migration", () => {
  const migration = readFileSync(MIGRATION_PATH, "utf8");
  const rollback = readFileSync(ROLLBACK_PATH, "utf8");
  const compactMigration = compactSql(migration);
  const compactRollback = compactSql(rollback);

  it("declares every authority table used by SupabaseAuthority", () => {
    for (const table of [
      "players",
      "resources",
      "commodities",
      "market_prices",
      "positions",
      "ledger_entries",
      "trades",
      "market_news",
      "authority_events",
    ]) {
      expect(compactMigration).toContain(`create table if not exists public.${table}`);
      expect(compactMigration).toContain(`alter table public.${table} enable row level security`);
    }
  });

  it("seeds the launch commodity catalog deterministically", () => {
    for (const ticker of ["FDST", "PGAS", "NGLS", "HXMD", "VBLM", "ORRS", "SNPS", "MTRX", "AETH", "BLCK"]) {
      expect(migration).toContain(`'${ticker}'`);
    }

    expect(compactMigration).toContain("on conflict (ticker) do update set");
  });

  it("keeps player-owned writes behind RPCs or edge functions", () => {
    for (const fn of ["bootstrap_dev_player", "add_xp", "set_player_resources"]) {
      expect(compactMigration).toContain(`create or replace function public.${fn}`);
      expect(compactMigration).toContain("security definer");
      expect(compactMigration).toContain(`grant execute on function public.${fn}`);
    }

    expect(compactMigration).toContain("revoke all on table");
    expect(compactMigration).toContain("grant select on public.resources to authenticated");
    expect(compactMigration).not.toContain("grant update on public.resources");
    expect(compactMigration).not.toContain("grant insert on public.ledger_entries");
    expect(compactMigration).not.toContain("grant insert on public.trades");
  });

  it("binds player-scoped reads to the authenticated owner", () => {
    for (const policy of [
      "players_select_own",
      "resources_select_own",
      "positions_select_own",
      "ledger_entries_select_own",
      "trades_select_own",
      "authority_events_select_own",
    ]) {
      expect(compactMigration).toContain(`create policy ${policy}`);
    }

    expect(compactMigration).toContain("auth_user_id = auth.uid()");
  });

  it("includes rollback coverage for all authority tables and functions", () => {
    for (const objectName of [
      "set_player_resources",
      "add_xp",
      "bootstrap_dev_player",
      "cybertrader_rank_for_xp",
      "authority_events",
      "trades",
      "ledger_entries",
      "positions",
      "market_news",
      "market_prices",
      "commodities",
      "resources",
      "players",
    ]) {
      expect(compactRollback).toContain(objectName);
    }
  });
});
