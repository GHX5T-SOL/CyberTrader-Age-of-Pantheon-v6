export type SolanaCluster = "mainnet-beta" | "devnet" | "testnet" | "custom";

export type SolanaWalletMode =
  | "dev_identity"
  | "android_mwa"
  | "manual_external_wallet";

export type SolanaSupportLevel = "full" | "limited" | "disabled";

export interface SolanaWalletSession {
  mode: SolanaWalletMode;
  supportLevel: SolanaSupportLevel;
  cluster: SolanaCluster;
  walletAddress: string | null;
  canSignTransactions: boolean;
  canSignMessages: boolean;
  note: string;
}

export interface SolanaTokenConfig {
  symbol: string;
  mintAddress: string | null;
  decimals: number;
  cluster: SolanaCluster;
  rpcUrl: string;
  tokenProgram: "token" | "token_2022" | "unknown";
  featureEnabled: boolean;
}

export interface SolanaTokenBalance {
  symbol: string;
  mintAddress: string;
  walletAddress: string;
  associatedTokenAddress: string | null;
  rawAmount: string;
  uiAmount: string;
  decimals: number;
}

export interface SolanaTransferIntent {
  mintAddress: string;
  recipientWalletAddress: string;
  amountRaw: string;
  amountUi: string;
  decimals: number;
}
