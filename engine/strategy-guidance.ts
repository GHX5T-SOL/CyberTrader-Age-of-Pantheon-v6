import { BETA_TUNED_ARCHETYPES } from "@/engine/beta-tuning";
import type { PlayerArchetype, PlayerArchetypeId } from "@/engine/player-archetypes";

export const STARTER_GUIDANCE_QUANTITY = 15;
export const HIGH_HEAT_STRATEGY_THRESHOLD = 58;

const STRATEGY_CODES: Record<PlayerArchetypeId, string> = {
  "cautious-grinder": "GRINDER",
  "momentum-trader": "MOMENTUM",
  "heat-seeker": "HEAT SEEKER",
  "speed-runner": "SPEED",
};

const TICKER_STRATEGY_PRIORITY: Record<string, PlayerArchetypeId[]> = {
  VBLM: ["cautious-grinder", "speed-runner"],
  NGLS: ["cautious-grinder"],
  MTRX: ["speed-runner", "cautious-grinder"],
  PGAS: ["momentum-trader", "speed-runner"],
  ORRS: ["momentum-trader"],
  SNPS: ["momentum-trader"],
  FDST: ["heat-seeker"],
  AETH: ["heat-seeker"],
  BLCK: ["heat-seeker"],
};

const NPC_STRATEGY_HINTS: Record<string, PlayerArchetypeId> = {
  kite: "momentum-trader",
  librarian: "cautious-grinder",
  verdigris: "speed-runner",
  obsidian: "heat-seeker",
};

export interface TunedStrategyGuidance {
  archetypeId: PlayerArchetypeId;
  label: string;
  code: string;
  tickers: readonly string[];
  lotScript: string;
  targetPercent: string;
  maxHoldTicks: number;
  heatCap: number;
  summary: string;
}

export type StrategyTone = "cyan" | "amber" | "green";

export interface LiveStrategyHintInput {
  selectedTicker: string;
  firstTradeComplete: boolean;
  heat: number;
  hasOpenPosition: boolean;
}

export interface LiveStrategyHint {
  title: string;
  detail: string;
  tone: StrategyTone;
  lines: string[];
}

export function getTunedStrategyGuidance(archetypeId: PlayerArchetypeId): TunedStrategyGuidance {
  return toGuidance(getTunedArchetype(archetypeId));
}

export function getTunedStrategyForTicker(
  ticker: string,
  options?: { firstTradeComplete?: boolean },
): TunedStrategyGuidance | null {
  const priority = TICKER_STRATEGY_PRIORITY[ticker];

  if (!priority) {
    return null;
  }

  const strategyId = !options?.firstTradeComplete && priority.includes("cautious-grinder")
    ? "cautious-grinder"
    : priority[0]!;

  return getTunedStrategyGuidance(strategyId);
}

export function getStrategyTickerLot(guidance: TunedStrategyGuidance, ticker: string): string {
  const archetype = getTunedArchetype(guidance.archetypeId);
  const index = guidance.tickers.indexOf(ticker);
  const tickerIndex = index >= 0 ? index : 0;
  const selectedTicker = guidance.tickers[tickerIndex] ?? guidance.tickers[0]!;
  const selectedLot = archetype.quantities[tickerIndex] ?? archetype.quantities[0]!;

  return `${selectedTicker} x${selectedLot}`;
}

export function getStrategyCueLines(
  ticker: string,
  options?: { firstTradeComplete?: boolean },
): string[] {
  const guidance = getTunedStrategyForTicker(ticker, options);

  if (!guidance) {
    return [
      "[SCRIPT] ORACLE WATCHLIST",
      `[LOT] ${ticker} xSMALL`,
      "[TARGET] WAIT FOR TUNING",
    ];
  }

  return [
    `[SCRIPT] ${guidance.code} // HEAT <${guidance.heatCap}`,
    `[LOT] ${getStrategyTickerLot(guidance, ticker)}`,
    `[TARGET] +${guidance.targetPercent}% <= ${guidance.maxHoldTicks} TICKS`,
  ];
}

export function getTickerStrategyLane(ticker: string):
  | "starter"
  | "momentum"
  | "safe-cycle"
  | "contraband"
  | "wildcard" {
  if (ticker === "VBLM") {
    return "starter";
  }

  const priority = TICKER_STRATEGY_PRIORITY[ticker];
  const primary = priority?.[0];

  if (primary === "momentum-trader") {
    return "momentum";
  }

  if (primary === "heat-seeker") {
    return "contraband";
  }

  if (primary === "cautious-grinder" || primary === "speed-runner") {
    return "safe-cycle";
  }

  return "wildcard";
}

export function getLiveStrategyHint(input: LiveStrategyHintInput): LiveStrategyHint {
  const lane = getTickerStrategyLane(input.selectedTicker);

  if (input.heat >= HIGH_HEAT_STRATEGY_THRESHOLD) {
    return {
      title: "COOL HEAT BEFORE SCALING",
      detail:
        "Oracle flags Heat 58 as the contraband stop line. Stay on safe-cycle cargo or reduce Heat before opening momentum or contraband lanes.",
      tone: "amber",
      lines: ["[HALT] contraband lane", "[SAFE] VBLM NGLS MTRX", "[NEXT] cool heat"],
    };
  }

  if (!input.firstTradeComplete && input.selectedTicker !== "VBLM") {
    return {
      title: "SWITCH TO VBLM STARTER",
      detail:
        `${input.selectedTicker} can wait. First route starts with VBLM x${STARTER_GUIDANCE_QUANTITY}: buy, wait for green tape, then sell before opening a second lane.`,
      tone: "amber",
      lines: [`[TUNED] VBLM x${STARTER_GUIDANCE_QUANTITY}`, "[WHY] lowest heat", "[NEXT] select VBLM"],
    };
  }

  if (!input.firstTradeComplete) {
    const guidance = getTunedStrategyGuidance("cautious-grinder");
    return {
      title: "VBLM X15 STARTER ROUTE",
      detail:
        `Oracle locks the starter path at ${getStrategyTickerLot(guidance, "VBLM")}. Buy the lot, wait for green tape, then sell the same lot.`,
      tone: "cyan",
      lines: [`[TUNED] ${getStrategyTickerLot(guidance, "VBLM")}`, "[NEXT] wait green tick", "[GOAL] first 0BOL profit"],
    };
  }

  if (lane === "momentum") {
    const guidance = getTunedStrategyGuidance("momentum-trader");
    return {
      title: "MOMENTUM UPGRADE LANE",
      detail:
        `${guidance.lotScript} is the tuned post-profit route. Keep Heat under 50 and close quick before the tape gets noisy.`,
      tone: "green",
      lines: ["[UPGRADE] PGAS ORRS SNPS", "[LOT] medium size", "[RULE] heat under 50"],
    };
  }

  if (lane === "contraband") {
    return {
      title: "CONTRABAND CAUTION",
      detail:
        `${input.selectedTicker} pays only when the deck is calm. Do not test this lane until the starter loop is banked and Heat is controlled.`,
      tone: "amber",
      lines: [`[RISK] heat under ${HIGH_HEAT_STRATEGY_THRESHOLD}`, "[RULE] bank safe profit", "[BACKUP] VBLM MTRX"],
    };
  }

  if (input.hasOpenPosition) {
    return {
      title: "CLOSE THE ACTIVE THREAD",
      detail:
        "Do not split the learning run. Close the open cargo on green tape before switching into the next tuned lane.",
      tone: "amber",
      lines: ["[FOCUS] one position", "[NEXT] sell green", "[THEN] upgrade lane"],
    };
  }

  return {
    title: "SCALE CLEANLY",
    detail:
      "After first profit, cycle VBLM/MTRX for speed or test PGAS/ORRS/SNPS as the first upgrade lane. Save contraband for low Heat.",
    tone: "green",
    lines: ["[SAFE] VBLM MTRX", "[UPGRADE] PGAS ORRS SNPS", "[CAUTION] contraband"],
  };
}

export function getNpcStrategyHint(npcId: string): string | null {
  const archetypeId = NPC_STRATEGY_HINTS[npcId];

  if (!archetypeId) {
    return null;
  }

  const guidance = getTunedStrategyGuidance(archetypeId);
  return `ORACLE SCRIPT // ${guidance.code}: ${guidance.lotScript}; target +${guidance.targetPercent}% before Heat ${guidance.heatCap}.`;
}

function getTunedArchetype(archetypeId: PlayerArchetypeId): PlayerArchetype {
  const archetype = BETA_TUNED_ARCHETYPES.find((candidate) => candidate.id === archetypeId);

  if (!archetype) {
    throw new Error(`Unknown tuned archetype: ${archetypeId}`);
  }

  return archetype;
}

function toGuidance(archetype: PlayerArchetype): TunedStrategyGuidance {
  const lotScript = archetype.tickers
    .map((ticker, index) => `${ticker} x${archetype.quantities[index] ?? archetype.quantities[0]}`)
    .join(" / ");
  const targetPercent = formatPercent(archetype.profitTargetPct);
  const code = STRATEGY_CODES[archetype.id];

  return {
    archetypeId: archetype.id,
    label: archetype.label,
    code,
    tickers: archetype.tickers,
    lotScript,
    targetPercent,
    maxHoldTicks: archetype.maxHoldTicks,
    heatCap: archetype.maxEntryHeat,
    summary: `${code} runs ${lotScript}, targets +${targetPercent}% green tape, and stops new entries before Heat ${archetype.maxEntryHeat}.`,
  };
}

function formatPercent(value: number): string {
  return (value * 100).toFixed(1);
}
