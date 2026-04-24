import {
  createDistrictShift,
  createInitialDistrictStates,
  getDistrictCourierTimeMultiplier,
  getDistrictPriceMultiplier,
  isDistrictBuyRestricted,
  isDistrictTradingBlocked,
  normalizeDistrictStates,
} from "../district-state";

describe("district states", () => {
  it("creates deterministic shifts with temporary effects", () => {
    const shift = createDistrictShift({ nowMs: 1000, seed: "district-test", index: 0 });

    expect(shift.endTimestamp).toBeGreaterThan(shift.startTimestamp);
    expect(["BOOM", "LOCKDOWN", "BLACKOUT", "FESTIVAL", "GANG_CONTROL", "MARKET_CRASH"]).toContain(shift.state);
  });

  it("applies state modifiers and expiry", () => {
    expect(getDistrictPriceMultiplier("BOOM")).toBe(1.15);
    expect(getDistrictCourierTimeMultiplier("BOOM")).toBe(0.5);
    expect(isDistrictBuyRestricted("LOCKDOWN")).toBe(true);
    expect(isDistrictTradingBlocked("LOCKDOWN")).toBe(false);
    expect(isDistrictTradingBlocked("BLACKOUT")).toBe(true);

    const states = createInitialDistrictStates(0);
    states.neon_plaza = {
      locationId: "neon_plaza",
      state: "LOCKDOWN",
      startTimestamp: 0,
      endTimestamp: 10,
    };

    expect(normalizeDistrictStates(states, 11).neon_plaza?.state).toBe("NORMAL");
  });
});
