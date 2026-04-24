import {
  getBountyByHeat,
  getBountyFlashFrequencyMultiplier,
  getBountyRaidIntervalTicks,
  getBountyRiskLabel,
} from "../bounty";

describe("bounty escalation", () => {
  it("derives watchlist tiers from heat", () => {
    expect(getBountyByHeat(10).status).toBe("SAFE");
    expect(getBountyByHeat(30).status).toBe("WATCHED");
    expect(getBountyByHeat(50).status).toBe("HUNTED");
    expect(getBountyByHeat(90).status).toBe("PRIORITY TARGET");
  });

  it("raises pressure at high bounty", () => {
    expect(getBountyRaidIntervalTicks(3)).toBe(30);
    expect(getBountyFlashFrequencyMultiplier(2)).toBe(0.8);
    expect(getBountyRiskLabel(0.62)).toBe("critical");
  });
});

