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

function notReady(methodName: string): never {
  throw new Error(`SupabaseAuthority.${methodName} is not wired yet`);
}

export class SupabaseAuthority implements Authority {
  async getProfile(_playerId: string): Promise<PlayerProfile> {
    return notReady("getProfile");
  }

  async createProfile(
    _input: Omit<PlayerProfile, "id" | "createdAt">,
  ): Promise<PlayerProfile> {
    return notReady("createProfile");
  }

  async getOpenPositions(_playerId: string): Promise<Position[]> {
    return notReady("getOpenPositions");
  }

  async getLedger(_playerId: string): Promise<LedgerEntry[]> {
    return notReady("getLedger");
  }

  async getMarket(): Promise<Commodity[]> {
    return notReady("getMarket");
  }

  async getTickPrices(_tick: number): Promise<Record<string, number>> {
    return notReady("getTickPrices");
  }

  async executeTrade(_input: {
    playerId: string;
    ticker: string;
    side: "BUY" | "SELL";
    quantity: number;
  }): Promise<{ trade: Trade; position: Position; ledger: LedgerEntry[] }> {
    return notReady("executeTrade");
  }

  async getResources(_playerId: string): Promise<Resources> {
    return notReady("getResources");
  }

  async purchaseEnergy(
    _playerId: string,
    _seconds: number,
    _currency: Currency,
  ): Promise<Resources> {
    return notReady("purchaseEnergy");
  }

  async getActiveNews(_tick: number): Promise<MarketNews[]> {
    return notReady("getActiveNews");
  }

  async getRank(_playerId: string): Promise<{ rank: number; xp: number }> {
    return notReady("getRank");
  }

  async connectWallet(): Promise<WalletSession> {
    return notReady("connectWallet");
  }

  async disconnectWallet(): Promise<void> {
    return notReady("disconnectWallet");
  }

  async getObolBalance(_playerId: string): Promise<TokenBalance | null> {
    return notReady("getObolBalance");
  }
}
