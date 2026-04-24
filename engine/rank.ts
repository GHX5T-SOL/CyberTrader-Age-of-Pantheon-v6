import type { RankSnapshot } from "@/engine/types";

export const RANK_TABLE = [
  { level: 1, title: "Boot Ghost", xpRequired: 0, inventorySlots: 5 },
  { level: 2, title: "Packet Rat", xpRequired: 200, inventorySlots: 6 },
  { level: 3, title: "Signal Runner", xpRequired: 500, inventorySlots: 7 },
  { level: 4, title: "Black Terminal", xpRequired: 1000, inventorySlots: 8 },
  { level: 5, title: "Node Thief", xpRequired: 2000, inventorySlots: 10 },
  { level: 6, title: "Cipher Strider", xpRequired: 3200, inventorySlots: 11 },
  { level: 7, title: "Mirror Broker", xpRequired: 4700, inventorySlots: 12 },
  { level: 8, title: "Route Phantom", xpRequired: 6500, inventorySlots: 13 },
  { level: 9, title: "Null Runner", xpRequired: 8600, inventorySlots: 14 },
  { level: 10, title: "Signal Baron", xpRequired: 11000, inventorySlots: 15 },
  { level: 12, title: "Grid Smuggler", xpRequired: 17000, inventorySlots: 17 },
  { level: 15, title: "Shard Broker", xpRequired: 31000, inventorySlots: 20 },
  { level: 20, title: "Pantheon Candidate", xpRequired: 75000, inventorySlots: 25 },
  { level: 25, title: "Void Regent", xpRequired: 145000, inventorySlots: 30 },
  { level: 30, title: "Neon Warlord", xpRequired: 250000, inventorySlots: 36 },
] as const;

export function getRankByXP(xp: number) {
  const safeXp = Math.max(0, Math.floor(xp));
  return [...RANK_TABLE]
    .reverse()
    .find((rank) => safeXp >= rank.xpRequired) ?? RANK_TABLE[0];
}

export function getInventorySlots(level: number): number {
  const exact = RANK_TABLE.find((rank) => rank.level === level);
  if (exact) {
    return exact.inventorySlots;
  }

  const nearest = [...RANK_TABLE]
    .reverse()
    .find((rank) => level >= rank.level);

  return nearest?.inventorySlots ?? 5;
}

export function getRankSnapshot(xp: number): RankSnapshot {
  const rank = getRankByXP(xp);
  const nextRank = RANK_TABLE.find((candidate) => candidate.xpRequired > rank.xpRequired) ?? null;

  return {
    rank: rank.level,
    level: rank.level,
    title: rank.title,
    xp: Math.max(0, Math.floor(xp)),
    xpRequired: rank.xpRequired,
    nextXpRequired: nextRank?.xpRequired ?? null,
    inventorySlots: rank.inventorySlots,
  };
}

export function getTradeXp(input: {
  realizedPnl: number;
  isFirstProfitableTradeToday: boolean;
}): number {
  if (input.realizedPnl > 0) {
    return (
      50 +
      Math.floor(input.realizedPnl / 1000) +
      (input.isFirstProfitableTradeToday ? 50 : 0)
    );
  }

  if (input.realizedPnl === 0) {
    return 10;
  }

  return 5;
}
