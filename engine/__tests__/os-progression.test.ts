import {
  AGENT_OS_NAME,
  PANTHEON_OS_NAME,
  PIRATE_OS_NAME,
  getOsProgressionState,
} from "@/engine/os-progression";

describe("OS progression contract", () => {
  it("defines the three OS acts in launch order", () => {
    const state = getOsProgressionState({
      rank: 1,
      firstTradeComplete: false,
      heat: 6,
      faction: null,
      npcReputation: {},
    });

    expect(state.tiers.map((tier) => tier.name)).toEqual([
      PIRATE_OS_NAME,
      AGENT_OS_NAME,
      PANTHEON_OS_NAME,
    ]);
    expect(state.activeTier).toBe("PIRATE");
    expect(state.nextTier).toBe("AGENT");
    expect(state.tiers[0]).toMatchObject({
      id: "PIRATE",
      status: "active",
      progressPercent: 100,
    });
  });

  it("marks AgentOS ready only after rank, profit, and Heat gates are clean", () => {
    const blocked = getOsProgressionState({
      rank: 5,
      firstTradeComplete: false,
      heat: 18,
      faction: null,
      npcReputation: {},
    });
    const ready = getOsProgressionState({
      rank: 5,
      firstTradeComplete: true,
      heat: 70,
      faction: null,
      npcReputation: {},
    });

    expect(blocked.tiers.find((tier) => tier.id === "AGENT")).toMatchObject({
      status: "locked",
      progressPercent: 67,
    });
    expect(ready.tiers.find((tier) => tier.id === "AGENT")).toMatchObject({
      status: "ready",
      progressPercent: 100,
    });
    expect(ready.activeTier).toBe("AGENT");
    expect(ready.nextAction).toContain("bind a faction");
  });

  it("marks PantheonOS ready at rank 20 with faction and shard signal", () => {
    const state = getOsProgressionState({
      rank: 20,
      firstTradeComplete: true,
      heat: 34,
      faction: "ARCHIVISTS",
      npcReputation: {
        librarian: 62,
        kite: 48,
      },
    });

    expect(state.activeTier).toBe("PANTHEON");
    expect(state.nextTier).toBeNull();
    expect(state.pantheonReadiness.ready).toBe(true);
    expect(state.pantheonReadiness.shardSignal).toBe(110);
    expect(state.tiers.find((tier) => tier.id === "PANTHEON")).toMatchObject({
      status: "ready",
      progressPercent: 100,
    });
    expect(state.nextAction).toContain("open the Neon Void map");
  });
});
