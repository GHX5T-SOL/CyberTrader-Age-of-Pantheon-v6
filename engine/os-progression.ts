import {
  AGENT_OS_HEAT_LIMIT,
  getAgentOsFactionGate,
  getAgentOsGateProgress,
} from "@/engine/factions";
import type { Faction, FactionChoiceRequirement, OsTier } from "@/engine/types";

export const PIRATE_OS_NAME = "Ag3nt_0S//pIRAT3";
export const AGENT_OS_NAME = "AgentOS";
export const PANTHEON_OS_NAME = "PantheonOS";

export const PANTHEON_OS_UNLOCK_RANK = 20;
export const PANTHEON_OS_SHARD_SIGNAL_TARGET = 100;
export const PANTHEON_OS_HEAT_LIMIT = 90;

export type OsTierStatus = "locked" | "ready" | "active" | "complete";

export interface OsProgressionRequirement {
  id: string;
  label: string;
  met: boolean;
  current: number | boolean | string | null;
  target: number | boolean | string;
}

export interface OsTierProgression {
  id: OsTier;
  name: string;
  status: OsTierStatus;
  progressPercent: number;
  rankRequired: number;
  narrativeLine: string;
  capabilities: readonly string[];
  requirements: readonly OsProgressionRequirement[];
}

export interface PantheonReadiness {
  ready: boolean;
  shardSignal: number;
  progressPercent: number;
  requirements: readonly OsProgressionRequirement[];
}

export interface OsProgressionState {
  activeTier: OsTier;
  nextTier: Exclude<OsTier, "PIRATE"> | null;
  nextAction: string;
  tiers: readonly OsTierProgression[];
  pantheonReadiness: PantheonReadiness;
}

export interface OsProgressionInput {
  rank: number;
  firstTradeComplete: boolean;
  heat: number;
  faction: Faction | null;
  npcReputation?: Record<string, number>;
}

const PIRATE_CAPABILITIES = [
  "S1LKROAD trading",
  "LocalAuthority ledger",
  "Heat and Energy survival loop",
] as const;

const AGENT_CAPABILITIES = [
  "Faction binding",
  "Contract-chain missions",
  "Limit orders and pressure windows",
] as const;

const PANTHEON_CAPABILITIES = [
  "Neon Void territory map",
  "Shard reconstruction",
  "Crew warfare command layer",
] as const;

function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function countProgress(requirements: readonly { met: boolean }[]): number {
  if (!requirements.length) {
    return 0;
  }

  return clampPercent((requirements.filter((requirement) => requirement.met).length / requirements.length) * 100);
}

function sumShardSignal(reputation: Record<string, number> | undefined): number {
  return Object.values(reputation ?? {}).reduce((total, value) => {
    if (!Number.isFinite(value)) {
      return total;
    }

    return total + Math.max(0, Math.floor(value));
  }, 0);
}

function mapAgentRequirements(
  requirements: readonly FactionChoiceRequirement[],
): OsProgressionRequirement[] {
  return requirements.map((requirement) => ({
    id: requirement.id,
    label: requirement.label,
    met: requirement.met,
    current: requirement.current,
    target: requirement.target,
  }));
}

export function getPantheonReadiness(input: OsProgressionInput): PantheonReadiness {
  const rank = Math.max(1, Math.floor(input.rank));
  const heat = Math.max(0, Math.floor(input.heat));
  const shardSignal = sumShardSignal(input.npcReputation);
  const requirements: OsProgressionRequirement[] = [
    {
      id: "rank",
      label: `Reach rank ${PANTHEON_OS_UNLOCK_RANK}`,
      met: rank >= PANTHEON_OS_UNLOCK_RANK,
      current: rank,
      target: PANTHEON_OS_UNLOCK_RANK,
    },
    {
      id: "faction",
      label: "Bind an AgentOS faction",
      met: input.faction !== null,
      current: input.faction,
      target: true,
    },
    {
      id: "shard_signal",
      label: `Collect ${PANTHEON_OS_SHARD_SIGNAL_TARGET} shard signal`,
      met: shardSignal >= PANTHEON_OS_SHARD_SIGNAL_TARGET,
      current: shardSignal,
      target: PANTHEON_OS_SHARD_SIGNAL_TARGET,
    },
    {
      id: "heat",
      label: `Keep Heat at ${PANTHEON_OS_HEAT_LIMIT} or lower`,
      met: heat <= PANTHEON_OS_HEAT_LIMIT,
      current: heat,
      target: PANTHEON_OS_HEAT_LIMIT,
    },
  ];

  return {
    ready: requirements.every((requirement) => requirement.met),
    shardSignal,
    progressPercent: countProgress(requirements),
    requirements,
  };
}

function getNextAction(input: {
  agentUnlocked: boolean;
  faction: Faction | null;
  pantheonReadiness: PantheonReadiness;
}): string {
  if (!input.agentUnlocked) {
    return `Stabilize PirateOS: rank up, bank one profitable sell, and keep Heat <= ${AGENT_OS_HEAT_LIMIT}.`;
  }

  if (!input.faction) {
    return "AgentOS ready: bind a faction from the OS Upgrade Path.";
  }

  if (!input.pantheonReadiness.ready) {
    const missing = input.pantheonReadiness.requirements.find((requirement) => !requirement.met);
    return `Build PantheonOS: ${missing?.label ?? "restore shard signal"}.`;
  }

  return "PantheonOS ready: open the Neon Void map and begin shard reconstruction.";
}

export function getOsProgressionState(input: OsProgressionInput): OsProgressionState {
  const rank = Math.max(1, Math.floor(input.rank));
  const heat = Math.max(0, Math.floor(input.heat));
  const agentGate = getAgentOsFactionGate({
    rank,
    firstTradeComplete: input.firstTradeComplete,
    heat,
    faction: input.faction,
  });
  const agentProgress = getAgentOsGateProgress(agentGate);
  const agentRequirements = mapAgentRequirements(agentGate.requirements);
  const pantheonReadiness = getPantheonReadiness({
    ...input,
    rank,
    heat,
  });
  const activeTier: OsTier = pantheonReadiness.ready
    ? "PANTHEON"
    : agentGate.unlocked
      ? "AGENT"
      : "PIRATE";
  const nextTier: Exclude<OsTier, "PIRATE"> | null = !agentGate.unlocked
    ? "AGENT"
    : pantheonReadiness.ready
      ? null
      : "PANTHEON";
  const agentStatus: OsTierStatus = !agentGate.unlocked
    ? "locked"
    : activeTier === "PANTHEON"
      ? "complete"
      : input.faction
        ? "active"
        : "ready";

  return {
    activeTier,
    nextTier,
    nextAction: getNextAction({
      agentUnlocked: agentGate.unlocked,
      faction: input.faction,
      pantheonReadiness,
    }),
    pantheonReadiness,
    tiers: [
      {
        id: "PIRATE",
        name: PIRATE_OS_NAME,
        status: activeTier === "PIRATE" ? "active" : "complete",
        progressPercent: 100,
        rankRequired: 1,
        narrativeLine: "stolen tools, noisy signal, survival through the first market loop.",
        capabilities: PIRATE_CAPABILITIES,
        requirements: [],
      },
      {
        id: "AGENT",
        name: AGENT_OS_NAME,
        status: agentStatus,
        progressPercent: agentProgress.percent,
        rankRequired: 5,
        narrativeLine: "clean faction layer, contract pressure, and route intelligence.",
        capabilities: AGENT_CAPABILITIES,
        requirements: agentRequirements,
      },
      {
        id: "PANTHEON",
        name: PANTHEON_OS_NAME,
        status: pantheonReadiness.ready ? "ready" : "locked",
        progressPercent: pantheonReadiness.progressPercent,
        rankRequired: PANTHEON_OS_UNLOCK_RANK,
        narrativeLine: "memory returns, Neon Void territory opens, other shards answer.",
        capabilities: PANTHEON_CAPABILITIES,
        requirements: pantheonReadiness.requirements,
      },
    ],
  };
}
