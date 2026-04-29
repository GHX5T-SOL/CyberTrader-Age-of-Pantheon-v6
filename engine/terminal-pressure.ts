import { NPCS } from "@/data/npcs";
import { getAgentOsFactionByNpcFaction, getFactionDefinition, getFactionStanding } from "@/engine/factions";
import {
  applyFactionMarketPressures,
  createFactionMarketPressure,
  createFactionMarketPressures,
} from "@/engine/limit-orders";
import { roundCurrency, type ChangeMap, type PriceMap } from "@/engine/demo-market";
import type { Faction, FactionStandingTier, LimitOrderSide } from "@/engine/types";

const TERMINAL_PRESSURE_WINDOW_TICKS = 8;

type PressureDirection = "support" | "suppress";
type PressureRiskTone = "safe" | "watch" | "hot";

export interface TerminalPressureWindow {
  faction: Faction;
  factionName: string;
  reputation: number;
  standingTier: FactionStandingTier;
  startedAtTick: number;
  expiresAtTick: number;
  heatDelta: number;
  pressures: readonly {
    id: string;
    faction: Faction;
    standingTier: FactionStandingTier;
    ticker: string;
    direction: PressureDirection;
    intensityBps: number;
    startedAtTick: number;
    expiresAtTick: number;
    reason: string;
  }[];
}

export interface TerminalPressureCommand {
  faction: Faction;
  factionName: string;
  reputation: number;
  standingTier: FactionStandingTier;
  selectedTicker: string;
  ticker: string;
  selectedTickerAffected: boolean;
  direction: PressureDirection;
  intensityBps: number;
  startedAtTick: number;
  expiresAtTick: number;
  ticksRemaining: number;
  heatDelta: number;
  riskTone: PressureRiskTone;
  pressureLabel: string;
  pressureDetail: string;
  limitPrice: number;
  triggerLabel: string;
  triggerDetail: string;
}

export function getFactionReputationForPressure(input: {
  faction: Faction;
  npcReputation: Record<string, number>;
}): number {
  const reputation = NPCS
    .filter((npc) => getAgentOsFactionByNpcFaction(npc.faction) === input.faction)
    .reduce((max, npc) => Math.max(max, input.npcReputation[npc.id] ?? 0), 0);

  return Math.max(0, Math.min(100, Math.floor(reputation)));
}

export function getTerminalPressureWindow(input: {
  faction: Faction | null;
  npcReputation: Record<string, number>;
  tick: number;
}): TerminalPressureWindow | null {
  if (!input.faction) {
    return null;
  }

  const startedAtTick = Math.floor(Math.max(0, input.tick) / TERMINAL_PRESSURE_WINDOW_TICKS) * TERMINAL_PRESSURE_WINDOW_TICKS;
  const reputation = getFactionReputationForPressure({
    faction: input.faction,
    npcReputation: input.npcReputation,
  });
  const standing = getFactionStanding(input.faction, reputation);
  const pressure = createFactionMarketPressure({
    faction: input.faction,
    reputation,
    tick: startedAtTick,
  });

  return {
    faction: input.faction,
    factionName: getFactionDefinition(input.faction).name,
    reputation,
    standingTier: standing.tier,
    startedAtTick,
    expiresAtTick: pressure.expiresAtTick,
    heatDelta: pressure.heatDelta,
    pressures: createFactionMarketPressures({
      standing,
      tick: startedAtTick,
    }),
  };
}

export function applyTerminalFactionPressureToPrices(input: {
  prices: PriceMap;
  changes?: ChangeMap;
  faction: Faction | null;
  npcReputation: Record<string, number>;
  tick: number;
}): { prices: PriceMap; changes: ChangeMap; window: TerminalPressureWindow | null } {
  const window = getTerminalPressureWindow(input);
  if (!window) {
    return { prices: { ...input.prices }, changes: { ...(input.changes ?? {}) }, window };
  }

  const result = applyFactionMarketPressures({
    prices: input.prices,
    changes: input.changes,
    pressures: window.pressures,
    tick: input.tick,
  });

  return { ...result, window };
}

export function buildTerminalPressureCommand(input: {
  faction: Faction | null;
  npcReputation: Record<string, number>;
  selectedTicker: string;
  side: LimitOrderSide;
  price: number;
  orderSize: number;
  tick: number;
  heat: number;
}): TerminalPressureCommand | null {
  const selectedTicker = input.selectedTicker.trim().toUpperCase();
  const window = getTerminalPressureWindow(input);
  if (!window || window.pressures.length === 0) {
    return null;
  }

  const selectedPressure = window.pressures.find((pressure) => pressure.ticker === selectedTicker);
  const primaryPressure = selectedPressure
    ?? [...window.pressures].sort((left, right) => right.intensityBps - left.intensityBps)[0]!;
  const selectedTickerAffected = primaryPressure.ticker === selectedTicker;
  const ticksRemaining = Math.max(0, window.expiresAtTick - Math.max(0, Math.floor(input.tick)));
  const heatAfterWindow = input.heat + window.heatDelta;
  const riskTone: PressureRiskTone = heatAfterWindow >= 90 ? "hot" : heatAfterWindow >= 70 ? "watch" : "safe";
  const limitPrice = roundCurrency(input.price * getLimitPreviewMultiplier(input.side, primaryPressure.direction, selectedTickerAffected));
  const sideLabel = input.side === "BUY" ? "BUY LIMIT <=" : "SELL LIMIT >=";

  return {
    faction: window.faction,
    factionName: window.factionName,
    reputation: window.reputation,
    standingTier: window.standingTier,
    selectedTicker,
    ticker: primaryPressure.ticker,
    selectedTickerAffected,
    direction: primaryPressure.direction,
    intensityBps: primaryPressure.intensityBps,
    startedAtTick: window.startedAtTick,
    expiresAtTick: window.expiresAtTick,
    ticksRemaining,
    heatDelta: window.heatDelta,
    riskTone,
    pressureLabel: `${primaryPressure.ticker} ${primaryPressure.direction.toUpperCase()} ${primaryPressure.intensityBps}BPS`,
    pressureDetail: selectedTickerAffected
      ? `${window.factionName} pressure is on the selected tape.`
      : `${selectedTicker} is unpressured. Watch ${primaryPressure.ticker} for the faction window.`,
    limitPrice,
    triggerLabel: `${sideLabel} ${limitPrice.toFixed(2)} 0BOL`,
    triggerDetail: `PREVIEW // x${Math.max(1, Math.floor(input.orderSize))} // ${ticksRemaining}T WINDOW`,
  };
}

function getLimitPreviewMultiplier(
  side: LimitOrderSide,
  direction: PressureDirection,
  selectedTickerAffected: boolean,
): number {
  if (!selectedTickerAffected) {
    return side === "BUY" ? 0.985 : 1.012;
  }

  if (side === "BUY") {
    return direction === "suppress" ? 0.99 : 0.985;
  }

  return direction === "support" ? 1.006 : 1.012;
}
