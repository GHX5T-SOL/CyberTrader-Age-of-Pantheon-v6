import {
  DEFAULT_TRADE_QUANTITY,
  DEMO_COMMODITIES,
  DEMO_STARTING_BALANCE,
  advancePrices,
  createInitialPrices,
  getCommodity,
  getHeatDelta,
  roundCurrency,
  type PriceMap,
} from "@/engine/demo-market";
import { seededStream } from "@/engine/prng";
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

interface LocalAuthorityOptions {
  seed?: string;
  startedAt?: string;
}

interface LocalPlayerState {
  resources: Resources;
  cashBalance: number;
  ledger: LedgerEntry[];
  openPositions: Map<string, Position>;
  trades: Trade[];
  xp: number;
}

const INITIAL_PLAYER_RESOURCES: Resources = {
  energySeconds: 72 * 60 * 60,
  heat: 6,
  integrity: 82,
  stealth: 64,
  influence: 3,
};

const BUY_ENERGY_COST_PER_HOUR = 1_500;
const STARTING_RANK = 1;
const NEWS_WINDOW = 2;

const NEWS_TEMPLATES = [
  {
    ticker: "ORRS",
    headline: "oracle resin signal spike detected",
    minMultiplier: 1.01,
    maxMultiplier: 1.025,
  },
  {
    ticker: "AETH",
    headline: "aether tabs rumor packet bleeding across relays",
    minMultiplier: 1.008,
    maxMultiplier: 1.03,
  },
  {
    ticker: "VBLM",
    headline: "void bloom stabilizer lots cleared on low-heat lanes",
    minMultiplier: 1.006,
    maxMultiplier: 1.02,
  },
];

export class LocalAuthority implements Authority {
  private readonly seed: string;
  private readonly startedAtMs: number;
  private readonly profiles = new Map<string, PlayerProfile>();
  private readonly playerState = new Map<string, LocalPlayerState>();
  private readonly priceCache = new Map<number, PriceMap>([[0, createInitialPrices()]]);
  private currentTick = 0;
  private sequence = 0;

  constructor(options: LocalAuthorityOptions = {}) {
    this.seed = options.seed ?? "phase1-local";
    this.startedAtMs = Date.parse(options.startedAt ?? "2077-04-01T00:00:00.000Z");
  }

  async getProfile(playerId: string): Promise<PlayerProfile> {
    return this.cloneProfile(this.requireProfile(playerId));
  }

  async createProfile(
    input: Omit<PlayerProfile, "id" | "createdAt">,
  ): Promise<PlayerProfile> {
    const id = this.nextId("player");
    const createdAt = this.nextTimestamp();
    const profile: PlayerProfile = {
      ...input,
      id,
      rank: STARTING_RANK,
      createdAt,
    };

    const bootstrapLedger = this.createLedgerEntry({
      playerId: id,
      currency: "0BOL",
      delta: DEMO_STARTING_BALANCE,
      reason: "bootstrap_seed",
      balanceAfter: DEMO_STARTING_BALANCE,
    });

    this.profiles.set(id, profile);
    this.playerState.set(id, {
      resources: { ...INITIAL_PLAYER_RESOURCES },
      cashBalance: DEMO_STARTING_BALANCE,
      ledger: [bootstrapLedger],
      openPositions: new Map(),
      trades: [],
      xp: 0,
    });

    return this.cloneProfile(profile);
  }

  async getOpenPositions(playerId: string): Promise<Position[]> {
    const state = this.requirePlayerState(playerId);
    return [...state.openPositions.values()]
      .sort((left, right) => left.ticker.localeCompare(right.ticker))
      .map((position) => this.clonePosition(position));
  }

  async getLedger(playerId: string): Promise<LedgerEntry[]> {
    return this.requirePlayerState(playerId).ledger.map((entry) => ({ ...entry }));
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
      let prices = this.clonePrices(this.priceCache.get(cursor) ?? createInitialPrices());

      while (cursor < targetTick) {
        cursor += 1;
        prices = this.applyNews(
          advancePrices(prices, cursor).prices,
          this.buildNewsForTick(cursor),
        );
        this.priceCache.set(cursor, prices);
      }
    }

    this.currentTick = targetTick;
    return this.clonePrices(this.priceCache.get(targetTick) ?? createInitialPrices());
  }

  async executeTrade(input: {
    playerId: string;
    ticker: string;
    side: "BUY" | "SELL";
    quantity: number;
  }): Promise<{ trade: Trade; position: Position; ledger: LedgerEntry[] }> {
    const profile = this.requireProfile(input.playerId);
    const state = this.requirePlayerState(input.playerId);
    const commodity = getCommodity(input.ticker);

    if (!commodity) {
      throw new Error(`Unknown ticker: ${input.ticker}`);
    }

    const quantity = Math.max(1, Math.floor(input.quantity));
    const prices = await this.getTickPrices(this.currentTick);
    const price = prices[input.ticker];

    if (price === undefined) {
      throw new Error(`No price for ticker: ${input.ticker}`);
    }

    const trade: Trade = {
      id: this.nextId("trade"),
      playerId: input.playerId,
      ticker: input.ticker,
      side: input.side,
      quantity,
      price,
      heatDelta: getHeatDelta(input.ticker, input.side),
      executedAt: this.nextTimestamp(),
    };

    if (input.side === "BUY") {
      const total = roundCurrency(price * quantity);
      if (state.cashBalance < total) {
        throw new Error("Insufficient 0BOL");
      }

      const existing = state.openPositions.get(input.ticker);
      const currentQuantity = existing?.quantity ?? 0;
      const currentCostBasis = roundCurrency((existing?.avgEntry ?? 0) * currentQuantity);
      const nextQuantity = currentQuantity + quantity;
      const nextAvgEntry = roundCurrency((currentCostBasis + total) / nextQuantity);

      const nextPosition: Position = {
        id: existing?.id ?? this.nextId("position"),
        ticker: input.ticker,
        quantity: nextQuantity,
        avgEntry: nextAvgEntry,
        realizedPnl: existing?.realizedPnl ?? 0,
        unrealizedPnl: roundCurrency((price - nextAvgEntry) * nextQuantity),
        openedAt: existing?.openedAt ?? trade.executedAt,
        closedAt: null,
      };

      state.openPositions.set(input.ticker, nextPosition);
      state.cashBalance = roundCurrency(state.cashBalance - total);
      state.resources = this.updateResources(state.resources, {
        energyCost: this.getTradeEnergyCost("BUY", quantity),
        heatDelta: trade.heatDelta,
      });
      state.xp += 25;
      profile.rank = this.rankFromXp(state.xp);

      const ledgerEntry = this.createLedgerEntry({
        playerId: input.playerId,
        currency: "0BOL",
        delta: -total,
        reason: `trade_buy_${input.ticker.toLowerCase()}`,
        balanceAfter: state.cashBalance,
      });

      state.ledger.push(ledgerEntry);
      state.trades.push(trade);

      return {
        trade: { ...trade },
        position: this.clonePosition(nextPosition),
        ledger: [{ ...ledgerEntry }],
      };
    }

    const existing = state.openPositions.get(input.ticker);
    if (!existing || existing.quantity < quantity) {
      throw new Error("Nothing to sell");
    }

    const proceeds = roundCurrency(price * quantity);
    const realizedPnl = roundCurrency(proceeds - existing.avgEntry * quantity);
    const remainingQuantity = existing.quantity - quantity;
    const closedAt = remainingQuantity === 0 ? trade.executedAt : null;

    const nextPosition: Position = {
      ...existing,
      quantity: remainingQuantity,
      realizedPnl: roundCurrency(existing.realizedPnl + realizedPnl),
      unrealizedPnl:
        remainingQuantity === 0
          ? 0
          : roundCurrency((price - existing.avgEntry) * remainingQuantity),
      closedAt,
    };

    if (remainingQuantity === 0) {
      state.openPositions.delete(input.ticker);
    } else {
      state.openPositions.set(input.ticker, nextPosition);
    }

    state.cashBalance = roundCurrency(state.cashBalance + proceeds);
    state.resources = this.updateResources(state.resources, {
      energyCost: this.getTradeEnergyCost("SELL", quantity),
      heatDelta: trade.heatDelta,
    });
    state.xp += realizedPnl > 0 ? 50 : 20;
    profile.rank = this.rankFromXp(state.xp);

    const ledgerEntry = this.createLedgerEntry({
      playerId: input.playerId,
      currency: "0BOL",
      delta: proceeds,
      reason: `trade_sell_${input.ticker.toLowerCase()}`,
      balanceAfter: state.cashBalance,
    });

    state.ledger.push(ledgerEntry);
    state.trades.push(trade);

    return {
      trade: { ...trade },
      position: this.clonePosition(nextPosition),
      ledger: [{ ...ledgerEntry }],
    };
  }

  async getResources(playerId: string): Promise<Resources> {
    return { ...this.requirePlayerState(playerId).resources };
  }

  async purchaseEnergy(
    playerId: string,
    seconds: number,
    currency: Currency,
  ): Promise<Resources> {
    const state = this.requirePlayerState(playerId);

    if (currency !== "0BOL") {
      throw new Error("$OBOL energy purchases are not wired in local mode");
    }

    const energySeconds = Math.max(60, Math.floor(seconds));
    const cost = roundCurrency((energySeconds / 3600) * BUY_ENERGY_COST_PER_HOUR);

    if (state.cashBalance < cost) {
      throw new Error("Insufficient 0BOL");
    }

    state.cashBalance = roundCurrency(state.cashBalance - cost);
    state.resources = {
      ...state.resources,
      energySeconds: state.resources.energySeconds + energySeconds,
      heat: Math.max(0, state.resources.heat - 2),
    };

    const ledgerEntry = this.createLedgerEntry({
      playerId,
      currency,
      delta: -cost,
      reason: "energy_refill",
      balanceAfter: state.cashBalance,
    });

    state.ledger.push(ledgerEntry);
    return { ...state.resources };
  }

  async getActiveNews(tick: number): Promise<MarketNews[]> {
    const targetTick = Math.max(0, Math.floor(tick));
    const activeNews: MarketNews[] = [];

    for (let cursor = Math.max(1, targetTick - NEWS_WINDOW); cursor <= targetTick; cursor += 1) {
      for (const news of this.buildNewsForTick(cursor)) {
        if (news.tickPublished <= targetTick && news.tickExpires >= targetTick) {
          activeNews.push({ ...news, affectedTickers: [...news.affectedTickers] });
        }
      }
    }

    return activeNews;
  }

  async getRank(playerId: string): Promise<{ rank: number; xp: number }> {
    const state = this.requirePlayerState(playerId);
    return {
      rank: this.rankFromXp(state.xp),
      xp: state.xp,
    };
  }

  async connectWallet(): Promise<WalletSession> {
    return {
      mode: "dev_identity",
      walletAddress: null,
      cluster: "devnet",
      canSignTransactions: false,
    };
  }

  async disconnectWallet(): Promise<void> {
    return;
  }

  async getObolBalance(_playerId: string): Promise<TokenBalance | null> {
    return null;
  }

  private requireProfile(playerId: string): PlayerProfile {
    const profile = this.profiles.get(playerId);
    if (!profile) {
      throw new Error(`Unknown player: ${playerId}`);
    }

    return profile;
  }

  private requirePlayerState(playerId: string): LocalPlayerState {
    const state = this.playerState.get(playerId);
    if (!state) {
      throw new Error(`Unknown player: ${playerId}`);
    }

    return state;
  }

  private buildNewsForTick(tick: number): MarketNews[] {
    if (tick <= 0) {
      return [];
    }

    const stream = seededStream(`${this.seed}:${tick}:news`);
    if (stream() < 0.7) {
      return [];
    }

    const template = NEWS_TEMPLATES[Math.floor(stream() * NEWS_TEMPLATES.length)] ?? NEWS_TEMPLATES[0];
    if (!template) {
      return [];
    }
    const multiplier =
      template.minMultiplier +
      (template.maxMultiplier - template.minMultiplier) * stream();

    return [
      {
        id: `news_${this.seed}_${tick}_${template.ticker.toLowerCase()}`,
        headline: template.headline,
        affectedTickers: [template.ticker],
        credibility: 55 + Math.floor(stream() * 35),
        priceMultiplier: roundCurrency(multiplier),
        tickPublished: tick,
        tickExpires: tick + NEWS_WINDOW,
      },
    ];
  }

  private applyNews(prices: PriceMap, newsItems: MarketNews[]): PriceMap {
    if (newsItems.length === 0) {
      return prices;
    }

    const nextPrices = this.clonePrices(prices);

    for (const news of newsItems) {
      for (const ticker of news.affectedTickers) {
        const current = nextPrices[ticker];
        if (current === undefined) {
          continue;
        }

        nextPrices[ticker] = roundCurrency(current * news.priceMultiplier);
      }
    }

    return nextPrices;
  }

  private createLedgerEntry(input: {
    playerId: string;
    currency: Currency;
    delta: number;
    reason: string;
    balanceAfter: number;
  }): LedgerEntry {
    return {
      id: this.nextId("ledger"),
      playerId: input.playerId,
      currency: input.currency,
      delta: roundCurrency(input.delta),
      reason: input.reason,
      balanceAfter: roundCurrency(input.balanceAfter),
      createdAt: this.nextTimestamp(),
    };
  }

  private updateResources(
    resources: Resources,
    input: { energyCost: number; heatDelta: number },
  ): Resources {
    return {
      ...resources,
      energySeconds: Math.max(0, resources.energySeconds - input.energyCost),
      heat: Math.min(100, Math.max(0, resources.heat + input.heatDelta)),
    };
  }

  private getTradeEnergyCost(side: "BUY" | "SELL", quantity: number): number {
    const baseCost = side === "BUY" ? 90 : 75;
    return Math.max(15, Math.round((baseCost * quantity) / DEFAULT_TRADE_QUANTITY));
  }

  private rankFromXp(xp: number): number {
    return STARTING_RANK + Math.floor(xp / 100);
  }

  private cloneProfile(profile: PlayerProfile): PlayerProfile {
    return { ...profile };
  }

  private clonePosition(position: Position): Position {
    return { ...position };
  }

  private clonePrices(prices: PriceMap): PriceMap {
    return Object.fromEntries(Object.entries(prices));
  }

  private getNearestCachedTick(targetTick: number): number {
    const cachedTicks = [...this.priceCache.keys()].sort((left, right) => right - left);
    return cachedTicks.find((tick) => tick <= targetTick) ?? 0;
  }

  private nextId(prefix: string): string {
    this.sequence += 1;
    return `${prefix}_${this.seed}_${String(this.sequence).padStart(6, "0")}`;
  }

  private nextTimestamp(): string {
    const timestamp = new Date(this.startedAtMs + this.sequence * 1_000).toISOString();
    return timestamp;
  }
}
