import { getLocation } from "@/data/locations";
import { getUnlockedNpcs } from "@/data/npcs";
import { roundCurrency, type PriceMap } from "@/engine/demo-market";
import { seededStream } from "@/engine/prng";
import type { Mission, MissionType, Position } from "@/engine/types";

const MISSION_TYPES: MissionType[] = ["DELIVERY", "BUY_REQUEST", "HOLD", "INTEL_DROP"];

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
}): Mission {
  const stream = seededStream(`${input.seed}:mission:${input.index}`);
  const npcs = getUnlockedNpcs(input.rankLevel);
  const npc = npcs[Math.floor(stream() * npcs.length)] ?? npcs[0]!;
  const type = MISSION_TYPES[Math.floor(stream() * MISSION_TYPES.length)] ?? "DELIVERY";

  if (type === "BUY_REQUEST") {
    const ticker = "PGAS";
    const quantity = 20;
    const marketValue = quantity * (input.prices[ticker] ?? 91);
    return baseMission({
      input,
      npcId: npc.id,
      type,
      minutes: 8,
      title: `${npc.name}: Acquire ${ticker}`,
      objective: `Acquire ${quantity} ${ticker} within 8 minutes. Pays 20% above market.`,
      ticker,
      quantity,
      rewardObol: roundCurrency(marketValue * 1.2),
      rewardXp: 70,
    });
  }

  if (type === "HOLD") {
    return baseMission({
      input,
      npcId: npc.id,
      type,
      minutes: 15,
      title: `${npc.name}: Hold Your Nerve`,
      objective: "Hold 50 NGLS for 15 minutes without selling.",
      ticker: "NGLS",
      quantity: 50,
      rewardObol: 15_000,
      rewardXp: 90,
    });
  }

  if (type === "INTEL_DROP") {
    const destination = getLocation("tech_valley");
    return baseMission({
      input,
      npcId: npc.id,
      type,
      minutes: 5,
      title: `${npc.name}: Intel Drop`,
      objective: `Visit ${destination.name} within 5 minutes. Price intel is hot.`,
      destinationId: destination.id,
      rewardObol: 7_500,
      rewardXp: 60,
    });
  }

  const ticker = "FDST";
  const quantity = 30;
  const destination = getLocation("the_port");
  const marketValue = quantity * (input.prices[ticker] ?? 138);
  return baseMission({
    input,
    npcId: npc.id,
    type: "DELIVERY",
    minutes: 12,
    title: `${npc.name}: Port Delivery`,
    objective: `Bring ${quantity} ${ticker} to ${destination.name} in 12 minutes.`,
    ticker,
    quantity,
    destinationId: destination.id,
    rewardObol: roundCurrency(marketValue * 1.5 + 5000),
    rewardXp: 80,
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
  const quantity = mission.quantity ?? 1;
  const held = mission.ticker ? input.positions[mission.ticker]?.quantity ?? 0 : 0;
  const atDestination = !mission.destinationId || mission.destinationId === input.currentLocationId;
  const expired = input.nowMs >= mission.endTimestamp;

  if (mission.type === "DELIVERY") {
    return {
      progress: Math.min(quantity, atDestination ? held : 0),
      target: quantity,
      complete: atDestination && held >= quantity,
      failed: expired,
    };
  }

  if (mission.type === "BUY_REQUEST") {
    return {
      progress: Math.min(quantity, held),
      target: quantity,
      complete: held >= quantity,
      failed: expired,
    };
  }

  if (mission.type === "HOLD") {
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
  objective: string;
  ticker?: string;
  quantity?: number;
  destinationId?: string;
  rewardObol: number;
  rewardXp: number;
}): Mission {
  return {
    id: `mission_${input.input.nowMs}_${input.input.index}`,
    npcId: input.npcId,
    type: input.type,
    status: "pending",
    title: input.title,
    objective: input.objective,
    ticker: input.ticker,
    quantity: input.quantity,
    destinationId: input.destinationId,
    startTimestamp: input.input.nowMs,
    endTimestamp: input.input.nowMs + input.minutes * 60_000,
    rewardObol: input.rewardObol,
    rewardXp: input.rewardXp,
    reputationDelta: 2,
  };
}
