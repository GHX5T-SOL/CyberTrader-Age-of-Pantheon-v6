import {
  buildObolTransferIntent,
  formatTokenAmount,
  getObolReadiness,
} from "@/solana/obol-readiness";
import type { SolanaTokenConfig } from "@/solana/types";

const DISABLED_CONFIG: SolanaTokenConfig = {
  symbol: "$OBOL",
  mintAddress: null,
  decimals: 9,
  cluster: "devnet",
  rpcUrl: "https://api.devnet.solana.com",
  tokenProgram: "token",
  featureEnabled: false,
};

const ENABLED_CONFIG: SolanaTokenConfig = {
  ...DISABLED_CONFIG,
  mintAddress: "ObolMint111111111111111111111111111111111",
  featureEnabled: true,
};

describe("$OBOL Solana readiness", () => {
  it("keeps disabled on-chain mode in wallet-free LocalAuthority launch mode", () => {
    expect(getObolReadiness({
      platform: "android",
      config: DISABLED_CONFIG,
    })).toMatchObject({
      status: "disabled",
      authorityMode: "local_authority",
      walletMode: "dev_identity",
      canReadBalance: false,
      canCreateTransferIntent: false,
    });
  });

  it("reports Android MWA as ready when feature flag and mint are configured", () => {
    expect(getObolReadiness({
      platform: "android",
      config: ENABLED_CONFIG,
      walletAddress: "Wallet111111111111111111111111111111111",
    })).toMatchObject({
      status: "ready",
      walletMode: "android_mwa",
      supportLevel: "full",
      canReadBalance: true,
      canCreateTransferIntent: true,
    });
  });

  it("keeps iOS in limited external-wallet mode", () => {
    expect(getObolReadiness({
      platform: "ios",
      config: ENABLED_CONFIG,
      walletAddress: "Wallet111111111111111111111111111111111",
    })).toMatchObject({
      status: "limited",
      walletMode: "manual_external_wallet",
      supportLevel: "limited",
      canReadBalance: true,
      canCreateTransferIntent: false,
    });
  });

  it("builds precise transfer intents and formats token amounts", () => {
    expect(formatTokenAmount("2500000000", 9)).toBe("2.5");
    expect(buildObolTransferIntent({
      config: ENABLED_CONFIG,
      recipientWalletAddress: "Recipient111111111111111111111111111111",
      amountUi: "2.5",
    })).toEqual({
      mintAddress: ENABLED_CONFIG.mintAddress,
      recipientWalletAddress: "Recipient111111111111111111111111111111",
      amountRaw: "2500000000",
      amountUi: "2.5",
      decimals: 9,
    });
  });

  it("rejects unsafe transfer intents before any signing flow", () => {
    expect(() => buildObolTransferIntent({
      config: DISABLED_CONFIG,
      recipientWalletAddress: "Recipient111111111111111111111111111111",
      amountUi: "1",
    })).toThrow("OBOL mint is not configured");

    expect(() => buildObolTransferIntent({
      config: ENABLED_CONFIG,
      recipientWalletAddress: "",
      amountUi: "1",
    })).toThrow("Recipient wallet is required");

    expect(() => buildObolTransferIntent({
      config: ENABLED_CONFIG,
      recipientWalletAddress: "Recipient111111111111111111111111111111",
      amountUi: "0",
    })).toThrow("Amount must be greater than zero");
  });
});
