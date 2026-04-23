import type { SolanaWalletSession } from "@/solana/types";
import { OBOL_TOKEN_CONFIG } from "@/solana/obol-config";

export function getDefaultSolanaWalletSession(params?: {
  platform?: "android" | "ios" | "web";
  walletAddress?: string | null;
  featureEnabled?: boolean;
}): SolanaWalletSession {
  const platform = params?.platform ?? "android";
  const featureEnabled = params?.featureEnabled ?? OBOL_TOKEN_CONFIG.featureEnabled;
  const walletAddress = params?.walletAddress ?? null;

  if (!featureEnabled) {
    return {
      mode: "dev_identity",
      supportLevel: "disabled",
      cluster: OBOL_TOKEN_CONFIG.cluster,
      walletAddress: null,
      canSignTransactions: false,
      canSignMessages: false,
      note: "On-chain $OBOL is feature-flagged off. Use dev identity and local authority for the demo.",
    };
  }

  if (platform === "android") {
    return {
      mode: "android_mwa",
      supportLevel: "full",
      cluster: OBOL_TOKEN_CONFIG.cluster,
      walletAddress,
      canSignTransactions: true,
      canSignMessages: true,
      note: "Android can use Solana Mobile Wallet Adapter for signing once the SDK packages are wired.",
    };
  }

  if (platform === "ios") {
    return {
      mode: "manual_external_wallet",
      supportLevel: "limited",
      cluster: OBOL_TOKEN_CONFIG.cluster,
      walletAddress,
      canSignTransactions: false,
      canSignMessages: false,
      note: "iOS does not currently support Solana Mobile Wallet Adapter, so wallet flows need a different path.",
    };
  }

  return {
    mode: "manual_external_wallet",
    supportLevel: "limited",
    cluster: OBOL_TOKEN_CONFIG.cluster,
    walletAddress,
    canSignTransactions: false,
    canSignMessages: false,
    note: "Web can read config and balances, but mobile-first signing should not rely on this path.",
  };
}
