/**
 * src/engine/types.ts - authoritative data model for the game engine.
 *
 * These interfaces are the contract shared by UI, state, engine, and
 * authority adapters. Keep them serializable so save/restore remains simple.
 */

export type OsTier = "PIRATE" | "AGENT" | "PANTHEON";
export type Faction = "FREE_SPLINTERS" | "BLACKWAKE" | "NULL_CROWN" | "ARCHIVISTS";
export type Currency = "0BOL" | "$OBOL";

export interface PlayerProfile {
  id: string;
  walletAddress: string | null;
  devIdentity: string | null;
  eidolonHandle: string;
  osTier: OsTier;
  rank: number;
  faction: Faction | null;
  createdAt: string;
  currentLocationId?: string;
  travelDestinationId?: string | null;
  travelEndTime?: number | null;
}

export interface Resources {
  energySeconds: number;
  heat: number;
  integrity: number;
  stealth: number;
  influence: number;
}

export interface Commodity {
  ticker: string;
  name: string;
  basePrice: number;
  volatility: "very_low" | "low" | "med" | "high" | "very_high";
  heatRisk: "very_low" | "low" | "med" | "high" | "very_high";
  eventTags: readonly string[];
}

export interface Position {
  id: string;
  ticker: string;
  quantity: number;
  avgEntry: number;
  realizedPnl: number;
  unrealizedPnl: number;
  openedAt: string;
  closedAt: string | null;
}

export interface MarketNews {
  id: string;
  headline: string;
  body?: string;
  affectedTickers: readonly string[];
  direction?: "up" | "down";
  credibility: number;
  priceMultiplier: number;
  tickPublished: number;
  tickExpires: number;
  durationTicks?: number;
}

export interface WalletSession {
  mode: "dev_identity" | "solana_android_mwa" | "manual_external_wallet";
  walletAddress: string | null;
  cluster: "mainnet-beta" | "devnet" | "testnet" | "custom";
  canSignTransactions: boolean;
}

export interface TokenBalance {
  symbol: "$OBOL";
  mintAddress: string;
  rawAmount: string;
  uiAmount: string;
  decimals: number;
}

export interface LedgerEntry {
  id: string;
  playerId: string;
  currency: Currency;
  delta: number;
  reason: string;
  balanceAfter: number;
  createdAt: string;
}

export interface Trade {
  id: string;
  playerId: string;
  ticker: string;
  side: "BUY" | "SELL";
  quantity: number;
  price: number;
  heatDelta: number;
  executedAt: string;
}

export interface RankSnapshot {
  rank: number;
  level: number;
  title: string;
  xp: number;
  xpRequired: number;
  nextXpRequired: number | null;
  inventorySlots: number;
}

export interface TradeResult {
  trade: Trade;
  position: Position;
  ledger: LedgerEntry[];
  resources: Resources;
  positions: Position[];
  rank: RankSnapshot;
  xpGained: number;
  realizedPnl: number;
}

export type FlashEventType =
  | "volatility_spike"
  | "arbitrage_window"
  | "eagent_proximity"
  | "district_blackout"
  | "whale_dump"
  | "gang_takeover";

export interface FlashEvent {
  id: string;
  type: FlashEventType;
  headline: string;
  description: string;
  ticker?: string;
  locationId?: string;
  startTimestamp: number;
  activationTimestamp?: number;
  endTimestamp: number;
  modifierActive: boolean;
}

export type MissionType = "DELIVERY" | "BUY_REQUEST" | "HOLD" | "INTEL_DROP";
export type MissionStatus = "pending" | "active" | "completed" | "failed" | "declined";

export interface Mission {
  id: string;
  npcId: string;
  type: MissionType;
  status: MissionStatus;
  title: string;
  objective: string;
  ticker?: string;
  quantity?: number;
  destinationId?: string;
  startTimestamp: number;
  endTimestamp: number;
  acceptedAt?: number;
  completedAt?: number;
  rewardObol: number;
  rewardXp: number;
  reputationDelta: number;
}

export interface NpcReputation {
  npcId: string;
  reputation: number;
}

export type DailyChallengeType =
  | "daily_profit"
  | "location_trades"
  | "raid_survivor"
  | "courier_success"
  | "rank_push";

export interface DailyChallenge {
  id: string;
  type: DailyChallengeType;
  title: string;
  target: number;
  progress: number;
  rewardObol: number;
  rewardXp: number;
  completed: boolean;
  claimed: boolean;
}

export interface TradeStreak {
  count: number;
  multiplier: number;
  lastProfitableTradeAt: number | null;
  expiresAt: number | null;
}

export type DistrictState = "BOOM" | "NORMAL" | "LOCKDOWN" | "BLACKOUT";

export interface DistrictStateRecord {
  locationId: string;
  state: DistrictState;
  startTimestamp: number;
  endTimestamp: number;
}

export interface TradeJuice {
  kind: "profit" | "loss" | "breakeven";
  pnl: number;
  bigWin: boolean;
  createdAt: number;
}

export interface RankCelebration {
  level: number;
  title: string;
  createdAt: number;
}

export interface Authority {
  getProfile(playerId: string): Promise<PlayerProfile>;
  createProfile(input: Omit<PlayerProfile, "id" | "createdAt">): Promise<PlayerProfile>;
  getOpenPositions(playerId: string): Promise<Position[]>;
  getLedger(playerId: string): Promise<LedgerEntry[]>;

  getMarket(): Promise<Commodity[]>;
  getTickPrices(tick: number): Promise<Record<string, number>>;

  executeTrade(input: {
    playerId: string;
    ticker: string;
    side: "BUY" | "SELL";
    quantity: number;
    locationId?: string;
    priceOverride?: number;
  }): Promise<TradeResult>;

  getResources(playerId: string): Promise<Resources>;
  purchaseEnergy(playerId: string, seconds: number, currency: Currency): Promise<Resources>;
  advancePlayerClock?(playerId: string, tick: number): Promise<Resources>;
  reduceHeat?(
    playerId: string,
    cost: number,
    heatReduction: number,
  ): Promise<{ resources: Resources; ledger: LedgerEntry[] }>;
  transferPositionToShipment?(
    playerId: string,
    ticker: string,
    quantity: number,
    cost: number,
  ): Promise<{ ledger: LedgerEntry[]; positions: Position[] }>;
  claimShipment?(
    playerId: string,
    ticker: string,
    quantity: number,
    avgEntry: number,
  ): Promise<Position[]>;
  applyRaidLoss?(
    playerId: string,
    losses: Record<string, number>,
  ): Promise<{ positions: Position[]; resources: Resources }>;
  grantReward?(
    playerId: string,
    amount: number,
    reason: string,
  ): Promise<LedgerEntry[]>;

  getActiveNews(tick: number): Promise<MarketNews[]>;

  getRank(playerId: string): Promise<RankSnapshot>;
  updateXp(playerId: string, xpDelta: number, reason?: string): Promise<RankSnapshot>;

  connectWallet?(): Promise<WalletSession>;
  disconnectWallet?(): Promise<void>;
  getObolBalance?(playerId: string): Promise<TokenBalance | null>;
}
