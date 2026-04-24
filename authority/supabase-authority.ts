import {
  DEMO_COMMODITIES,
  advancePrices,
  createInitialPrices,
  getCommodity,
  getHeatDelta,
  roundCurrency,
  type PriceMap,
} from "@/engine/demo-market";
import type {
  Authority,
  Commodity,
  Currency,
  LedgerEntry,
  MarketNews,
  PlayerProfile,
  Position,
  Resources,
  TokenBalance,
  Trade,
  WalletSession,
} from "@/engine/types";
import { OBOL_TOKEN_CONFIG } from "@/solana/obol-config";
import { requireSupabase } from "@/lib/supabase";

type DbPlayer = {
  id: string;
  wallet_address: string | null;
  dev_identity: string | null;
  eidolon_handle: string;
  os_tier: PlayerProfile["osTier"];
  rank: number;
  faction: PlayerProfile["faction"];
  created_at: string;
};

type DbResources = {
  energy_seconds: number;
  heat: number;
  integrity: number;
  stealth: number;
  influence: number;
};

type DbPosition = {
  id: string;
  ticker: string;
  quantity: number | string;
  avg_entry: number | string;
  realized_pnl: number | string;
  opened_at: string;
  closed_at: string | null;
};

type DbLedgerEntry = {
  id: string;
  player_id: string;
  currency: Currency;
  delta: number | string;
  reason: string;
  balance_after: number | string;
  created_at: string;
};

type DbTrade = {
  id: string;
  player_id: string;
  ticker: string;
  side: Trade["side"];
  quantity: number | string;
  price: number | string;
  heat_delta: number;
  executed_at: string;
};

type DbMarketNews = {
  id: string;
  headline: string;
  affected_tickers: string[];
  credibility: number;
  price_multiplier: number | string;
  tick_published: number;
  tick_expires: number;
};

interface TradeFunctionResponse {
  tradeId: string;
  positionId: string;
  balanceAfter: number;
  energySeconds: number;
  heat: number;
}

const ENERGY_COST_PER_HOUR = 1_500;

export class SupabaseAuthority implements Authority {
  private readonly priceCache = new Map<number, PriceMap>([[0, createInitialPrices()]]);
  private currentTick = 0;

  async getProfile(playerId: string): Promise<PlayerProfile> {
    const supabase = await requireSupabase();
    const { data, error } = await supabase
      .from("players")
      .select("*")
      .eq("id", playerId)
      .single<DbPlayer>();

    if (error || !data) {
      throw new Error(error?.message ?? `Unknown player: ${playerId}`);
    }

    return this.mapProfile(data);
  }

  async createProfile(
    input: Omit<PlayerProfile, "id" | "createdAt">,
  ): Promise<PlayerProfile> {
    const supabase = await requireSupabase();
    const devIdentity = input.devIdentity ?? input.eidolonHandle.toLowerCase();

    const { data, error } = await supabase.rpc("bootstrap_dev_player", {
      p_eidolon_handle: input.eidolonHandle,
      p_dev_identity: devIdentity,
    });

    if (error || !data) {
      throw new Error(error?.message ?? "Supabase profile bootstrap failed");
    }

    return this.mapProfile(data as DbPlayer);
  }

  async getOpenPositions(playerId: string): Promise<Position[]> {
    const supabase = await requireSupabase();
    const prices = await this.getTickPrices(this.currentTick);
    const { data, error } = await supabase
      .from("positions")
      .select("*")
      .eq("player_id", playerId)
      .is("closed_at", null)
      .order("ticker", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return ((data ?? []) as DbPosition[]).map((position) =>
      this.mapPosition(position, prices[position.ticker]),
    );
  }

  async getLedger(playerId: string): Promise<LedgerEntry[]> {
    const supabase = await requireSupabase();
    const { data, error } = await supabase
      .from("ledger_entries")
      .select("*")
      .eq("player_id", playerId)
      .order("created_at", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return ((data ?? []) as DbLedgerEntry[]).map(this.mapLedgerEntry);
  }

  async getMarket(): Promise<Commodity[]> {
    return DEMO_COMMODITIES.map((commodity) => ({
      ...commodity,
      eventTags: [...commodity.eventTags],
    }));
  }

  async getTickPrices(tick: number): Promise<Record<string, number>> {
    const targetTick = Math.max(0, Math.floor(tick));

    if (!this.priceCache.has(targetTick)) {
      let cursor = this.getNearestCachedTick(targetTick);
      let prices = { ...(this.priceCache.get(cursor) ?? createInitialPrices()) };

      while (cursor < targetTick) {
        cursor += 1;
        prices = advancePrices(prices, cursor).prices;
        this.priceCache.set(cursor, prices);
      }
    }

    this.currentTick = targetTick;
    return { ...(this.priceCache.get(targetTick) ?? createInitialPrices()) };
  }

  async executeTrade(input: {
    playerId: string;
    ticker: string;
    side: "BUY" | "SELL";
    quantity: number;
  }): Promise<{ trade: Trade; position: Position; ledger: LedgerEntry[] }> {
    const commodity = getCommodity(input.ticker);
    if (!commodity) {
      throw new Error(`Unknown ticker: ${input.ticker}`);
    }

    const supabase = await requireSupabase();
    const { data, error } = await supabase.functions.invoke<TradeFunctionResponse>(
      "trade-execute",
      {
        body: {
          ...input,
          tick: this.currentTick,
        },
      },
    );

    if (error || !data) {
      throw new Error(error?.message ?? "trade-execute returned no data");
    }

    const [trade, position, ledger] = await Promise.all([
      this.getTrade(data.tradeId),
      this.getPosition(data.positionId),
      this.getLatestLedgerEntry(input.playerId),
    ]);

    return { trade, position, ledger: [ledger] };
  }

  async getResources(playerId: string): Promise<Resources> {
    const supabase = await requireSupabase();
    const { data, error } = await supabase
      .from("resources")
      .select("*")
      .eq("player_id", playerId)
      .single<DbResources>();

    if (error || !data) {
      throw new Error(error?.message ?? `Resources not found for player: ${playerId}`);
    }

    return this.mapResources(data);
  }

  async purchaseEnergy(
    playerId: string,
    seconds: number,
    currency: Currency,
  ): Promise<Resources> {
    if (currency !== "0BOL") {
      throw new Error("$OBOL energy purchases are not wired in Supabase mode");
    }

    const supabase = await requireSupabase();
    const { error } = await supabase.functions.invoke("energy-purchase", {
      body: {
        playerId,
        seconds: Math.max(60, Math.floor(seconds)),
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    return this.getResources(playerId);
  }

  async advancePlayerClock(playerId: string, _tick: number): Promise<Resources> {
    return this.getResources(playerId);
  }

  async getActiveNews(tick: number): Promise<MarketNews[]> {
    const supabase = await requireSupabase();
    const targetTick = Math.max(0, Math.floor(tick));
    const { data, error } = await supabase
      .from("market_news")
      .select("*")
      .lte("tick_published", targetTick)
      .gte("tick_expires", targetTick)
      .order("tick_published", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return ((data ?? []) as DbMarketNews[]).map((news) => ({
      id: news.id,
      headline: news.headline,
      affectedTickers: news.affected_tickers,
      credibility: news.credibility,
      priceMultiplier: Number(news.price_multiplier),
      tickPublished: news.tick_published,
      tickExpires: news.tick_expires,
    }));
  }

  async getRank(playerId: string): Promise<{ rank: number; xp: number }> {
    const profile = await this.getProfile(playerId);
    return { rank: profile.rank, xp: Math.max(0, (profile.rank - 1) * 100) };
  }

  async connectWallet(): Promise<WalletSession> {
    return {
      mode: "dev_identity",
      walletAddress: null,
      cluster: OBOL_TOKEN_CONFIG.cluster,
      canSignTransactions: false,
    };
  }

  async disconnectWallet(): Promise<void> {
    return;
  }

  async getObolBalance(_playerId: string): Promise<TokenBalance | null> {
    if (!OBOL_TOKEN_CONFIG.mintAddress) {
      return null;
    }

    return {
      symbol: "$OBOL",
      mintAddress: OBOL_TOKEN_CONFIG.mintAddress,
      rawAmount: "0",
      uiAmount: "0",
      decimals: OBOL_TOKEN_CONFIG.decimals,
    };
  }

  private async getTrade(tradeId: string): Promise<Trade> {
    const supabase = await requireSupabase();
    const { data, error } = await supabase
      .from("trades")
      .select("*")
      .eq("id", tradeId)
      .single<DbTrade>();

    if (error || !data) {
      throw new Error(error?.message ?? `Trade not found: ${tradeId}`);
    }

    return {
      id: data.id,
      playerId: data.player_id,
      ticker: data.ticker,
      side: data.side,
      quantity: Number(data.quantity),
      price: Number(data.price),
      heatDelta: data.heat_delta,
      executedAt: data.executed_at,
    };
  }

  private async getPosition(positionId: string): Promise<Position> {
    const supabase = await requireSupabase();
    const prices = await this.getTickPrices(this.currentTick);
    const { data, error } = await supabase
      .from("positions")
      .select("*")
      .eq("id", positionId)
      .single<DbPosition>();

    if (error || !data) {
      throw new Error(error?.message ?? `Position not found: ${positionId}`);
    }

    return this.mapPosition(data, prices[data.ticker]);
  }

  private async getLatestLedgerEntry(playerId: string): Promise<LedgerEntry> {
    const supabase = await requireSupabase();
    const { data, error } = await supabase
      .from("ledger_entries")
      .select("*")
      .eq("player_id", playerId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single<DbLedgerEntry>();

    if (error || !data) {
      throw new Error(error?.message ?? `Ledger entry not found for player: ${playerId}`);
    }

    return this.mapLedgerEntry(data);
  }

  private mapProfile(data: DbPlayer): PlayerProfile {
    return {
      id: data.id,
      walletAddress: data.wallet_address,
      devIdentity: data.dev_identity,
      eidolonHandle: data.eidolon_handle,
      osTier: data.os_tier,
      rank: data.rank,
      faction: data.faction,
      createdAt: data.created_at,
    };
  }

  private mapResources(data: DbResources): Resources {
    return {
      energySeconds: data.energy_seconds,
      heat: data.heat,
      integrity: data.integrity,
      stealth: data.stealth,
      influence: data.influence,
    };
  }

  private mapPosition(data: DbPosition, price?: number): Position {
    const quantity = Number(data.quantity);
    const avgEntry = Number(data.avg_entry);

    return {
      id: data.id,
      ticker: data.ticker,
      quantity,
      avgEntry,
      realizedPnl: Number(data.realized_pnl),
      unrealizedPnl:
        price === undefined ? 0 : roundCurrency((price - avgEntry) * quantity),
      openedAt: data.opened_at,
      closedAt: data.closed_at,
    };
  }

  private mapLedgerEntry(data: DbLedgerEntry): LedgerEntry {
    return {
      id: data.id,
      playerId: data.player_id,
      currency: data.currency,
      delta: Number(data.delta),
      reason: data.reason,
      balanceAfter: Number(data.balance_after),
      createdAt: data.created_at,
    };
  }

  private getNearestCachedTick(targetTick: number): number {
    const cachedTicks = [...this.priceCache.keys()].sort((left, right) => right - left);
    return cachedTicks.find((tick) => tick <= targetTick) ?? 0;
  }
}

export function getEnergyCostForSeconds(seconds: number): number {
  return roundCurrency((Math.max(60, Math.floor(seconds)) / 3600) * ENERGY_COST_PER_HOUR);
}
