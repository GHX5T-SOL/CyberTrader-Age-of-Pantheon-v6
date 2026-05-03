import { getLocation } from "@/data/locations";
import { getNpc, getUnlockedNpcs } from "@/data/npcs";
import { roundCurrency, type PriceMap } from "@/engine/demo-market";
import {
  getAgentOsFactionByNpcFaction,
  getFactionContractSignal,
  getFactionDefinition,
  getFactionRoutePressureSummary,
} from "@/engine/factions";
import { seededStream } from "@/engine/prng";
import type { Faction, FactionContractSignal, Mission, MissionType, Position } from "@/engine/types";

const MISSION_TYPES: MissionType[] = ["delivery", "buy_request", "hold", "intel_drop"];
const MIN_PRESSURED_MISSION_MINUTES = 4;
const MAX_PRESSURED_MISSION_MINUTES = 22;

export function getNextMissionDelay(seed: string, index: number): number {
  const stream = seededStream(`${seed}:mission-delay:${index}`);
  return (10 + Math.floor(stream() * 6)) * 60_000;
}

export function createMission(input: {
  nowMs: number;
  seed: string;
  index: number;
  rankLevel: number;
  prices: PriceMap;
  rewardMultiplier?: number;
  faction?: Faction | null;
  npcReputation?: Record<string, number>;
}): Mission {
  const stream = seededStream(`${input.seed}:mission:${input.index}`);
  const npcs = getUnlockedNpcs(input.rankLevel);
  const faction = input.faction ? getFactionDefinition(input.faction) : null;
  const factionNpcPool = faction
    ? npcs.filter((npc) => getAgentOsFactionByNpcFaction(npc.faction) === faction.id)
    : [];
  const npcPool = factionNpcPool.length ? factionNpcPool : npcs;
  const missionTypes = faction?.missionBias ?? MISSION_TYPES;
  const npc = npcPool[Math.floor(stream() * npcPool.length)] ?? npcPool[0] ?? npcs[0]!;
  const type = missionTypes[Math.floor(stream() * missionTypes.length)] ?? "delivery";
  const rewardMultiplier = (input.rewardMultiplier ?? 1) * (faction?.rewardModifier ?? 1);
  const contractSignal = faction
    ? getFactionContractSignal({
        faction: faction.id,
        reputation: input.npcReputation?.[npc.id] ?? 0,
      })
    : undefined;

  if (type === "buy_request") {
    const ticker = "PGAS";
    const quantity = 20;
    const marketValue = quantity * (input.prices[ticker] ?? 91);
    return baseMission({
      input,
      npcId: npc.id,
      type,
      minutes: 8,
      title: `${npc.name}: Acquire ${ticker}`,
      description: `Acquire ${quantity} ${ticker} within 8 minutes. I'll pay 20% above current market.`,
      ticker,
      quantity,
      reward0Bol: roundCurrency(marketValue * 1.2 * rewardMultiplier),
      rewardXp: 70,
      contractSignal,
    });
  }

  if (type === "hold") {
    return baseMission({
      input,
      npcId: npc.id,
      type,
      minutes: 15,
      title: `${npc.name}: Hold Your Nerve`,
      description: "Hold 50 NGLS for 15 minutes without selling. Can you stomach volatility?",
      ticker: "NGLS",
      quantity: 50,
      reward0Bol: roundCurrency(15_000 * rewardMultiplier),
      rewardXp: 90,
      contractSignal,
    });
  }

  if (type === "intel_drop") {
    const destination = getLocation("tech_valley");
    return baseMission({
      input,
      npcId: npc.id,
      type,
      minutes: 5,
      title: `${npc.name}: Intel Drop`,
      description: `Visit ${destination.name} within 5 minutes. I have price-moving information.`,
      destinationId: destination.id,
      reward0Bol: roundCurrency(7_500 * rewardMultiplier),
      rewardXp: 60,
      contractSignal,
    });
  }

  const ticker = "FDST";
  const quantity = 30;
  const destination = getLocation("the_port");
  const marketValue = quantity * (input.prices[ticker] ?? 138);
  return baseMission({
    input,
    npcId: npc.id,
    type: "delivery",
    minutes: 12,
    title: `${npc.name}: Port Delivery`,
    description: `Bring ${quantity} ${ticker} to ${destination.name} in 12 minutes. Reward: 1.5x market value + 5,000 bonus.`,
    ticker,
    quantity,
    destinationId: destination.id,
    reward0Bol: roundCurrency((marketValue * 1.5 + 5000) * rewardMultiplier),
    rewardXp: 80,
    contractSignal,
  });
}

export function getMissionProgress(input: {
  mission: Mission;
  positions: Record<string, Position>;
  currentLocationId: string;
  nowMs: number;
}): {
  progress: number;
  target: number;
  complete: boolean;
  failed: boolean;
} {
  const mission = input.mission;
  const quantity = mission.requiredQuantity ?? mission.quantity ?? 1;
  const ticker = mission.requiredTicker ?? mission.ticker;
  const destinationId = mission.destinationLocationId ?? mission.destinationId;
  const held = ticker ? input.positions[ticker]?.quantity ?? 0 : 0;
  const atDestination = !destinationId || destinationId === input.currentLocationId;
  const expired = input.nowMs >= mission.expiresAtTimestamp;

  if (mission.type === "delivery") {
    return {
      progress: Math.min(quantity, atDestination ? held : 0),
      target: quantity,
      complete: atDestination && held >= quantity,
      failed: expired,
    };
  }

  if (mission.type === "buy_request") {
    return {
      progress: Math.min(quantity, held),
      target: quantity,
      complete: held >= quantity,
      failed: expired,
    };
  }

  if (mission.type === "hold") {
    return {
      progress: Math.min(quantity, held),
      target: quantity,
      complete: expired && held >= quantity,
      failed: expired && held < quantity,
    };
  }

  return {
    progress: atDestination ? 1 : 0,
    target: 1,
    complete: atDestination,
    failed: expired,
  };
}

function baseMission(input: {
  input: {
    nowMs: number;
    seed: string;
    index: number;
  };
  npcId: string;
  type: MissionType;
  minutes: number;
  title: string;
  description: string;
  ticker?: string;
  quantity?: number;
  destinationId?: string;
  reward0Bol: number;
  rewardXp: number;
  contractSignal?: FactionContractSignal;
}): Mission {
  const npc = getNpc(input.npcId);
  const pressure = input.contractSignal?.routePressure;
  const routeMinutes = pressure
    ? Math.min(
        MAX_PRESSURED_MISSION_MINUTES,
        Math.max(MIN_PRESSURED_MISSION_MINUTES, Math.round(input.minutes * pressure.timeMultiplier)),
      )
    : input.minutes;
  const reward0Bol = roundCurrency(input.reward0Bol * (pressure?.rewardMultiplier ?? 1));
  const routePressureSummary = input.contractSignal
    ? getFactionRoutePressureSummary(input.contractSignal)
    : undefined;
  const expiresAtTimestamp = input.input.nowMs + routeMinutes * 60_000;
  return {
    id: `mission_${input.input.nowMs}_${input.input.index}`,
    npcId: input.npcId,
    npcName: npc.name,
    type: input.type,
    title: input.title,
    description: input.description,
    requiredTicker: input.ticker,
    requiredQuantity: input.quantity,
    destinationLocationId: input.destinationId,
    reward0Bol,
    rewardXp: input.rewardXp,
    reputationChangeOnSuccess: input.contractSignal?.reputationDelta ?? 2,
    reputationChangeOnFail: -Math.max(1, Math.ceil((input.contractSignal?.reputationDelta ?? 2) / 2)),
    contractSignal: input.contractSignal,
    routePressureSummary,
    routeRewardMultiplier: pressure?.rewardMultiplier,
    routeTimeMultiplier: pressure?.timeMultiplier,
    routeHeatDeltaOnSuccess: pressure?.successHeatDelta,
    routeHeatDeltaOnFail: pressure?.failureHeatDelta,
    expiresAtTimestamp,
    accepted: false,
    completed: false,
    failed: false,
    status: "pending",
    objective: input.description,
    ticker: input.ticker,
    quantity: input.quantity,
    destinationId: input.destinationId,
    startTimestamp: input.input.nowMs,
    endTimestamp: expiresAtTimestamp,
    rewardObol: reward0Bol,
    reputationDelta: input.contractSignal?.reputationDelta ?? 2,
  };
}
