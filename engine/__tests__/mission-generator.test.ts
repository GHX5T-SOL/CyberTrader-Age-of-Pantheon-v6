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
    expect(mission.reward0Bol).toBeGreaterThan(0);
  });

  it("biases AgentOS faction missions toward aligned contacts and mission types", () => {
    const mission = createMission({
      nowMs: 1000,
      seed: "mission-test",
      index: 0,
      rankLevel: 5,
      prices: { FDST: 100, PGAS: 50 },
      faction: "BLACKWAKE",
      npcReputation: { kite: 52 },
    });

    expect(mission.npcId).toBe("kite");
    expect(["delivery", "buy_request"]).toContain(mission.type);
    expect(mission.contractSignal).toMatchObject({
      faction: "BLACKWAKE",
      stageId: "favored_cell",
      stageLabel: "Blackwake Wake",
      heatPosture: "high",
      reputationDelta: 4,
    });
    expect(mission.reputationChangeOnSuccess).toBe(4);
    expect(mission.reputationChangeOnFail).toBe(-2);
  });

  it("detects buy request completion", () => {
    const mission = {
      id: "buy",
      npcId: "kite",
      npcName: "Kite",
      type: "buy_request" as const,
      status: "active" as const,
      title: "buy",
      objective: "buy",
      description: "buy",
      ticker: "PGAS",
      quantity: 20,
      requiredTicker: "PGAS",
      requiredQuantity: 20,
      startTimestamp: 0,
      endTimestamp: 10000,
      expiresAtTimestamp: 10000,
      accepted: true,
      completed: false,
      failed: false,
      reward0Bol: 1,
      rewardObol: 1,
      rewardXp: 1,
      reputationChangeOnSuccess: 1,
      reputationChangeOnFail: -1,
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
