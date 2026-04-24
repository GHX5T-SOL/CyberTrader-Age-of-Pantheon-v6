import {
  DEMO_COMMODITIES,
  advancePrices,
  createInitialPrices,
  getCommodity,
  roundCurrency,
  type PriceMap,
} from "@/engine/demo-market";
import { getRankSnapshot } from "@/engine/rank";
import type {
  Authority,
  Commodity,
  Currency,
  LedgerEntry,
  MarketNews,
  PlayerProfile,
  Position,
  RankSnapshot,
  Resources,
  TokenBalance,
  Trade,
  TradeResult,
  WalletSession,
} from "@/engine/types";
import { OBOL_TOKEN_CONFIG } from "@/solana/obol-config";
import { requireSupabase, supabase } from "@/lib/supabase";

type DbPlayer = {
  id: string;
  wallet_address: string | null;
  dev_identity: string | null;
  eidolon_handle: string;
  os_tier: PlayerProfile["osTier"];
  rank: number;
  xp?: number | string | null;
  faction: PlayerProfile["faction"];
  created_at: string;
};

type DbResources = {
  energy_seconds: number | string;
  heat: number;
  integrity: number | null;
  stealth: number | null;
  influence: number | null;
};

type DbCommodity = {
  ticker: string;
  name: string;
  base_price: number | string;
  volatility: Commodity["volatility"];
  heat_risk: Commodity["heatRisk"];
  tags?: string[] | null;
};

type DbPosition = {
  id: string;
  ticker: string;
  quantity: number | string;
  avg_entry: number | string;
  realized_pnl: number | string | null;
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
  tradeId?: string;
  positionId?: string;
  filledPrice?: number;
  heatDelta?: number;
  balanceAfter?: number;
  energySeconds?: number;
}

interface EnergyFunctionResponse {
  newResources?: Resources;
  energySeconds?: number;
}

const ENERGY_COST_PER_HOUR = 1_000;

export class SupabaseAuthority implements Authority {
  private readonly priceCache = new Map<number, PriceMap>([[0, createInitialPrices()]]);
  private currentTick = 0;

  async getProfile(playerId: string): Promise<PlayerProfile> {
    const client = await requireSupabase();
    const { data, error } = await client
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
    const client = await requireSupabase();
    const devIdentity = input.devIdentity ?? input.eidolonHandle.toLowerCase();

    const { data, error } = await client.rpc("bootstrap_dev_player", {
      p_eidolon_handle: input.eidolonHandle,
      p_dev_identity: devIdentity,
    });

    if (error || !data) {
      throw new Error(error?.message ?? "Supabase profile bootstrap failed");
    }

    return this.mapProfile(data as DbPlayer);
  }

  async getOpenPositions(playerId: string): Promise<Position[]> {
    const client = await requireSupabase();
    const prices = await this.getTickPrices(this.currentTick);
    const { data, error } = await client
      .from("positions")
      .select("*")
      .eq("player_id", playerId)
      .gt("quantity", 0)
      .order("ticker", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return ((data ?? []) as DbPosition[]).map((position) =>
      this.mapPosition(position, prices[position.ticker]),
    );
  }

  async getLedger(playerId: string): Promise<LedgerEntry[]> {
    const client = await requireSupabase();
    const { data, error } = await client
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
    return this.getCommodities();
  }

  async getCommodities(): Promise<Commodity[]> {
    const client = await requireSupabase();
    const { data, error } = await client
      .from("commodities")
      .select("*")
      .order("base_price", { ascending: true });

    if (error || !data?.length) {
      return DEMO_COMMODITIES.map((commodity) => ({
        ...commodity,
        eventTags: [...commodity.eventTags],
      }));
    }

    return (data as DbCommodity[]).map((commodity) => ({
      ticker: commodity.ticker,
      name: commodity.name,
      basePrice: Number(commodity.base_price),
      volatility: commodity.volatility,
      heatRisk: commodity.heat_risk,
      eventTags: [...(commodity.tags ?? [])],
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

  async getLatestPrice(ticker: string): Promise<number | null> {
    const client = await requireSupabase();
    const { data, error } = await client
      .from("market_prices")
      .select("price")
      .eq("ticker", ticker)
      .order("tick", { ascending: false })
      .limit(1);

    if (!error && data?.[0]?.price !== undefined) {
      return Number(data[0].price);
    }

    const prices = await this.getTickPrices(this.currentTick);
    return prices[ticker] ?? null;
  }

  async executeTrade(input: {
    playerId: string;
    ticker: string;
    side: "BUY" | "SELL";
    quantity: number;
    locationId?: string;
    priceOverride?: number;
  }): Promise<TradeResult> {
    const commodity = getCommodity(input.ticker);
    if (!commodity) {
      throw new Error(`Unknown ticker: ${input.ticker}`);
    }

    const client = await requireSupabase();
    const { data, error } = await client.functions.invoke<TradeFunctionResponse>(
      "trade-execute",
      {
        body: {
          ...input,
          tick: this.currentTick,
        },
      },
    );

    if (error || !data?.tradeId || !data.positionId) {
      throw new Error(error?.message ?? "trade-execute returned incomplete data");
    }

    const [trade, position, ledger, resources, positions, rank] = await Promise.all([
      this.getTrade(data.tradeId),
      this.getPosition(data.positionId),
      this.getLatestLedgerEntry(input.playerId),
      this.getResources(input.playerId),
      this.getOpenPositions(input.playerId),
      this.getRank(input.playerId),
    ]);

    return {
      trade,
      position,
      ledger: [ledger],
      resources,
      positions,
      rank,
      xpGained: 0,
      realizedPnl: position.realizedPnl,
    };
  }

  async getResources(playerId: string): Promise<Resources> {
    const client = await requireSupabase();
    const { data, error } = await client
      .from("resources")
      .select("*")
      .eq("player_id", playerId)
      .single<DbResources>();

    if (error || !data) {
      throw new Error(error?.message ?? `Resources not found for player: ${playerId}`);
    }

    return this.mapResources(data);
  }

  async updateResources(playerId: string, updates: Partial<Resources>): Promise<Resources> {
    const client = await requireSupabase();
    const payload: Record<string, number> = {};

    if (updates.energySeconds !== undefined) {
      payload.energy_seconds = updates.energySeconds;
    }
    if (updates.heat !== undefined) {
      payload.heat = updates.heat;
    }
    if (updates.integrity !== undefined) {
      payload.integrity = updates.integrity;
    }
    if (updates.stealth !== undefined) {
      payload.stealth = updates.stealth;
    }
    if (updates.influence !== undefined) {
      payload.influence = updates.influence;
    }

    const energyHours = (updates as Partial<Resources> & { energyHours?: number }).energyHours;
    if (energyHours !== undefined) {
      payload.energy_seconds = energyHours * 3600;
    }

    const { error } = await client.from("resources").update(payload).eq("player_id", playerId);
    if (error) {
      throw new Error(error.message);
    }

    return this.getResources(playerId);
  }

  async purchaseEnergy(
    playerId: string,
    seconds: number,
    currency: Currency,
  ): Promise<Resources> {
    if (currency !== "0BOL") {
      throw new Error("$OBOL energy purchases are not wired in Supabase mode");
    }

    const energySeconds = Math.max(60, Math.floor(seconds));
    const client = await requireSupabase();
    const { data, error } = await client.functions.invoke<EnergyFunctionResponse>(
      "energy-purchase",
      {
        body: {
          playerId,
          seconds: energySeconds,
          amountHours: energySeconds / 3600,
        },
      },
    );

    if (error) {
      throw new Error(error.message);
    }

    return data?.newResources ?? this.getResources(playerId);
  }

  async advancePlayerClock(playerId: string, _tick: number): Promise<Resources> {
    return this.getResources(playerId);
  }

  async getActiveNews(tick: number): Promise<MarketNews[]> {
    const client = await requireSupabase();
    const targetTick = Math.max(0, Math.floor(tick));
    const { data, error } = await client
      .from("market_news")
      .select("*")
      .lte("tick_published", targetTick)
      .gte("tick_expires", targetTick)
      .order("tick_published", { ascending: false })
      .limit(20);

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

  async updateXp(playerId: string, xpDelta: number): Promise<RankSnapshot> {
    const client = await requireSupabase();
    const { error } = await client.rpc("add_xp", {
      p_player_id: playerId,
      p_delta: Math.floor(xpDelta),
    });

    if (error) {
      throw new Error(error.message);
    }

    const { data, error: rankError } = await client
      .from("players")
      .select("xp, rank")
      .eq("id", playerId)
      .single<{ xp: number | string; rank: number }>();

    if (rankError || !data) {
      throw new Error(rankError?.message ?? `Rank not found for player: ${playerId}`);
    }

    const snapshot = getRankSnapshot(Number(data.xp ?? 0));
    const { error: updateError } = await client
      .from("players")
      .update({ rank: snapshot.level })
      .eq("id", playerId);

    if (updateError) {
      throw new Error(updateError.message);
    }

    return snapshot;
  }

  async getRank(playerId: string): Promise<RankSnapshot> {
    const client = await requireSupabase();
    const { data, error } = await client
      .from("players")
      .select("rank, xp")
      .eq("id", playerId)
      .single<{ rank: number; xp: number | string | null }>();

    if (error || !data) {
      throw new Error(error?.message ?? `Rank not found for player: ${playerId}`);
    }

    const snapshot = getRankSnapshot(Number(data.xp ?? Math.max(0, (data.rank - 1) * 100)));
    return { ...snapshot, rank: data.rank, level: data.rank };
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

  async getSnapshot(): Promise<null> {
    return null;
  }

  private async getTrade(tradeId: string): Promise<Trade> {
    const client = await requireSupabase();
    const { data, error } = await client
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
    const client = await requireSupabase();
    const prices = await this.getTickPrices(this.currentTick);
    const { data, error } = await client
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
    const client = await requireSupabase();
    const { data, error } = await client
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
      energySeconds: Number(data.energy_seconds),
      heat: data.heat,
      integrity: data.integrity ?? 100,
      stealth: data.stealth ?? 0,
      influence: data.influence ?? 0,
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
      realizedPnl: Number(data.realized_pnl ?? 0),
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

export { supabase };
