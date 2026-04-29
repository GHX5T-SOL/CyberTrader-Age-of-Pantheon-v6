import type {
  AgentOsFactionGate,
  Faction,
  FactionChoice,
  FactionContractSignal,
  FactionContractStage,
  FactionRoutePressure,
  FactionStanding,
  FactionSwitchRule,
  MissionType,
  OsTier,
} from "@/engine/types";

export interface FactionDefinition {
  id: Faction;
  name: string;
  handle: string;
  unlockRank: number;
  ethos: string;
  gameplayStake: string;
  missionBias: readonly MissionType[];
  rewardModifier: number;
  heatPosture: "low" | "medium" | "high";
  contractChain: readonly FactionContractStage[];
}

export const AGENT_OS_UNLOCK_RANK = 5;
export const AGENT_OS_HEAT_LIMIT = 70;

const ROUTE_PRESSURE = {
  safeLane: {
    label: "SAFE LANE",
    rewardMultiplier: 1,
    timeMultiplier: 1.1,
    successHeatDelta: -1,
    failureHeatDelta: 1,
  },
  recoveryBuffer: {
    label: "RECOVERY BUFFER",
    rewardMultiplier: 1.03,
    timeMultiplier: 1.12,
    successHeatDelta: -2,
    failureHeatDelta: 1,
  },
  courierSoften: {
    label: "COURIER SOFTEN",
    rewardMultiplier: 1.05,
    timeMultiplier: 1.15,
    successHeatDelta: -3,
    failureHeatDelta: 0,
  },
  signalEscort: {
    label: "SIGNAL ESCORT",
    rewardMultiplier: 1.08,
    timeMultiplier: 1.06,
    successHeatDelta: -2,
    failureHeatDelta: 2,
  },
  convoyRush: {
    label: "CONVOY RUSH",
    rewardMultiplier: 1.04,
    timeMultiplier: 0.95,
    successHeatDelta: 1,
    failureHeatDelta: 2,
  },
  timedHaul: {
    label: "TIMED HAUL",
    rewardMultiplier: 1.07,
    timeMultiplier: 0.9,
    successHeatDelta: 2,
    failureHeatDelta: 3,
  },
  hotCargo: {
    label: "HOT CARGO",
    rewardMultiplier: 1.11,
    timeMultiplier: 0.86,
    successHeatDelta: 3,
    failureHeatDelta: 5,
  },
  priorityLane: {
    label: "PRIORITY LANE",
    rewardMultiplier: 1.15,
    timeMultiplier: 0.82,
    successHeatDelta: 4,
    failureHeatDelta: 6,
  },
  blindSpot: {
    label: "BLIND-SPOT",
    rewardMultiplier: 1.06,
    timeMultiplier: 0.92,
    successHeatDelta: 2,
    failureHeatDelta: 4,
  },
  tightWindow: {
    label: "TIGHT WINDOW",
    rewardMultiplier: 1.1,
    timeMultiplier: 0.86,
    successHeatDelta: 3,
    failureHeatDelta: 5,
  },
  shadowPremium: {
    label: "SHADOW PREMIUM",
    rewardMultiplier: 1.14,
    timeMultiplier: 0.8,
    successHeatDelta: 4,
    failureHeatDelta: 7,
  },
  voidLeverage: {
    label: "VOID LEVERAGE",
    rewardMultiplier: 1.18,
    timeMultiplier: 0.78,
    successHeatDelta: 5,
    failureHeatDelta: 8,
  },
  patientIndex: {
    label: "PATIENT INDEX",
    rewardMultiplier: 1.02,
    timeMultiplier: 1.08,
    successHeatDelta: -1,
    failureHeatDelta: 1,
  },
  clueChain: {
    label: "CLUE CHAIN",
    rewardMultiplier: 1.05,
    timeMultiplier: 1.12,
    successHeatDelta: -2,
    failureHeatDelta: 1,
  },
  custodyBuffer: {
    label: "CUSTODY BUFFER",
    rewardMultiplier: 1.07,
    timeMultiplier: 1.15,
    successHeatDelta: -3,
    failureHeatDelta: 1,
  },
  deepCatalog: {
    label: "DEEP CATALOG",
    rewardMultiplier: 1.1,
    timeMultiplier: 1.05,
    successHeatDelta: -2,
    failureHeatDelta: 2,
  },
} as const satisfies Record<string, FactionRoutePressure>;

export const FACTION_DEFINITIONS: readonly FactionDefinition[] = [
  {
    id: "FREE_SPLINTERS",
    name: "Free Splinters",
    handle: "pirate mutuals",
    unlockRank: AGENT_OS_UNLOCK_RANK,
    ethos: "Keep the shard free, keep the route small, keep the deck local.",
    gameplayStake: "Safer recovery contracts and lower-risk delivery pressure.",
    missionBias: ["delivery", "intel_drop"],
    rewardModifier: 1,
    heatPosture: "low",
    contractChain: [
      {
        id: "initiation",
        label: "Safehouse Handshake",
        tier: "neutral",
        heatPosture: "low",
        routeConsequence: "Starter lanes stay shielded.",
        reputationDelta: 2,
        routePressure: ROUTE_PRESSURE.safeLane,
      },
      {
        id: "trusted_route",
        label: "Mutual Aid Route",
        tier: "trusted",
        heatPosture: "low",
        routeConsequence: "Recovery contracts favor clean delivery.",
        reputationDelta: 3,
        routePressure: ROUTE_PRESSURE.recoveryBuffer,
      },
      {
        id: "favored_cell",
        label: "Local Cell Escort",
        tier: "favored",
        heatPosture: "low",
        routeConsequence: "Courier pressure softens after safe runs.",
        reputationDelta: 4,
        routePressure: ROUTE_PRESSURE.courierSoften,
      },
      {
        id: "legend_signal",
        label: "Free Shard Signal",
        tier: "legend",
        heatPosture: "medium",
        routeConsequence: "PantheonOS influence starts listening.",
        reputationDelta: 5,
        routePressure: ROUTE_PRESSURE.signalEscort,
      },
    ],
  },
  {
    id: "BLACKWAKE",
    name: "Blackwake",
    handle: "smuggler captains",
    unlockRank: AGENT_OS_UNLOCK_RANK,
    ethos: "Move cargo before the eAgents understand what disappeared.",
    gameplayStake: "Higher courier upside with sharper timing and route risk.",
    missionBias: ["delivery", "buy_request"],
    rewardModifier: 1.08,
    heatPosture: "medium",
    contractChain: [
      {
        id: "initiation",
        label: "Dockside Favor",
        tier: "neutral",
        heatPosture: "medium",
        routeConsequence: "Short PGAS and FDST convoy work opens.",
        reputationDelta: 2,
        routePressure: ROUTE_PRESSURE.convoyRush,
      },
      {
        id: "trusted_route",
        label: "Convoy Claim",
        tier: "trusted",
        heatPosture: "medium",
        routeConsequence: "Timed cargo rewards climb.",
        reputationDelta: 3,
        routePressure: ROUTE_PRESSURE.timedHaul,
      },
      {
        id: "favored_cell",
        label: "Blackwake Wake",
        tier: "favored",
        heatPosture: "high",
        routeConsequence: "Smuggler missions add sharper Heat pressure.",
        reputationDelta: 4,
        routePressure: ROUTE_PRESSURE.hotCargo,
      },
      {
        id: "legend_signal",
        label: "Captain's Ledger",
        tier: "legend",
        heatPosture: "high",
        routeConsequence: "Priority cargo lanes surface.",
        reputationDelta: 5,
        routePressure: ROUTE_PRESSURE.priorityLane,
      },
    ],
  },
  {
    id: "NULL_CROWN",
    name: "Null Crown",
    handle: "ghost court",
    unlockRank: AGENT_OS_UNLOCK_RANK,
    ethos: "Trade in the blind spots and never let one signal own you.",
    gameplayStake: "Contraband-leaning contracts with stricter Heat discipline.",
    missionBias: ["hold", "intel_drop"],
    rewardModifier: 1.12,
    heatPosture: "high",
    contractChain: [
      {
        id: "initiation",
        label: "Blind-Spot Offer",
        tier: "neutral",
        heatPosture: "high",
        routeConsequence: "Hold and intel contracts demand Heat discipline.",
        reputationDelta: 2,
        routePressure: ROUTE_PRESSURE.blindSpot,
      },
      {
        id: "trusted_route",
        label: "Ghost Court Writ",
        tier: "trusted",
        heatPosture: "high",
        routeConsequence: "Contraband timing windows get tighter.",
        reputationDelta: 3,
        routePressure: ROUTE_PRESSURE.tightWindow,
      },
      {
        id: "favored_cell",
        label: "Null Warrant",
        tier: "favored",
        heatPosture: "high",
        routeConsequence: "Blind-spot routes pay for clean nerve.",
        reputationDelta: 4,
        routePressure: ROUTE_PRESSURE.shadowPremium,
      },
      {
        id: "legend_signal",
        label: "Crownless Signal",
        tier: "legend",
        heatPosture: "high",
        routeConsequence: "PantheonOS shadow leverage unlocks later.",
        reputationDelta: 5,
        routePressure: ROUTE_PRESSURE.voidLeverage,
      },
    ],
  },
  {
    id: "ARCHIVISTS",
    name: "Archivists",
    handle: "memory brokers",
    unlockRank: AGENT_OS_UNLOCK_RANK,
    ethos: "Preserve the shard. Sell the truth only after it compounds.",
    gameplayStake: "Intel and hold missions that favor patient route planning.",
    missionBias: ["hold", "intel_drop"],
    rewardModifier: 1.05,
    heatPosture: "low",
    contractChain: [
      {
        id: "initiation",
        label: "Memory Footnote",
        tier: "neutral",
        heatPosture: "low",
        routeConsequence: "Intel and hold routes favor patience.",
        reputationDelta: 2,
        routePressure: ROUTE_PRESSURE.patientIndex,
      },
      {
        id: "trusted_route",
        label: "Archive Index",
        tier: "trusted",
        heatPosture: "low",
        routeConsequence: "ORRS and SNPS clue chains surface.",
        reputationDelta: 3,
        routePressure: ROUTE_PRESSURE.clueChain,
      },
      {
        id: "favored_cell",
        label: "Vault Custody",
        tier: "favored",
        heatPosture: "low",
        routeConsequence: "Long-hold contracts earn safer trust.",
        reputationDelta: 4,
        routePressure: ROUTE_PRESSURE.custodyBuffer,
      },
      {
        id: "legend_signal",
        label: "Deep Catalog",
        tier: "legend",
        heatPosture: "medium",
        routeConsequence: "Shard-memory lore branches later.",
        reputationDelta: 5,
        routePressure: ROUTE_PRESSURE.deepCatalog,
      },
    ],
  },
] as const;

const NPC_FACTION_TO_AGENT_OS_FACTION: Record<string, Faction | null> = {
  pantheon: null,
  blackwake: "BLACKWAKE",
  archivists: "ARCHIVISTS",
  "null crown": "NULL_CROWN",
  "eclipse guild": null,
};

export function getFactionDefinition(faction: Faction): FactionDefinition {
  return FACTION_DEFINITIONS.find((candidate) => candidate.id === faction) ?? FACTION_DEFINITIONS[0]!;
}

export function getAgentOsFactionByNpcFaction(npcFaction: string): Faction | null {
  return NPC_FACTION_TO_AGENT_OS_FACTION[npcFaction.trim().toLowerCase()] ?? null;
}

export function getFactionStanding(faction: Faction, reputation: number): FactionStanding {
  const definition = getFactionDefinition(faction);
  const safeReputation = Math.max(0, Math.floor(reputation));
  const tier = safeReputation >= 100
    ? "legend"
    : safeReputation >= 50
      ? "favored"
      : safeReputation >= 15
        ? "trusted"
        : "neutral";

  return {
    faction,
    reputation: safeReputation,
    tier,
    missionBias: definition.missionBias,
    rewardModifier: definition.rewardModifier,
  };
}

export function getFactionContractStage(input: {
  faction: Faction;
  reputation: number;
}): FactionContractStage {
  const definition = getFactionDefinition(input.faction);
  const standing = getFactionStanding(input.faction, input.reputation);

  return definition.contractChain.find((stage) => stage.tier === standing.tier)
    ?? definition.contractChain[0]!;
}

export function getFactionContractSignal(input: {
  faction: Faction;
  reputation: number;
}): FactionContractSignal {
  const definition = getFactionDefinition(input.faction);
  const standing = getFactionStanding(input.faction, input.reputation);
  const stage = getFactionContractStage(input);

  return {
    faction: definition.id,
    factionName: definition.name,
    stageId: stage.id,
    stageLabel: stage.label,
    tier: standing.tier,
    heatPosture: stage.heatPosture,
    routeConsequence: stage.routeConsequence,
    reputationDelta: stage.reputationDelta,
    rewardModifier: definition.rewardModifier,
    routePressure: stage.routePressure,
  };
}

function formatSignedHeat(value: number): string {
  if (value > 0) {
    return `+${value}`;
  }

  return String(value);
}

function formatMultiplierDelta(multiplier: number): string {
  const percent = Math.round((multiplier - 1) * 100);
  if (percent > 0) {
    return `+${percent}%`;
  }
  if (percent < 0) {
    return `${percent}%`;
  }
  return "FLAT";
}

export function getFactionRoutePressureSummary(signal: FactionContractSignal): string {
  const pressure = signal.routePressure;
  return `${pressure.label} // REWARD ${formatMultiplierDelta(pressure.rewardMultiplier)} // TIMER ${formatMultiplierDelta(pressure.timeMultiplier)} // HEAT ${formatSignedHeat(pressure.successHeatDelta)}/${formatSignedHeat(pressure.failureHeatDelta)}`;
}

export function getOsTierForRank(rank: number): OsTier {
  if (rank >= 20) {
    return "PANTHEON";
  }

  if (rank >= AGENT_OS_UNLOCK_RANK) {
    return "AGENT";
  }

  return "PIRATE";
}

export function getAgentOsFactionGate(input: {
  rank: number;
  firstTradeComplete: boolean;
  heat: number;
  faction: Faction | null;
}): AgentOsFactionGate {
  const rank = Math.max(1, Math.floor(input.rank));
  const heat = Math.max(0, Math.floor(input.heat));
  const requirements = [
    {
      id: "rank" as const,
      label: `Reach rank ${AGENT_OS_UNLOCK_RANK}`,
      met: rank >= AGENT_OS_UNLOCK_RANK,
      current: rank,
      target: AGENT_OS_UNLOCK_RANK,
    },
    {
      id: "first_profit" as const,
      label: "Complete one profitable sell",
      met: input.firstTradeComplete,
      current: input.firstTradeComplete,
      target: true,
    },
    {
      id: "heat" as const,
      label: `Keep Heat at ${AGENT_OS_HEAT_LIMIT} or lower`,
      met: heat <= AGENT_OS_HEAT_LIMIT,
      current: heat,
      target: AGENT_OS_HEAT_LIMIT,
    },
  ];
  const unlocked = requirements.every((requirement) => requirement.met);
  const osTier = unlocked ? getOsTierForRank(rank) : "PIRATE";

  return {
    osTier,
    unlocked,
    canChooseFaction: unlocked && input.faction === null,
    requirements,
  };
}

export function getAgentOsGateProgress(gate: AgentOsFactionGate): {
  completed: number;
  total: number;
  percent: number;
} {
  const total = gate.requirements.length;
  const completed = gate.requirements.filter((requirement) => requirement.met).length;

  return {
    completed,
    total,
    percent: total === 0 ? 0 : Math.round((completed / total) * 100),
  };
}

export function getFactionSwitchRule(choice: FactionChoice | null): FactionSwitchRule {
  if (!choice) {
    return {
      canSwitch: true,
      freeSwitchAvailable: true,
      reason: "No faction is bound yet.",
    };
  }

  if (!choice.freeSwitchUsed) {
    return {
      canSwitch: true,
      freeSwitchAvailable: true,
      reason: "One free faction switch remains before PantheonOS locks allegiance.",
    };
  }

  return {
    canSwitch: false,
    freeSwitchAvailable: false,
    reason: "Free switch already used. Future allegiance changes require PantheonOS authority.",
  };
}

export function getNextFactionChoice(input: {
  currentChoice: FactionChoice | null;
  nextFaction: Faction;
  chosenAt: string;
}): { ok: true; choice: FactionChoice } | { ok: false; reason: string } {
  const nextDefinition = getFactionDefinition(input.nextFaction);

  if (!input.currentChoice) {
    return {
      ok: true,
      choice: {
        faction: nextDefinition.id,
        chosenAt: input.chosenAt,
        freeSwitchUsed: false,
        previousFaction: null,
      },
    };
  }

  if (input.currentChoice.faction === nextDefinition.id) {
    return {
      ok: false,
      reason: `${nextDefinition.name} is already bound.`,
    };
  }

  const switchRule = getFactionSwitchRule(input.currentChoice);
  if (!switchRule.canSwitch) {
    return {
      ok: false,
      reason: switchRule.reason,
    };
  }

  return {
    ok: true,
    choice: {
      faction: nextDefinition.id,
      chosenAt: input.chosenAt,
      freeSwitchUsed: true,
      previousFaction: input.currentChoice.faction,
    },
  };
}
