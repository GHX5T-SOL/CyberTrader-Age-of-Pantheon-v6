export const NPCS = [
  {
    id: "vox",
    name: "Vox",
    faction: "Pantheon",
    personality: "Mystic conduit. Grants rare boosts for daring traders.",
    strategyHint: "Unlock hidden tier: trade rare shards when Heat < 30 for bonus XP.",
    unlockedAtRank: 9,
  },

  {
    id: "kite",
    name: "Kite",
    faction: "Blackwake",
    personality: "Impatient smuggler captain. Pays well. Hates delays.",
    strategyHint: "Starter cargo first: VBLM x15, sell green, then keep PGAS runs short.",
    unlockedAtRank: 1,
  },
  {
    id: "librarian",
    name: "The Librarian",
    faction: "Archivists",
    personality: "Memory broker. Speaks in fragments. Rewards intel.",
    strategyHint: "Archive note: PGAS, ORRS, and SNPS are the first upgrade lane after profit.",
    unlockedAtRank: 3,
  },
  {
    id: "verdigris",
    name: "Verdigris",
    faction: "Null Crown",
    personality: "Morally gray envoy. Missions have ethical weight.",
    strategyHint: "Read the street: safe cycles build rank; contraband waits until Heat is quiet.",
    unlockedAtRank: 5,
  },
  {
    id: "obsidian",
    name: "Obsidian",
    faction: "Eclipse Guild",
    personality: "Silent enforcer. Rewards high risk, high reward ops.",
    strategyHint: "Eclipse rule: FDST, AETH, and BLCK only pay when Heat stays under control.",
    unlockedAtRank: 7,
  },
] as const;

export type NpcDefinition = (typeof NPCS)[number];

export function getNpc(id: string): NpcDefinition {
  return NPCS.find((npc) => npc.id === id) ?? NPCS[0]!;
}

export function getUnlockedNpcs(rankLevel: number): NpcDefinition[] {
  return NPCS.filter((npc) => rankLevel >= npc.unlockedAtRank);
}
