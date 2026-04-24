export const NPCS = [
  {
    id: "kite",
    name: "Kite",
    faction: "Blackwake",
    description: "Smuggler captain. Blunt, impatient, pays well.",
    unlockedAtRank: 1,
  },
  {
    id: "librarian",
    name: "The Librarian",
    faction: "Archivists",
    description: "Memory broker. Speaks in fragments. Rewards with lore.",
    unlockedAtRank: 3,
  },
  {
    id: "verdigris",
    name: "Verdigris",
    faction: "Null Crown",
    description: "Enemy-turned-uncertain-ally. Missions are morally gray.",
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
