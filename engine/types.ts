/**
 * src/engine/types.ts - authoritative data model for the game engine.
 *
 * These interfaces are the contract shared by UI, state, engine, and
 * authority adapters. Keep them serializable so save/restore remains simple.
 */

export type OsTier = "PIRATE" | "AGENT" | "PANTHEON";
export type Faction = "FREE_SPLINTERS" | "BLACKWAKE" | "NULL_CROWN" | "ARCHIVISTS";
export type Currency = "0BOL" | "$OBOL";
export type FactionStandingTier = "neutral" | "trusted" | "favored" | "legend";

export interface FactionStanding {
  faction: Faction;
  reputation: number;
  tier: FactionStandingTier;
  missionBias: readonly MissionType[];
  rewardModifier: number;
}

export interface FactionChoice {
  faction: Faction;
  chosenAt: string;
  freeSwitchUsed: boolean;
  previousFaction: Faction | null;
}

export type FactionContractStageId = "initiation" | "trusted_route" | "favored_cell" | "legend_signal";

export interface FactionContractStage {
  id: FactionContractStageId;
  label: string;
  tier: FactionStandingTier;
  heatPosture: "low" | "medium" | "high";
  routeConsequence: string;
  reputationDelta: number;
}

export interface FactionContractSignal {
  faction: Faction;
  factionName: string;
  stageId: FactionContractStageId;
  stageLabel: string;
  tier: FactionStandingTier;
  heatPosture: "low" | "medium" | "high";
  routeConsequence: string;
  reputationDelta: number;
  rewardModifier: number;
}

export type LimitOrderSide = "BUY" | "SELL";
export type LimitOrderStatus = "open" | "filled" | "executed" | "cancelled" | "expired" | "rejected";

export interface LimitOrder {
  id: string;
  playerId: string;
  ticker: string;
  side: LimitOrderSide;
  quantity: number;
  limitPrice: number;
  status: LimitOrderStatus;
  createdAtTick: number;
  expiresAtTick: number;
  faction: Faction | null;
  filledAtTick: number | null;
  executedAtTick: number | null;
  cancelledAtTick: number | null;
  cancelReason: string | null;
  rejectionReason: string | null;
}

export interface LimitOrderFill {
  id: string;
  orderId: string;
  playerId: string;
  ticker: string;
  side: LimitOrderSide;
  quantity: number;
  limitPrice: number;
  executionPrice: number;
  tick: number;
  faction: Faction | null;
  heatDelta: number;
  energyCost: number;
  realizedPnl: number;
}

export interface LimitOrderExecution {
  orderId: string;
  ticker: string;
  side: LimitOrderSide;
  quantity: number;
  limitPrice: number;
  executedPrice: number;
  tick: number;
  balanceDelta: number;
  heatDelta: number;
  realizedPnl: number;
}

export interface FactionMarketPressure {
  id: string;
  faction: Faction;
  tick: number;
  reputation: number;
  intensity: number;
  tickerBias: Record<string, number>;
  heatDelta: number;
  volatilityMultiplier: number;
  expiresAtTick: number;
}

export interface FactionChoiceRequirement {
  id: "rank" | "first_profit" | "heat";
  label: string;
  met: boolean;
  current: number | boolean;
  target: number | boolean;
}

export interface AgentOsFactionGate {
  osTier: OsTier;
  unlocked: boolean;
  canChooseFaction: boolean;
  requirements: readonly FactionChoiceRequirement[];
}

export interface FactionSwitchRule {
  canSwitch: boolean;
  freeSwitchAvailable: boolean;
  reason: string;
}

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
  | "eagent_scan"
  | "district_blackout"
  | "flash_crash"
  | "gang_takeover";

export type FlashRiskLevel = "low" | "medium" | "high" | "critical";

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
  modifierApplied: boolean;
  riskLevel: FlashRiskLevel;
  multiplier?: number;
  amplitude?: number;
}

export type MissionType = "delivery" | "buy_request" | "hold" | "intel_drop";
export type MissionStatus = "pending" | "active" | "completed" | "failed" | "declined";

export interface Mission {
  id: string;
  npcId: string;
  npcName: string;
  type: MissionType;
  title: string;
  description: string;
  requiredTicker?: string;
  requiredQuantity?: number;
  destinationLocationId?: string;
  reward0Bol: number;
  rewardXp: number;
  reputationChangeOnSuccess: number;
  reputationChangeOnFail: number;
  contractSignal?: FactionContractSignal;
  expiresAtTimestamp: number;
  accepted: boolean;
  completed: boolean;
  failed: boolean;
  status: MissionStatus;
  objective: string;
  ticker?: string;
  quantity?: number;
  destinationId?: string;
  startTimestamp: number;
  endTimestamp: number;
  acceptedAt?: number;
  completedAt?: number;
  rewardObol: number;
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
  record: number;
  unlockedTitle?: "Hot Hand" | "Prophet" | "Oracle";
}

export type DistrictState =
  | "NORMAL"
  | "BOOM"
  | "LOCKDOWN"
  | "BLACKOUT"
  | "FESTIVAL"
  | "GANG_CONTROL"
  | "MARKET_CRASH";

export interface DistrictStateRecord {
  locationId: string;
  state: DistrictState;
  startTimestamp: number;
  endTimestamp: number;
  festivalTicker?: string;
}

export type BountyTier = 0 | 1 | 2 | 3;
export type BountyStatus = "SAFE" | "WATCHED" | "HUNTED" | "PRIORITY TARGET";

export interface BountySnapshot {
  level: BountyTier;
  status: BountyStatus;
  heatMin: number;
  heatMax: number;
  courierRiskBonus: number;
  missionRewardMultiplier: number;
  raidProbabilityDivisor: number;
}

export interface AwayReportItem {
  id: string;
  tone: "success" | "warning" | "danger" | "info";
  message: string;
  action?: "missions" | "terminal" | "travel" | "inventory" | "black_market";
}

export interface AwayReport {
  id: string;
  createdAt: number;
  minutesAway: number;
  items: AwayReportItem[];
  dismissed: boolean;
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
  chooseFaction?(playerId: string, faction: Faction): Promise<PlayerProfile>;

  connectWallet?(): Promise<WalletSession>;
  disconnectWallet?(): Promise<void>;
  getObolBalance?(playerId: string): Promise<TokenBalance | null>;
}
