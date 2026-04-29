import {
  AGENT_OS_HEAT_LIMIT,
  AGENT_OS_UNLOCK_RANK,
  FACTION_DEFINITIONS,
  getAgentOsFactionByNpcFaction,
  getAgentOsFactionGate,
  getAgentOsGateProgress,
  getFactionContractSignal,
  getFactionContractStage,
  getFactionStanding,
  getFactionSwitchRule,
  getNextFactionChoice,
  getOsTierForRank,
} from "../factions";

describe("AgentOS faction contract", () => {
  it("defines four deterministic launch factions with gameplay stakes", () => {
    expect(FACTION_DEFINITIONS).toHaveLength(4);
    expect(FACTION_DEFINITIONS.map((faction) => faction.id)).toEqual([
      "FREE_SPLINTERS",
      "BLACKWAKE",
      "NULL_CROWN",
      "ARCHIVISTS",
    ]);

    for (const faction of FACTION_DEFINITIONS) {
      expect(faction.unlockRank).toBe(AGENT_OS_UNLOCK_RANK);
      expect(faction.gameplayStake.length).toBeGreaterThan(20);
      expect(faction.missionBias.length).toBeGreaterThan(0);
      expect(faction.rewardModifier).toBeGreaterThanOrEqual(1);
      expect(faction.contractChain).toHaveLength(4);
    }
  });

  it("keeps the AgentOS gate testable from rank, first-profit, and Heat", () => {
    const blockedGate = getAgentOsFactionGate({
      rank: AGENT_OS_UNLOCK_RANK - 1,
      firstTradeComplete: true,
      heat: AGENT_OS_HEAT_LIMIT,
      faction: null,
    });

    expect(blockedGate).toMatchObject({
      osTier: "PIRATE",
      unlocked: false,
      canChooseFaction: false,
    });
    expect(getAgentOsGateProgress(blockedGate)).toEqual({
      completed: 2,
      total: 3,
      percent: 67,
    });

    expect(getAgentOsFactionGate({
      rank: AGENT_OS_UNLOCK_RANK,
      firstTradeComplete: true,
      heat: AGENT_OS_HEAT_LIMIT,
      faction: null,
    })).toMatchObject({
      osTier: "AGENT",
      unlocked: true,
      canChooseFaction: true,
    });

    expect(getAgentOsFactionGate({
      rank: AGENT_OS_UNLOCK_RANK,
      firstTradeComplete: true,
      heat: AGENT_OS_HEAT_LIMIT + 1,
      faction: null,
    }).unlocked).toBe(false);
  });

  it("maps current NPC faction labels onto AgentOS launch factions", () => {
    expect(getAgentOsFactionByNpcFaction("Blackwake")).toBe("BLACKWAKE");
    expect(getAgentOsFactionByNpcFaction("Archivists")).toBe("ARCHIVISTS");
    expect(getAgentOsFactionByNpcFaction("Null Crown")).toBe("NULL_CROWN");
    expect(getAgentOsFactionByNpcFaction("Pantheon")).toBeNull();
    expect(getAgentOsFactionByNpcFaction("Eclipse Guild")).toBeNull();
  });

  it("defines a one-free-switch faction rule", () => {
    expect(getFactionSwitchRule(null)).toMatchObject({
      canSwitch: true,
      freeSwitchAvailable: true,
    });

    expect(getFactionSwitchRule({
      faction: "BLACKWAKE",
      chosenAt: "2077-04-01T00:00:00.000Z",
      freeSwitchUsed: false,
      previousFaction: null,
    })).toMatchObject({
      canSwitch: true,
      freeSwitchAvailable: true,
    });

    expect(getFactionSwitchRule({
      faction: "ARCHIVISTS",
      chosenAt: "2077-04-01T00:00:00.000Z",
      freeSwitchUsed: true,
      previousFaction: "BLACKWAKE",
    })).toMatchObject({
      canSwitch: false,
      freeSwitchAvailable: false,
    });
  });

  it("creates a first faction choice and one later switch", () => {
    const firstChoice = getNextFactionChoice({
      currentChoice: null,
      nextFaction: "BLACKWAKE",
      chosenAt: "2077-04-01T00:00:00.000Z",
    });

    expect(firstChoice).toMatchObject({
      ok: true,
      choice: {
        faction: "BLACKWAKE",
        freeSwitchUsed: false,
        previousFaction: null,
      },
    });

    if (!firstChoice.ok) {
      throw new Error("expected first choice to be accepted");
    }

    expect(getNextFactionChoice({
      currentChoice: firstChoice.choice,
      nextFaction: "ARCHIVISTS",
      chosenAt: "2077-04-02T00:00:00.000Z",
    })).toMatchObject({
      ok: true,
      choice: {
        faction: "ARCHIVISTS",
        freeSwitchUsed: true,
        previousFaction: "BLACKWAKE",
      },
    });

    expect(getNextFactionChoice({
      currentChoice: {
        faction: "ARCHIVISTS",
        chosenAt: "2077-04-02T00:00:00.000Z",
        freeSwitchUsed: true,
        previousFaction: "BLACKWAKE",
      },
      nextFaction: "NULL_CROWN",
      chosenAt: "2077-04-03T00:00:00.000Z",
    })).toMatchObject({
      ok: false,
    });
  });

  it("maps rank and reputation to public serializable progression contracts", () => {
    expect(getOsTierForRank(4)).toBe("PIRATE");
    expect(getOsTierForRank(5)).toBe("AGENT");
    expect(getOsTierForRank(20)).toBe("PANTHEON");

    expect(getFactionStanding("NULL_CROWN", 53)).toMatchObject({
      faction: "NULL_CROWN",
      reputation: 53,
      tier: "favored",
      rewardModifier: 1.12,
    });
  });

  it("maps faction reputation onto contract-chain stages and player-facing signals", () => {
    expect(getFactionContractStage({
      faction: "BLACKWAKE",
      reputation: 0,
    })).toMatchObject({
      id: "initiation",
      label: "Dockside Favor",
      reputationDelta: 2,
    });

    expect(getFactionContractSignal({
      faction: "BLACKWAKE",
      reputation: 52,
    })).toMatchObject({
      faction: "BLACKWAKE",
      factionName: "Blackwake",
      stageId: "favored_cell",
      stageLabel: "Blackwake Wake",
      heatPosture: "high",
      reputationDelta: 4,
      rewardModifier: 1.08,
      routePressure: {
        label: "HOT CARGO",
        rewardMultiplier: 1.11,
        timeMultiplier: 0.86,
        successHeatDelta: 3,
        failureHeatDelta: 5,
      },
    });
  });
});
