/**
 * src/engine/types.ts — authoritative data model for the game engine.
 *
 * These interfaces are the contract shared by:
 *   - UI layer (read)
 *   - State layer (read/write through authority adapter)
 *   - Engine (pure functions over these)
 *   - Authority adapter (LocalAuthority + SupabaseAuthority)
 *
 * Never widen a type without coordinating with Backend/Web3 Agent.
 */

export type OsTier = 'PIRATE' | 'AGENT' | 'PANTHEON';
export type Faction = 'FREE_SPLINTERS' | 'BLACKWAKE' | 'NULL_CROWN' | 'ARCHIVISTS';

export interface PlayerProfile {
  id: string;
  walletAddress: string | null;
  devIdentity: string | null;
  eidolonHandle: string;
  osTier: OsTier;
  rank: number;
  faction: Faction | null;
  createdAt: string;
}

export interface Resources {
  energySeconds: number;      // remaining, 0 = Dormant Mode
  heat: number;               // 0–100
  integrity: number;          // 0–100, narrative health
  stealth: number;            // 0–100, reduces Heat accrual slightly
  influence: number;          // 0–100, faction clout
}

export interface Commodity {
  ticker: string;
  name: string;
  basePrice: number;
  volatility: 'very_low' | 'low' | 'med' | 'high' | 'very_high';
  heatRisk: 'very_low' | 'low' | 'med' | 'high' | 'very_high';
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
  affectedTickers: readonly string[];
  credibility: number;           // 0–100; below some threshold = false
  priceMultiplier: number;       // e.g., 1.15 = +15%
  tickPublished: number;
  tickExpires: number;
}

export type Currency = '0BOL' | '$OBOL';

export interface WalletSession {
  mode: 'dev_identity' | 'solana_android_mwa' | 'manual_external_wallet';
  walletAddress: string | null;
  cluster: 'mainnet-beta' | 'devnet' | 'testnet' | 'custom';
  canSignTransactions: boolean;
}

export interface TokenBalance {
  symbol: '$OBOL';
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
  side: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  heatDelta: number;
  executedAt: string;
}

/**
 * Authority adapter — the single interface both LocalAuthority and
 * SupabaseAuthority implement. UI + engine only call this.
 */
export interface Authority {
  // profile
  getProfile(playerId: string): Promise<PlayerProfile>;
  createProfile(input: Omit<PlayerProfile, 'id' | 'createdAt'>): Promise<PlayerProfile>;
  getOpenPositions(playerId: string): Promise<Position[]>;
  getLedger(playerId: string): Promise<LedgerEntry[]>;

  // market
  getMarket(): Promise<Commodity[]>;
  getTickPrices(tick: number): Promise<Record<string, number>>;

  // trading
  executeTrade(input: {
    playerId: string;
    ticker: string;
    side: 'BUY' | 'SELL';
    quantity: number;
  }): Promise<{ trade: Trade; position: Position; ledger: LedgerEntry[] }>;

  // resources
  getResources(playerId: string): Promise<Resources>;
  purchaseEnergy(playerId: string, seconds: number, currency: Currency): Promise<Resources>;
  advancePlayerClock?(playerId: string, tick: number): Promise<Resources>;

  // news
  getActiveNews(tick: number): Promise<MarketNews[]>;

  // rank
  getRank(playerId: string): Promise<{ rank: number; xp: number }>;

  // wallet / token (feature-flagged)
  connectWallet?(): Promise<WalletSession>;
  disconnectWallet?(): Promise<void>;
  getObolBalance?(playerId: string): Promise<TokenBalance | null>;
}
