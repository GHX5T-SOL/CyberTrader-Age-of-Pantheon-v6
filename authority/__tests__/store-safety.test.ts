import {
  STORE_SAFE_BOUNDARY_POLICY,
  STORE_SAFE_REVIEWER_COPY,
  assertStoreSafeCopy,
  findStoreSafetyFindings,
  isStoreSafeCopy,
} from "@/authority/store-safety";
import { LAUNCH_ACCOUNT_RECOVERY_COPY } from "@/authority/launch-identity";
import { getDefaultSolanaWalletSession } from "@/solana/wallet-support";

describe("kite-p1-004 store-safe boundaries", () => {
  it("documents the LocalAuthority launch boundary for store review", () => {
    expect(STORE_SAFE_BOUNDARY_POLICY).toMatchObject({
      taskId: "kite-p1-004",
      launchScope: "LocalAuthority-only demo",
    });
    expect(STORE_SAFE_BOUNDARY_POLICY.softCurrency).toContain("no cash value");
    expect(STORE_SAFE_BOUNDARY_POLICY.walletScope).toContain("feature-flagged");
    expect(STORE_SAFE_BOUNDARY_POLICY.reviewerScope).toContain("without a wallet");
  });

  it("keeps launch, legal, and reviewer copy away from regulated claims", () => {
    assertStoreSafeCopy({
      launchRecovery: Object.values(LAUNCH_ACCOUNT_RECOVERY_COPY).join(" "),
      reviewerCopy: Object.values(STORE_SAFE_REVIEWER_COPY).join(" "),
      boundaryPolicy: Object.values(STORE_SAFE_BOUNDARY_POLICY).join(" "),
    });
  });

  it("flags real-money, investment, regulated-market, prize, and wallet-material claims", () => {
    const unsafeCopy = [
      "cash out 0BOL for real money",
      "guaranteed returns through staking yield",
      "play-to-earn crypto income",
      "FOREX binary options and securities",
      "cash prizes from paid chance loot boxes",
      "enter a private key or seed phrase",
    ].join(" ");

    expect(findStoreSafetyFindings(unsafeCopy).map((finding) => finding.ruleId)).toEqual([
      "real-money-redemption",
      "investment-return",
      "play-to-earn",
      "regulated-market",
      "gambling-prize",
      "sensitive-wallet-material",
    ]);
    expect(isStoreSafeCopy(unsafeCopy)).toBe(false);
  });

  it("keeps wallet capability disabled unless the token flag is explicitly enabled", () => {
    const disabled = getDefaultSolanaWalletSession({
      platform: "android",
      walletAddress: "ExampleWallet",
      featureEnabled: false,
    });

    expect(disabled).toMatchObject({
      mode: "dev_identity",
      supportLevel: "disabled",
      walletAddress: null,
      canSignTransactions: false,
      canSignMessages: false,
    });
    expect(isStoreSafeCopy(disabled.note)).toBe(true);
  });

  it("keeps enabled wallet notes bounded to optional future scope", () => {
    const enabled = getDefaultSolanaWalletSession({
      platform: "android",
      walletAddress: "ExampleWallet",
      featureEnabled: true,
    });

    expect(enabled.supportLevel).toBe("full");
    expect(enabled.walletAddress).toBe("ExampleWallet");
    expect(isStoreSafeCopy(enabled.note)).toBe(true);
  });
});
