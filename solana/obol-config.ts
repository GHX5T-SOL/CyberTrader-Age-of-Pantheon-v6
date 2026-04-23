import type { SolanaTokenConfig } from "@/solana/types";

function readPositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function readCluster(value: string | undefined): SolanaTokenConfig["cluster"] {
  if (value === "devnet" || value === "testnet" || value === "mainnet-beta") {
    return value;
  }
  return value ? "custom" : "mainnet-beta";
}

function readTokenProgram(
  value: string | undefined,
): SolanaTokenConfig["tokenProgram"] {
  if (value === "token" || value === "token_2022") {
    return value;
  }
  return "unknown";
}

export const OBOL_TOKEN_CONFIG: SolanaTokenConfig = {
  symbol: "$OBOL",
  mintAddress: process.env.EXPO_PUBLIC_OBOL_TOKEN_MINT?.trim() || null,
  decimals: readPositiveInt(process.env.EXPO_PUBLIC_OBOL_TOKEN_DECIMALS, 9),
  cluster: readCluster(process.env.EXPO_PUBLIC_SOLANA_CLUSTER),
  rpcUrl:
    process.env.EXPO_PUBLIC_SOLANA_RPC_URL?.trim() ||
    "https://api.mainnet-beta.solana.com",
  tokenProgram: readTokenProgram(process.env.EXPO_PUBLIC_OBOL_TOKEN_PROGRAM),
  featureEnabled: process.env.EXPO_PUBLIC_FEATURE_FLAG_OBOL_ONCHAIN === "true",
};

export function hasObolMintConfigured(): boolean {
  return Boolean(OBOL_TOKEN_CONFIG.mintAddress);
}
