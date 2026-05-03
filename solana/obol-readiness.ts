import type {
  SolanaTokenConfig,
  SolanaTransferIntent,
  SolanaWalletMode,
  SolanaSupportLevel,
} from "@/solana/types";
import { OBOL_TOKEN_CONFIG } from "@/solana/obol-config";
import { getDefaultSolanaWalletSession } from "@/solana/wallet-support";

export type SolanaRuntimePlatform = "android" | "ios" | "web";
export type ObolReadinessStatus = "disabled" | "blocked" | "limited" | "ready";
export type ObolAuthorityMode = "local_authority" | "solana_wallet_bridge";

export interface ObolReadiness {
  status: ObolReadinessStatus;
  authorityMode: ObolAuthorityMode;
  walletMode: SolanaWalletMode;
  supportLevel: SolanaSupportLevel;
  cluster: SolanaTokenConfig["cluster"];
  rpcUrl: string;
  tokenProgram: SolanaTokenConfig["tokenProgram"];
  mintConfigured: boolean;
  walletAddress: string | null;
  canReadBalance: boolean;
  canCreateTransferIntent: boolean;
  canSignTransactions: boolean;
  primaryCopy: string;
  detailCopy: string;
}

export function getObolReadiness(params?: {
  platform?: SolanaRuntimePlatform;
  config?: SolanaTokenConfig;
  walletAddress?: string | null;
}): ObolReadiness {
  const config = params?.config ?? OBOL_TOKEN_CONFIG;
  const platform = params?.platform ?? "android";
  const walletAddress = params?.walletAddress?.trim() || null;
  const session = getDefaultSolanaWalletSession({
    platform,
    walletAddress,
    featureEnabled: config.featureEnabled,
  });
  const mintConfigured = Boolean(config.mintAddress);

  if (!config.featureEnabled) {
    return {
      status: "disabled",
      authorityMode: "local_authority",
      walletMode: session.mode,
      supportLevel: session.supportLevel,
      cluster: config.cluster,
      rpcUrl: config.rpcUrl,
      tokenProgram: config.tokenProgram,
      mintConfigured,
      walletAddress: null,
      canReadBalance: false,
      canCreateTransferIntent: false,
      canSignTransactions: false,
      primaryCopy: "Wallet-free LocalAuthority launch mode is active.",
      detailCopy: "Core trading, Energy, Heat, missions, and OS progression remain fully playable without a wallet.",
    };
  }

  if (!mintConfigured) {
    return {
      status: "blocked",
      authorityMode: "local_authority",
      walletMode: session.mode,
      supportLevel: session.supportLevel,
      cluster: config.cluster,
      rpcUrl: config.rpcUrl,
      tokenProgram: config.tokenProgram,
      mintConfigured: false,
      walletAddress,
      canReadBalance: false,
      canCreateTransferIntent: false,
      canSignTransactions: false,
      primaryCopy: "$OBOL on-chain mode is enabled but no mint is configured.",
      detailCopy: "Set EXPO_PUBLIC_OBOL_TOKEN_MINT before balance reads or transfer intents can be exposed.",
    };
  }

  const canReadBalance = Boolean(walletAddress);
  const canCreateTransferIntent = session.mode === "android_mwa" && Boolean(walletAddress);
  const status: ObolReadinessStatus = canCreateTransferIntent
    ? "ready"
    : canReadBalance
      ? "limited"
      : "blocked";

  return {
    status,
    authorityMode: canCreateTransferIntent ? "solana_wallet_bridge" : "local_authority",
    walletMode: session.mode,
    supportLevel: session.supportLevel,
    cluster: config.cluster,
    rpcUrl: config.rpcUrl,
    tokenProgram: config.tokenProgram,
    mintConfigured: true,
    walletAddress,
    canReadBalance,
    canCreateTransferIntent,
    canSignTransactions: session.canSignTransactions && canCreateTransferIntent,
    primaryCopy: status === "ready"
      ? "Android MWA path is ready for guarded $OBOL intents."
      : "Read-only $OBOL wallet mode is limited on this platform.",
    detailCopy: status === "ready"
      ? "The game can construct signed-transfer intents after explicit player action; LocalAuthority stays available."
      : "Balances can be displayed when a wallet is known, but spend flows stay locked until a supported signer is present.",
  };
}

function pow10(decimals: number): bigint {
  return BigInt(10) ** BigInt(Math.max(0, Math.floor(decimals)));
}

export function formatTokenAmount(rawAmount: string, decimals: number): string {
  const raw = BigInt(rawAmount || "0");
  const safeDecimals = Math.max(0, Math.floor(decimals));
  if (safeDecimals === 0) {
    return raw.toString();
  }

  const scale = pow10(safeDecimals);
  const whole = raw / scale;
  const fraction = raw % scale;
  const fractionText = fraction.toString().padStart(safeDecimals, "0").replace(/0+$/, "");

  return fractionText ? `${whole.toString()}.${fractionText}` : whole.toString();
}

function parseTokenAmount(amountUi: string, decimals: number): bigint {
  const trimmed = amountUi.trim();
  if (!/^\d+(\.\d+)?$/.test(trimmed)) {
    throw new Error("Amount must be a positive decimal");
  }

  const [wholeText = "0", fractionText = ""] = trimmed.split(".");
  const safeDecimals = Math.max(0, Math.floor(decimals));
  if (fractionText.length > safeDecimals) {
    throw new Error(`Amount exceeds ${safeDecimals} token decimals`);
  }

  const whole = BigInt(wholeText || "0") * pow10(safeDecimals);
  const fraction = BigInt(fractionText.padEnd(safeDecimals, "0") || "0");
  const raw = whole + fraction;
  if (raw <= 0n) {
    throw new Error("Amount must be greater than zero");
  }

  return raw;
}

export function buildObolTransferIntent(input: {
  config?: SolanaTokenConfig;
  recipientWalletAddress: string;
  amountUi: string;
}): SolanaTransferIntent {
  const config = input.config ?? OBOL_TOKEN_CONFIG;
  const mintAddress = config.mintAddress?.trim();
  const recipientWalletAddress = input.recipientWalletAddress.trim();

  if (!mintAddress) {
    throw new Error("OBOL mint is not configured");
  }
  if (!recipientWalletAddress) {
    throw new Error("Recipient wallet is required");
  }

  const amountRaw = parseTokenAmount(input.amountUi, config.decimals).toString();

  return {
    mintAddress,
    recipientWalletAddress,
    amountRaw,
    amountUi: formatTokenAmount(amountRaw, config.decimals),
    decimals: config.decimals,
  };
}
