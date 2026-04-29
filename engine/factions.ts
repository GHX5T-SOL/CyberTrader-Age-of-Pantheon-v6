import type {
  AgentOsFactionGate,
  Faction,
  FactionChoice,
  FactionContractSignal,
  FactionContractStage,
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
      },
      {
        id: "trusted_route",
        label: "Mutual Aid Route",
        tier: "trusted",
        heatPosture: "low",
        routeConsequence: "Recovery contracts favor clean delivery.",
        reputationDelta: 3,
      },
      {
        id: "favored_cell",
        label: "Local Cell Escort",
        tier: "favored",
        heatPosture: "low",
        routeConsequence: "Courier pressure softens after safe runs.",
        reputationDelta: 4,
      },
      {
        id: "legend_signal",
        label: "Free Shard Signal",
        tier: "legend",
        heatPosture: "medium",
        routeConsequence: "PantheonOS influence starts listening.",
        reputationDelta: 5,
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
      },
      {
        id: "trusted_route",
        label: "Convoy Claim",
        tier: "trusted",
        heatPosture: "medium",
        routeConsequence: "Timed cargo rewards climb.",
        reputationDelta: 3,
      },
      {
        id: "favored_cell",
        label: "Blackwake Wake",
        tier: "favored",
        heatPosture: "high",
        routeConsequence: "Smuggler missions add sharper Heat pressure.",
        reputationDelta: 4,
      },
      {
        id: "legend_signal",
        label: "Captain's Ledger",
        tier: "legend",
        heatPosture: "high",
        routeConsequence: "Priority cargo lanes surface.",
        reputationDelta: 5,
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
      },
      {
        id: "trusted_route",
        label: "Ghost Court Writ",
        tier: "trusted",
        heatPosture: "high",
        routeConsequence: "Contraband timing windows get tighter.",
        reputationDelta: 3,
      },
      {
        id: "favored_cell",
        label: "Null Warrant",
        tier: "favored",
        heatPosture: "high",
        routeConsequence: "Blind-spot routes pay for clean nerve.",
        reputationDelta: 4,
      },
      {
        id: "legend_signal",
        label: "Crownless Signal",
        tier: "legend",
        heatPosture: "high",
        routeConsequence: "PantheonOS shadow leverage unlocks later.",
        reputationDelta: 5,
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
      },
      {
        id: "trusted_route",
        label: "Archive Index",
        tier: "trusted",
        heatPosture: "low",
        routeConsequence: "ORRS and SNPS clue chains surface.",
        reputationDelta: 3,
      },
      {
        id: "favored_cell",
        label: "Vault Custody",
        tier: "favored",
        heatPosture: "low",
        routeConsequence: "Long-hold contracts earn safer trust.",
        reputationDelta: 4,
      },
      {
        id: "legend_signal",
        label: "Deep Catalog",
        tier: "legend",
        heatPosture: "medium",
        routeConsequence: "Shard-memory lore branches later.",
        reputationDelta: 5,
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
  };
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
