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
  // ... existing commodity entries ...
};

// Export an ordered list of commodity presentations for UI consumption.
export const PRESENTATION_DIRECTION: CommodityPresentation[] = Object.values(COMMODITY_PRESENTATION);

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

export const FACTION_PRESENTATION: Record<Faction, FactionPresentation> = {
  FREE_SPLINTERS: {
    faction: "FREE_SPLINTERS",
    accent: "green",
    sigilRule: "Broken shard ring with a small open gate.",
    hierarchyLabel: "LOCAL MUTUAL // SAFEHOUSE",
    routeTexture: "Low-Heat recovery strips and longer timer readouts.",
    assetRequest: "Create a simple green shard-ring sigil for faction rows and mission strips.",
  },
  BLACKWAKE: {
    faction: "BLACKWAKE",
    accent: "amber",
    sigilRule: "Cargo wake chevron with one hard prow line.",
    hierarchyLabel: "SMUGGLER ROUTE // TIMED CARGO",
    routeTexture: "Amber convoy rails, tighter timers, visible cargo pressure.",
    assetRequest: "Create an amber wake/chevron sigil that works at 24 px and 96 px.",
  },
  NULL_CROWN: {
    faction: "NULL_CROWN",
    accent: "red",
    sigilRule: "Crown negative-space mark with a missing center tooth.",
    hierarchyLabel: "GHOST COURT // BLIND SPOT",
    routeTexture: "Red left rail only; no full red panel fills outside danger states.",
    assetRequest: "Create a red crown void sigil that reads without skull or weapon imagery.",
  },
  ARCHIVISTS: {
    faction: "ARCHIVISTS",
    accent: "cyan",
    sigilRule: "Memory index bracket wrapped around one signal dot.",
    hierarchyLabel: "ARCHIVE INDEX // CLUE CHAIN",
    routeTexture: "Cyan catalog rows, slower timers, cleaner custody language.",
    assetRequest: "Create a cyan archive-bracket sigil for intel and profile surfaces.",
  },
};

export const OS_TIER_PRESENTATION: Record<OsTier, OsTierPresentation> = {
  PIRATE: {
    tier: "PIRATE",
    accent: "cyan",
    rankBand: "RANK 1-4",
    hierarchyLabel: "PIRATE_OS // LOCAL BOOT",
    surfaceRule: "Raw deck access, market tape, starter route, no allegiance ornament.",
    captureRule: "Show S1LKROAD, VBLM x15, Energy, Heat, and LocalAuthority safety.",
  },
  AGENT: {
    tier: "AGENT",
    accent: "green",
    rankBand: "RANK 5-19",
    hierarchyLabel: "AGENT_OS // FACTION BIND",
    surfaceRule: "Faction rows gain sigils, route-pressure strips, and reputation labels.",
    captureRule: "Show one bound faction, one mission pressure strip, and one route consequence.",
  },
  PANTHEON: {
    tier: "PANTHEON",
    accent: "amber",
    rankBand: "RANK 20+",
    hierarchyLabel: "PANTHEON_OS // MEMORY WAR",
    surfaceRule: "Future territory and shard-memory surfaces stay feature-flagged until playable.",
    captureRule: "Use as locked late-game promise only; no unbuilt feature claims in store shots.",
  },
};

export const PRESENTATION_ASSET_REQUESTS: readonly PresentationAssetRequest[] = [
  {
    id: "palette-p1-006-commodity-lane-silhouettes",
    owner: "palette",
    priority: "P1",
    title: "Generate commodity lane silhouette polish pass",
    acceptance: [
      "Every commodity icon still reads at 28 px inside CommodityRow",
      "Starter/safe, upgrade/signal, and contraband/anomaly lanes are distinguishable without new colors",
      "assets/provenance.json remains current after generated art changes",
    ],
  },
  {
    id: "palette-p1-007-agentos-faction-sigils",
    owner: "palette",
    priority: "P1",
    title: "Create compact AgentOS faction sigils",
    acceptance: [
      "All four launch factions have a 24 px row sigil and 96 px dossier variant",
      "Sigils use only cyan, green, amber, red, muted, and terminal panel fills",
      "Mission, progression, and profile captures keep text readable on small phones",
    ],
  },
  {
    id: "vex-p1-008-os-tier-hierarchy-rails",
    owner: "vex",
    priority: "P2",
    title: "Apply OS tier hierarchy rails to progression/profile surfaces",
    acceptance: [
      "PirateOS, AgentOS, and PantheonOS tiers are visually distinct in existing panels",
      "No cards are nested inside cards and no new palette family is introduced",
      "Responsive QA still passes on small phone, large phone, tablet, and desktop web",
    ],
  },
  {
    id: "reel-p1-004-preview-asset-beat-list",
    owner: "reel",
    priority: "P2",
    title: "Map preview-video beats to approved asset lanes",
    acceptance: [
      "Preview opens on PirateOS starter lane before showing AgentOS or contraband",
      "Contraband appears only after Heat risk is visible",
      "Copy stays fictional and avoids real-money or prize claims",
    ],
  },
];

export function getCommodityPresentation(ticker: string): CommodityPresentation {
  const presentation = COMMODITY_PRESENTATION[ticker];

  if (!presentation) {
    throw new Error(`Missing commodity presentation direction for ${ticker}`);
  }

  return presentation;
}

export function getFactionPresentation(faction: Faction): FactionPresentation {
  return FACTION_PRESENTATION[faction];
}

export function getOsTierPresentation(tier: OsTier): OsTierPresentation {
  return OS_TIER_PRESENTATION[tier];
}

export function getCommodityLaneCounts(): Record<CommodityVisualLane, number> {
  return DEMO_COMMODITIES.reduce<Record<CommodityVisualLane, number>>(
    (counts, commodity) => {
      const lane = getCommodityPresentation(commodity.ticker).lane;
      counts[lane] += 1;
      return counts;
    },
    {
      "starter-stabilizer": 0,
      "safe-cycle": 0,
      "upgrade-signal": 0,
      "contraband-anomaly": 0,
    },
  );
}

export function getFactionPresentationList(): FactionPresentation[] {
  return FACTION_DEFINITIONS.map((faction) => getFactionPresentation(faction.id));
}
