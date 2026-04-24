export const NPCS = [
  {
    id: "kite",
    name: "Kite",
    faction: "Blackwake",
    personality: "Impatient smuggler captain. Pays well. Hates delays.",
    unlockedAtRank: 1,
  },
  {
    id: "librarian",
    name: "The Librarian",
    faction: "Archivists",
    personality: "Memory broker. Speaks in fragments. Rewards intel.",
    unlockedAtRank: 3,
  },
  {
    id: "verdigris",
    name: "Verdigris",
    faction: "Null Crown",
    personality: "Morally gray envoy. Missions have ethical weight.",
    unlockedAtRank: 5,
  },
] as const;

export type NpcDefinition = (typeof NPCS)[number];

export function getNpc(id: string): NpcDefinition {
  return NPCS.find((npc) => npc.id === id) ?? NPCS[0]!;
}

export function getUnlockedNpcs(rankLevel: number): NpcDefinition[] {
  return NPCS.filter((npc) => rankLevel >= npc.unlockedAtRank);
}
