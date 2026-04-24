import { checkRaid } from "../raid-checker";

const positions = {
  FDST: {
    id: "p1",
    ticker: "FDST",
    quantity: 100,
    avgEntry: 10,
    realizedPnl: 0,
    unrealizedPnl: 0,
    openedAt: "2077-01-01T00:00:00.000Z",
    closedAt: null,
  },
};

describe("raid checker", () => {
  it("only checks on the 30-minute cadence", () => {
    expect(checkRaid({ tick: 59, heat: 100, positions }).triggered).toBe(false);
  });

  it("can trigger deterministic inventory losses at high heat", () => {
    const result = checkRaid({ tick: 60, heat: 100, positions, seed: "seed-6" });

    expect(result.triggered).toBe(true);
    expect(result.losses.FDST).toBeGreaterThan(0);
    expect(result.xpBonus).toBe(100);
  });
});
