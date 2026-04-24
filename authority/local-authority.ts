import { DEFAULT_LOCATION_ID } from "@/data/locations";
import {
  DEMO_COMMODITIES,
  DEMO_STARTING_BALANCE,
  applyLocationPriceModifiers,
  applyMarketClockPulse,
  advancePrices,
  createInitialPrices,
  getCommodity,
  getTradeEnergyCost,
  roundCurrency,
  type PriceMap,
} from "@/engine/demo-market";
import { applyNewsToPrices, getActiveNewsForTick, generateNewsForTick } from "@/engine/news-generator";
import {
  getInventorySlots,
  getRankSnapshot,
  getTradeXp,
} from "@/engine/rank";
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

interface LocalAuthorityOptions {
  seed?: string;
  startedAt?: string;
  snapshot?: LocalAuthoritySnapshot;
}

interface LocalPlayerState {
  resources: Resources;
  cashBalance: number;
  ledger: LedgerEntry[];
  openPositions: Map<string, Position>;
  trades: Trade[];
  xp: number;
  profitableTradeDays: string[];
}

export interface LocalAuthorityPlayerSnapshot {
  playerId: string;
  resources: Resources;
  cashBalance: number;
  ledger: LedgerEntry[];
  openPositions: Position[];
  trades: Trade[];
  xp: number;
  profitableTradeDays?: string[];
}

export interface LocalAuthoritySnapshot {
  seed: string;
  startedAt: string;
  currentTick: number;
  sequence: number;
  profiles: PlayerProfile[];
  playerState: LocalAuthorityPlayerSnapshot[];
  priceCache: Array<[number, PriceMap]>;
}

const INITIAL_PLAYER_RESOURCES: Resources = {
  energySeconds: 72 * 60 * 60,
  heat: 6,
  integrity: 82,
  stealth: 64,
  influence: 3,
};

const BUY_ENERGY_COST_PER_HOUR = 1_000;
const HIGH_RISK_TICKERS = new Set(["BLCK", "AETH", "HXMD"]);

export class LocalAuthority implements Authority {
  private readonly seed: string;
  private readonly startedAtMs: number;
  private readonly profiles = new Map<string, PlayerProfile>();
  private readonly playerState = new Map<string, LocalPlayerState>();
  private readonly priceCache = new Map<number, PriceMap>([[0, createInitialPrices()]]);
  private currentTick = 0;
  private sequence = 0;

  constructor(options: LocalAuthorityOptions = {}) {
    const snapshot = options.snapshot;
    this.seed = snapshot?.seed ?? options.seed ?? "phase1-local";
    this.startedAtMs = Date.parse(
      snapshot?.startedAt ?? options.startedAt ?? "2077-04-01T00:00:00.000Z",
    );

    if (!snapshot) {
      return;
    }

    this.currentTick = snapshot.currentTick;
    this.sequence = snapshot.sequence;
    this.priceCache.clear();

    for (const [tick, prices] of snapshot.priceCache) {
      this.priceCache.set(tick, this.clonePrices(prices));
    }

    if (!this.priceCache.has(0)) {
      this.priceCache.set(0, createInitialPrices());
    }

    for (const profile of snapshot.profiles) {
      this.profiles.set(profile.id, { ...profile });
    }

    for (const player of snapshot.playerState) {
      this.playerState.set(player.playerId, {
        resources: { ...player.resources },
        cashBalance: player.cashBalance,
        ledger: player.ledger.map((entry) => ({ ...entry })),
        openPositions: new Map(
          player.openPositions.map((position) => [position.ticker, { ...position }]),
        ),
        trades: player.trades.map((trade) => ({ ...trade })),
        xp: player.xp,
        profitableTradeDays: [...(player.profitableTradeDays ?? [])],
      });
    }
  }

  static fromSnapshot(snapshot: LocalAuthoritySnapshot): LocalAuthority {
    return new LocalAuthority({ snapshot });
  }

  exportSnapshot(): LocalAuthoritySnapshot {
    return {
      seed: this.seed,
      startedAt: new Date(this.startedAtMs).toISOString(),
      currentTick: this.currentTick,
      sequence: this.sequence,
      profiles: [...this.profiles.values()].map((profile) => ({ ...profile })),
      playerState: [...this.playerState.entries()].map(([playerId, state]) => ({
        playerId,
        resources: { ...state.resources },
        cashBalance: state.cashBalance,
        ledger: state.ledger.map((entry) => ({ ...entry })),
        openPositions: [...state.openPositions.values()].map((position) => ({ ...position })),
        trades: state.trades.map((trade) => ({ ...trade })),
        xp: state.xp,
        profitableTradeDays: [...state.profitableTradeDays],
      })),
      priceCache: [...this.priceCache.entries()].map(([tick, prices]) => [
        tick,
        this.clonePrices(prices),
      ]),
    };
  }

  async getProfile(playerId: string): Promise<PlayerProfile> {
    return this.cloneProfile(this.requireProfile(playerId));
  }

  async createProfile(input: Omit<PlayerProfile, "id" | "createdAt">): Promise<PlayerProfile> {
    const id = this.nextId("player");
    const profile: PlayerProfile = {
      ...input,
      id,
      rank: 1,
      currentLocationId: input.currentLocationId ?? DEFAULT_LOCATION_ID,
      travelDestinationId: input.travelDestinationId ?? null,
      travelEndTime: input.travelEndTime ?? null,
      createdAt: this.nextTimestamp(),
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
      profitableTradeDays: [],
    });

    return this.cloneProfile(profile);
  }

  async getOpenPositions(playerId: string): Promise<Position[]> {
    const profile = this.requireProfile(playerId);
    const state = this.requirePlayerState(playerId);
    const basePrices = await this.getTickPrices(this.currentTick);
    const prices = applyLocationPriceModifiers(basePrices, profile.currentLocationId);

    return [...state.openPositions.values()]
      .sort((left, right) => left.ticker.localeCompare(right.ticker))
      .map((position) =>
        this.clonePosition({
          ...position,
          unrealizedPnl: roundCurrency(
            ((prices[position.ticker] ?? position.avgEntry) - position.avgEntry) *
              position.quantity,
          ),
        }),
      );
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
        prices = applyNewsToPrices(
          advancePrices(prices, cursor).prices,
          generateNewsForTick(cursor, this.seed),
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
    locationId?: string;
  }): Promise<TradeResult> {
    const profile = this.requireProfile(input.playerId);
    const state = this.requirePlayerState(input.playerId);
    const commodity = getCommodity(input.ticker);

    if (!commodity) {
      throw new Error(`Unknown ticker: ${input.ticker}`);
    }

    const quantity = Math.max(1, Math.floor(input.quantity));
    const price = await this.getCurrentLocationPrice(input.ticker, input.locationId ?? profile.currentLocationId);
    const tradeValue = roundCurrency(price * quantity);
    const heatDelta = this.getValueBasedHeatDelta(input.ticker, tradeValue);
    const energyCost = getTradeEnergyCost(input.side, quantity);

    if (state.resources.energySeconds < 60) {
      throw new Error("Dormant mode: buy energy before trading.");
    }
    if (state.resources.energySeconds < energyCost) {
      throw new Error("Not enough Energy for this order.");
    }

    const trade: Trade = {
      id: this.nextId("trade"),
      playerId: input.playerId,
      ticker: input.ticker,
      side: input.side,
      quantity,
      price,
      heatDelta,
      executedAt: this.nextTimestamp(),
    };

    let nextPosition: Position;
    let ledgerEntry: LedgerEntry;
    let realizedPnl = 0;
    let xpGained = 0;

    if (input.side === "BUY") {
      const rank = getRankSnapshot(state.xp);
      const isNewTicker = !state.openPositions.has(input.ticker);
      if (isNewTicker && state.openPositions.size >= getInventorySlots(rank.level)) {
        throw new Error("INVENTORY FULL. SELL SOME OR RANK UP.");
      }
      if (state.cashBalance < tradeValue) {
        throw new Error("Insufficient 0BOL");
      }

      const existing = state.openPositions.get(input.ticker);
      const currentQuantity = existing?.quantity ?? 0;
      const currentCostBasis = roundCurrency((existing?.avgEntry ?? 0) * currentQuantity);
      const nextQuantity = currentQuantity + quantity;
      const nextAvgEntry = roundCurrency((currentCostBasis + tradeValue) / nextQuantity);

      nextPosition = {
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
      state.cashBalance = roundCurrency(state.cashBalance - tradeValue);
      ledgerEntry = this.createLedgerEntry({
        playerId: input.playerId,
        currency: "0BOL",
        delta: -tradeValue,
        reason: `trade_buy_${input.ticker.toLowerCase()}`,
        balanceAfter: state.cashBalance,
      });
    } else {
      const existing = state.openPositions.get(input.ticker);
      if (!existing || existing.quantity < quantity) {
        throw new Error("Nothing to sell");
      }

      realizedPnl = roundCurrency(tradeValue - existing.avgEntry * quantity);
      const remainingQuantity = existing.quantity - quantity;
      nextPosition = {
        ...existing,
        quantity: remainingQuantity,
        realizedPnl: roundCurrency(existing.realizedPnl + realizedPnl),
        unrealizedPnl:
          remainingQuantity === 0
            ? 0
            : roundCurrency((price - existing.avgEntry) * remainingQuantity),
        closedAt: remainingQuantity === 0 ? trade.executedAt : null,
      };

      if (remainingQuantity === 0) {
        state.openPositions.delete(input.ticker);
      } else {
        state.openPositions.set(input.ticker, nextPosition);
      }

      state.cashBalance = roundCurrency(state.cashBalance + tradeValue);
      const tradeDay = trade.executedAt.slice(0, 10);
      const isFirstProfitableTradeToday =
        realizedPnl > 0 && !state.profitableTradeDays.includes(tradeDay);
      xpGained = getTradeXp({ realizedPnl, isFirstProfitableTradeToday });
      if (isFirstProfitableTradeToday) {
        state.profitableTradeDays.push(tradeDay);
      }
      this.applyXp(input.playerId, xpGained);

      ledgerEntry = this.createLedgerEntry({
        playerId: input.playerId,
        currency: "0BOL",
        delta: tradeValue,
        reason: `trade_sell_${input.ticker.toLowerCase()}`,
        balanceAfter: state.cashBalance,
      });
    }

    state.resources = this.updateResources(state.resources, {
      energyCost,
      heatDelta,
    });
    state.ledger.push(ledgerEntry);
    state.trades.push(trade);

    return {
      trade: { ...trade },
      position: this.clonePosition(nextPosition),
      ledger: [{ ...ledgerEntry }],
      resources: { ...state.resources },
      positions: await this.getOpenPositions(input.playerId),
      rank: await this.getRank(input.playerId),
      xpGained,
      realizedPnl,
    };
  }

  async getResources(playerId: string): Promise<Resources> {
    return { ...this.requirePlayerState(playerId).resources };
  }

  async purchaseEnergy(playerId: string, seconds: number, currency: Currency): Promise<Resources> {
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

    state.ledger.push(
      this.createLedgerEntry({
        playerId,
        currency,
        delta: -cost,
        reason: "energy_refill",
        balanceAfter: state.cashBalance,
      }),
    );

    return { ...state.resources };
  }

  async advancePlayerClock(playerId: string, tick: number): Promise<Resources> {
    const state = this.requirePlayerState(playerId);
    state.resources = {
      ...state.resources,
      ...applyMarketClockPulse(state.resources, tick),
    };

    return { ...state.resources };
  }

  async reduceHeat(
    playerId: string,
    cost: number,
    heatReduction: number,
  ): Promise<{ resources: Resources; ledger: LedgerEntry[] }> {
    const state = this.requirePlayerState(playerId);
    const actualCost = Math.max(0, roundCurrency(cost));
    if (state.cashBalance < actualCost) {
      throw new Error("Insufficient 0BOL");
    }

    state.cashBalance = roundCurrency(state.cashBalance - actualCost);
    state.resources = {
      ...state.resources,
      heat: Math.max(0, state.resources.heat - Math.max(0, Math.floor(heatReduction))),
    };

    const ledgerEntry = this.createLedgerEntry({
      playerId,
      currency: "0BOL",
      delta: -actualCost,
      reason: "black_market_bribe",
      balanceAfter: state.cashBalance,
    });
    state.ledger.push(ledgerEntry);

    return { resources: { ...state.resources }, ledger: [{ ...ledgerEntry }] };
  }

  async transferPositionToShipment(
    playerId: string,
    ticker: string,
    quantity: number,
    cost: number,
  ): Promise<{ ledger: LedgerEntry[]; positions: Position[] }> {
    const state = this.requirePlayerState(playerId);
    const position = state.openPositions.get(ticker);
    const sendQuantity = Math.max(1, Math.floor(quantity));
    const shipmentCost = Math.max(0, roundCurrency(cost));

    if (!position || position.quantity < sendQuantity) {
      throw new Error("Not enough inventory for courier.");
    }
    if (state.cashBalance < shipmentCost) {
      throw new Error("Insufficient 0BOL");
    }

    const remainingQuantity = position.quantity - sendQuantity;
    if (remainingQuantity === 0) {
      state.openPositions.delete(ticker);
    } else {
      state.openPositions.set(ticker, {
        ...position,
        quantity: remainingQuantity,
      });
    }

    state.cashBalance = roundCurrency(state.cashBalance - shipmentCost);
    const ledgerEntry = this.createLedgerEntry({
      playerId,
      currency: "0BOL",
      delta: -shipmentCost,
      reason: `courier_${ticker.toLowerCase()}`,
      balanceAfter: state.cashBalance,
    });
    state.ledger.push(ledgerEntry);

    return {
      ledger: [{ ...ledgerEntry }],
      positions: await this.getOpenPositions(playerId),
    };
  }

  async claimShipment(
    playerId: string,
    ticker: string,
    quantity: number,
    avgEntry: number,
  ): Promise<Position[]> {
    const state = this.requirePlayerState(playerId);
    const existing = state.openPositions.get(ticker);
    const safeQuantity = Math.max(1, Math.floor(quantity));
    const currentQuantity = existing?.quantity ?? 0;
    const nextQuantity = currentQuantity + safeQuantity;
    const nextAvgEntry = existing
      ? roundCurrency(
          (existing.avgEntry * currentQuantity + avgEntry * safeQuantity) / nextQuantity,
        )
      : roundCurrency(avgEntry);

    state.openPositions.set(ticker, {
      id: existing?.id ?? this.nextId("position"),
      ticker,
      quantity: nextQuantity,
      avgEntry: nextAvgEntry,
      realizedPnl: existing?.realizedPnl ?? 0,
      unrealizedPnl: 0,
      openedAt: existing?.openedAt ?? this.nextTimestamp(),
      closedAt: null,
    });

    return this.getOpenPositions(playerId);
  }

  async applyRaidLoss(
    playerId: string,
    losses: Record<string, number>,
  ): Promise<{ positions: Position[]; resources: Resources }> {
    const state = this.requirePlayerState(playerId);

    for (const [ticker, rawQuantity] of Object.entries(losses)) {
      const position = state.openPositions.get(ticker);
      if (!position) {
        continue;
      }

      const quantity = Math.max(1, Math.floor(rawQuantity));
      const remainingQuantity = Math.max(0, position.quantity - quantity);
      if (remainingQuantity === 0) {
        state.openPositions.delete(ticker);
      } else {
        state.openPositions.set(ticker, { ...position, quantity: remainingQuantity });
      }
    }

    return {
      positions: await this.getOpenPositions(playerId),
      resources: { ...state.resources },
    };
  }

  async getActiveNews(tick: number): Promise<MarketNews[]> {
    return getActiveNewsForTick(Math.max(0, Math.floor(tick)), this.seed);
  }

  async getRank(playerId: string): Promise<RankSnapshot> {
    return getRankSnapshot(this.requirePlayerState(playerId).xp);
  }

  async updateXp(playerId: string, xpDelta: number, _reason = "manual"): Promise<RankSnapshot> {
    return this.applyXp(playerId, xpDelta);
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

  private applyXp(playerId: string, xpDelta: number): RankSnapshot {
    const state = this.requirePlayerState(playerId);
    const profile = this.requireProfile(playerId);
    state.xp = Math.max(0, Math.floor(state.xp + Math.floor(xpDelta)));
    const rank = getRankSnapshot(state.xp);
    profile.rank = rank.level;
    return rank;
  }

  private async getCurrentLocationPrice(
    ticker: string,
    locationId: string | null | undefined,
  ): Promise<number> {
    const basePrices = await this.getTickPrices(this.currentTick);
    const prices = applyLocationPriceModifiers(basePrices, locationId);
    const price = prices[ticker];
    if (price === undefined) {
      throw new Error(`No price for ticker: ${ticker}`);
    }
    return price;
  }

  private getValueBasedHeatDelta(ticker: string, tradeValue: number): number {
    const divisor = HIGH_RISK_TICKERS.has(ticker) ? 2500 : 5000;
    return Math.max(1, Math.ceil(tradeValue / divisor));
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
    return new Date(this.startedAtMs + this.sequence * 1000).toISOString();
  }
}
