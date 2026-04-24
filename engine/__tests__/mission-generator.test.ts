import { createMission, getMissionProgress } from "../mission-generator";

describe("mission generator", () => {
  it("creates a timed mission from an unlocked npc", () => {
    const mission = createMission({
      nowMs: 1000,
      seed: "mission-test",
      index: 0,
      rankLevel: 1,
      prices: { FDST: 100, PGAS: 50 },
    });

    expect(mission.status).toBe("pending");
    expect(mission.endTimestamp).toBeGreaterThan(mission.startTimestamp);
    expect(mission.rewardObol).toBeGreaterThan(0);
  });

  it("detects buy request completion", () => {
    const mission = {
      id: "buy",
      npcId: "kite",
      type: "BUY_REQUEST" as const,
      status: "active" as const,
      title: "buy",
      objective: "buy",
      ticker: "PGAS",
      quantity: 20,
      startTimestamp: 0,
      endTimestamp: 10000,
      rewardObol: 1,
      rewardXp: 1,
      reputationDelta: 1,
    };

    expect(
      getMissionProgress({
        mission,
        currentLocationId: "neon_plaza",
        nowMs: 500,
        positions: {
          PGAS: {
            id: "p",
            ticker: "PGAS",
            quantity: 20,
            avgEntry: 1,
            realizedPnl: 0,
            unrealizedPnl: 0,
            openedAt: "",
            closedAt: null,
          },
        },
      }).complete,
    ).toBe(true);
  });
});
