import { DEMO_COMMODITIES } from "@/engine/demo-market";
import { FACTION_DEFINITIONS } from "@/engine/factions";
import type { Faction, OsTier } from "@/engine/types";

export type PresentationAccent = "cyan" | "green" | "amber" | "red";
export type CommodityVisualLane =
  | "starter-stabilizer"
  | "safe-cycle"
  | "upgrade-signal"
  | "contraband-anomaly";

export interface CommodityPresentation {
  ticker: string;
  name: string;
  lane: CommodityVisualLane;
  accent: PresentationAccent;
  riskLabel: string;
  silhouetteRule: string;
  rowSignal: string;
  captureRole: string;
}

export interface FactionPresentation {
  faction: Faction;
  accent: PresentationAccent;
  sigilRule: string;
  hierarchyLabel: string;
  routeTexture: string;
  assetRequest: string;
}

export interface OsTierPresentation {
  tier: OsTier;
  accent: PresentationAccent;
  rankBand: string;
  hierarchyLabel: string;
  surfaceRule: string;
  captureRule: string;
}

export interface PresentationAssetRequest {
  id: string;
  owner: "palette" | "vex" | "reel";
  priority: "P1" | "P2";
  title: string;
  acceptance: readonly string[];
}

export const ZORO_P1_003_SUPERDESIGN = {
  projectUrl:
    "https://app.superdesign.dev/teams/cbf9e40e-5180-4061-94e7-aa2571efe072/projects/308e7657-6d74-4aea-8e7f-b51f83ccc854",
  currentDraft: "https://p.superdesign.dev/draft/7a48e6d9-37d3-445c-ba85-e2c40081cd98",
  assetDirectionDraft: "https://p.superdesign.dev/draft/a9ccd626-2899-4324-98b3-062300ecee9e",
  osFactionDraft: "https://p.superdesign.dev/draft/218326c6-0622-4fcd-a294-c51baf6686e9",
} as const;

export const COMMODITY_PRESENTATION: Record<string, CommodityPresentation> = {
  VBLM: {
    ticker: "VBLM",
    name: "Void Bloom",
    lane: "starter-stabilizer",
    accent: "green",
    riskLabel: "STABLE STARTER",
    silhouetteRule: "Soft bloom core, open negative space, no jagged threat edge.",
    rowSignal: "Show as the first green recovery signal in first-session capture.",
    captureRole: "First clean 0BOL profit route and safest screenshot teaching asset.",
  },
  MTRX: {
    ticker: "MTRX",
    name: "Matrix Salt",
    lane: "safe-cycle",
    accent: "green",
    riskLabel: "SECURE CYCLE",
    silhouetteRule: "Crystalline grid or stacked salt lattice with clean terminals.",
    rowSignal: "Pair with VBLM as the calm post-profit speed lane.",
    captureRole: "Secondary safe-cycle asset for low-Heat screenshots.",
  },
  NGLS: {
    ticker: "NGLS",
    name: "Neon Glass",
    lane: "safe-cycle",
    accent: "cyan",
    riskLabel: "LOW GLARE",
    silhouetteRule: "Transparent shard pane with thin cyan refraction lines.",
    rowSignal: "Keep subdued so it supports, not competes with, VBLM.",
    captureRole: "Archivist-friendly visual spacer in the market tape.",
  },
  PGAS: {
    ticker: "PGAS",
    name: "Plutonion Gas",
    lane: "upgrade-signal",
    accent: "amber",
    riskLabel: "MID PRESSURE",
    silhouetteRule: "Contained vapor canister with one amber pressure seam.",
    rowSignal: "First visible upgrade lane after the starter route is banked.",
    captureRole: "Post-profit momentum lane anchor for terminal and preview cuts.",
  },
  ORRS: {
    ticker: "ORRS",
    name: "Oracle Resin",
    lane: "upgrade-signal",
    accent: "amber",
    riskLabel: "SIGNAL RESIN",
    silhouetteRule: "Resin droplet with a single embedded eye or signal node.",
    rowSignal: "Use as the readable strategy/intel upgrade companion to PGAS.",
    captureRole: "Oracle-flavored upgrade cue for Help, missions, and profile copy.",
  },
  SNPS: {
    ticker: "SNPS",
    name: "Synapse Silk",
    lane: "upgrade-signal",
    accent: "cyan",
    riskLabel: "THREAD SIGNAL",
    silhouetteRule: "Fine fiber coil with one circuit knot, never a cloth texture.",
    rowSignal: "Bridge upgrade lane to AgentOS faction reputation visuals.",
    captureRole: "Faction mission and signal-feed upgrade texture.",
  },
  GLCH: {
    ticker: "GLCH",
    name: "Glitch Echo",
    lane: "upgrade-signal",
    accent: "cyan",
    riskLabel: "AI DRIFT",
    silhouetteRule: "Broken echo shard, offset scanline, controlled digital fracture.",
    rowSignal: "Keep as anomaly-adjacent without using danger red.",
    captureRole: "AI-fragment flavor for AgentOS and market-swarm scenes.",
  },
  FDST: {
    ticker: "FDST",
    name: "Fractal Dust",
    lane: "contraband-anomaly",
    accent: "red",
    riskLabel: "VOLATILE DUST",
    silhouetteRule: "Angular dust cluster with fractured outline and red scan edge.",
    rowSignal: "Contraband should look tempting but visibly hot.",
    captureRole: "High-risk preview beat when Heat is already explained.",
  },
  HXMD: {
    ticker: "HXMD",
    name: "Helix Mud",
    lane: "contraband-anomaly",
    accent: "red",
    riskLabel: "BIOHEAT",
    silhouetteRule: "Helix coil half-submerged in dark sludge, asymmetric edge.",
    rowSignal: "Reads as biological risk, not generic resource mud.",
    captureRole: "Raid-risk commodity for stress and hazard screenshots.",
  },
  AETH: {
    ticker: "AETH",
    name: "Aether Tabs",
    lane: "contraband-anomaly",
    accent: "red",
    riskLabel: "RUMOR HEAT",
    silhouetteRule: "Small stacked tabs with a flickering vapor notch.",
    rowSignal: "Rumor-lane cargo should stay compact and unstable.",
    captureRole: "Fast-cut contraband cue for low-Heat preview sequences.",
  },
  BLCK: {
    ticker: "BLCK",
    name: "Blacklight Serum",
    lane: "contraband-anomaly",
    accent: "red",
    riskLabel: "BLACKLIGHT",
    silhouetteRule: "Sealed vial silhouette, black core, red warning rim.",
    rowSignal: "The hottest row in the tape; red is reserved for this tier.",
    captureRole: "Late screenshot danger marker, never first-session promise copy.",
  },
};

// Export an ordered list of commodity presentations for UI consumption.
export const PRESENTATION_DIRECTION: CommodityPresentation[] = Object.values(COMMODITY_PRESENTATION);

// Helper functions for commodity presentation access
export function getCommodityPresentation(ticker: string): CommodityPresentation {
  const presentation = COMMODITY_PRESENTATION[ticker];
  if (!presentation) {
    throw new Error(`No presentation found for commodity ticker: ${ticker}`);
  }
  return presentation;
}

export function getCommodityLaneCounts(): Record<string, number> {
  const counts: Record<string, number> = {
    "starter-stabilizer": 0,
    "safe-cycle": 0,
    "upgrade-signal": 0,
    "contraband-anomaly": 0,
  };

  Object.values(COMMODITY_PRESENTATION).forEach((presentation) => {
    counts[presentation.lane]++;
  });

  return counts;
}

// Faction presentation data
export const FACTION_PRESENTATION: Record<string, FactionPresentation> = {
  FREE_SPLINTERS: {
    faction: FACTION_DEFINITIONS[0],
    accent: "green",
    sigilRule: "Free splinter shard with green energy lines, pirate mutual identifier.",
    hierarchyLabel: "Free Splinters Collective",
    routeTexture: "Shard energy with green recovery patterns",
    assetRequest: "Free splinter sigil for safe-cycle faction missions",
  },
  BLACKWAKE: {
    faction: FACTION_DEFINITIONS[1],
    accent: "amber",
    sigilRule: "Blackwake crest with amber contraband symbol, smuggler captain identifier.",
    hierarchyLabel: "Blackwake Syndicate",
    routeTexture: "Dark amber energy with cargo patterns",
    assetRequest: "Blackwake sigil for upgrade-signal faction routes",
  },
  NULL_CROWN: {
    faction: FACTION_DEFINITIONS[2],
    accent: "red",
    sigilRule: "Null crown with red fracture lines, ghost court identifier.",
    hierarchyLabel: "Null Crown Court",
    routeTexture: "Dark crystalline with red warning energy",
    assetRequest: "Null crown sigil for contraband-anomaly faction missions",
  },
  ARCHIVISTS: {
    faction: FACTION_DEFINITIONS[3],
    accent: "cyan",
    sigilRule: "Archivist memory shard with cyan data streams, memory broker identifier.",
    hierarchyLabel: "Archivist Network",
    routeTexture: "Data streams with cyan memory patterns",
    assetRequest: "Archivist sigil for intel-focused faction missions",
  },
};

export function getFactionPresentationList(): FactionPresentation[] {
  return Object.values(FACTION_PRESENTATION);
}

// OS tier presentation data
export const OS_TIER_PRESENTATION: Record<string, OsTierPresentation> = {
  PIRATE: {
    tier: "PIRATE",
    accent: "green",
    rankBand: "RANK 1-4",
    hierarchyLabel: "Starter Deck",
    surfaceRule: "Basic terminal interface with minimal faction access",
    captureRule: "Early-game teaching tool, no advanced features",
  },
  AGENT: {
    tier: "AGENT",
    accent: "amber",
    rankBand: "RANK 5-7",
    hierarchyLabel: "FACTION Integration",
    surfaceRule: "Enhanced terminal with faction-specific tools and reputation",
    captureRule: "Mid-game faction progression and advanced trading",
  },
  PANTHEON: {
    tier: "PANTHEON",
    accent: "red",
    rankBand: "RANK 8-10",
    hierarchyLabel: "Master Network",
    surfaceRule: "Full-featured terminal with all systems and advanced controls",
    captureRule: "locked late-game promise, maximum capability",
  },
};

// Presentation asset requests for follow-up work
export const PRESENTATION_ASSET_REQUESTS: PresentationAssetRequest[] = [
  {
    id: "palette-p1-006-commodity-lane-silhouettes",
    owner: "palette",
    priority: "P1",
    title: "Commodity Lane Silhouettes",
    acceptance: [
      "Visual distinction between starter, safe, upgrade, and contraband lanes",
      "Consistent with presentation direction risk labels and color coding",
      "Supports both market tape and detailed commodity screens",
    ],
  },
  {
    id: "palette-p1-007-agentos-faction-sigils",
    owner: "palette",
    priority: "P1",
    title: "AgentOS Faction Sigils",
    acceptance: [
      "Compact faction identifiers that work in UI surfaces",
      "Distinct visual language for each of the four factions",
      "Scale appropriately from small market tape to large mission screens",
    ],
  },
  {
    id: "vex-p1-008-os-tier-hierarchy-rails",
    owner: "vex",
    priority: "P1",
    title: "OS Tier Hierarchy Rails",
    acceptance: [
      "Visual progression from PirateOS to AgentOS to PantheonOS",
      "Interface evolution that reflects rank progression",
      "Consistent with terminal surface rule definitions",
    ],
  },
  {
    id: "reel-p1-004-preview-asset-beat-list",
    owner: "reel",
    priority: "P1",
    title: "Preview Asset Beat List",
    acceptance: [
      "Commodity, faction, and OS tier presentation beats for preview video",
      "Consistent with capture role definitions in presentation direction",
      "Supports 30-second App Store preview storyboard",
    ],
  },
];
