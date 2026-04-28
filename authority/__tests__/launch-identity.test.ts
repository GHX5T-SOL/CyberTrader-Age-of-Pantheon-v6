import {
  EIDOLON_HANDLE_MAX_LENGTH,
  HANDLE_VALIDATION_COPY,
  LAUNCH_ACCOUNT_RECOVERY_COPY,
  LAUNCH_IDENTITY_POLICY,
  createLaunchPlayerProfileInput,
  isLaunchIdentityCopyStoreSafe,
  isValidEidolonHandle,
  normalizeEidolonHandle,
  toDevIdentity,
} from "@/authority/launch-identity";
import { DEFAULT_LOCATION_ID } from "@/data/locations";

describe("launch identity policy", () => {
  it("keeps first playable launch on local handle identity without wallet, backend, or payment requirements", () => {
    expect(LAUNCH_IDENTITY_POLICY).toMatchObject({
      taskId: "kite-p0-002",
      launchScope: "LocalAuthority-only demo",
      accountRequirement: "local handle",
      walletRequirement: "not required",
      backendRequirement: "not required",
      paymentRequirement: "not required",
      dataLocation: "on-device storage",
    });
  });

  it("normalizes handles without inventing a wallet or backend identifier", () => {
    expect(normalizeEidolonHandle("  AGENT_007  ")).toBe("AGENT_007");
    expect(normalizeEidolonHandle("A".repeat(40))).toHaveLength(EIDOLON_HANDLE_MAX_LENGTH);
    expect(toDevIdentity("EIDOLON_7")).toBe("eidolon_7");
  });

  it("accepts only store-safe Eidolon handle characters and length", () => {
    expect(isValidEidolonHandle("AB_7")).toBe(true);
    expect(isValidEidolonHandle("NO")).toBe(false);
    expect(isValidEidolonHandle("A".repeat(21))).toBe(false);
    expect(isValidEidolonHandle("bad handle")).toBe(false);
    expect(isValidEidolonHandle("wallet:0xabc")).toBe(false);
  });

  it("builds the launch profile input as LocalAuthority-safe player state", () => {
    expect(createLaunchPlayerProfileInput("KITE_01")).toMatchObject({
      walletAddress: null,
      devIdentity: "kite_01",
      eidolonHandle: "KITE_01",
      osTier: "PIRATE",
      rank: 1,
      faction: null,
      currentLocationId: DEFAULT_LOCATION_ID,
      travelDestinationId: null,
      travelEndTime: null,
    });
  });

  it("rejects invalid launch handles with player-safe copy", () => {
    expect(() => createLaunchPlayerProfileInput("bad handle")).toThrow(HANDLE_VALIDATION_COPY);
  });

  it("makes recovery and reviewer limitations explicit without regulated claims", () => {
    const copy = Object.values(LAUNCH_ACCOUNT_RECOVERY_COPY).join(" ");

    expect(copy).toContain("No demo account, wallet, payment method, or Supabase credentials");
    expect(copy).toContain("Cross-device recovery is unavailable");
    expect(copy).toContain("Clear Local Data removes local demo state");
    expect(isLaunchIdentityCopyStoreSafe(copy)).toBe(true);
  });
});
