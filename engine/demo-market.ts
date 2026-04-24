import { seededStream } from "./prng";
import {
  commodityMatchesLocationDemand,
  getLocation,
  type LocationDefinition,
} from "@/data/locations";
import { getDistrictPriceMultiplier } from "@/engine/district-state";
import type { Commodity, DistrictState, DistrictStateRecord } from "./types";

export interface DemoResources {
  balanceObol: number;
  energySeconds: number;
  heat: number;
}

export interface DemoHolding {
  ticker: string;
  quantity: number;
  avgEntry: number;
}

export type PriceMap = Record<string, number>;
export type ChangeMap = Record<string, number>;
export type TradeIntent = "BUY" | "SELL";

const VOLATILITY_FACTOR: Record<Commodity["volatility"], number> = {
  very_low: 0.003,
  low: 0.005,
  med: 0.009,
  high: 0.014,
  very_high: 0.02,
};

const HEAT_FACTOR: Record<Commodity["heatRisk"], number> = {
  very_low: 1,
  low: 2,
  med: 4,
  high: 6,
  very_high: 8,
};

const HIGH_RISK_TICKERS = new Set(["BLCK", "AETH", "HXMD"]);

export const DEFAULT_TRADE_QUANTITY = 10;
export const ORDER_SIZES = [5, 10, 25] as const;
export const MAX_ENERGY_SECONDS = 72 * 60 * 60;
export const DORMANT_ENERGY_THRESHOLD_SECONDS = 60;

const DRIFT_BIAS: Record<string, number> = {
  VBLM: 0.0035,
  FDST: 0.0015,
  PGAS: 0.001,
  NGLS: 0.0005,
  HXMD: 0.0012,
  ORRS: 0.0018,
  SNPS: 0.0012,
  MTRX: 0.0008,
  AETH: 0.0016,
  BLCK: 0.0022,
};

export const FIRST_TRADE_HINT_TICKER = "VBLM";

export const DEMO_COMMODITIES: Commodity[] = [
  { ticker: "FDST", name: "Fractal Dust", basePrice: 138, volatility: "high", heatRisk: "high", eventTags: ["supply_shock", "evasion"] },
  { ticker: "PGAS", name: "Plutonion Gas", basePrice: 91, volatility: "med", heatRisk: "med", eventTags: ["infrastructure", "launch"] },
  { ticker: "NGLS", name: "Neon Glass", basePrice: 73, volatility: "low", heatRisk: "low", eventTags: ["archivist", "memory"] },
  { ticker: "HXMD", name: "Helix Mud", basePrice: 66, volatility: "med", heatRisk: "high", eventTags: ["biohack", "raid"] },
  { ticker: "VBLM", name: "Void Bloom", basePrice: 24, volatility: "low", heatRisk: "very_low", eventTags: ["starter", "stabilizer"] },
  { ticker: "ORRS", name: "Oracle Resin", basePrice: 112, volatility: "med", heatRisk: "med", eventTags: ["news", "signal"] },
  { ticker: "SNPS", name: "Synapse Silk", basePrice: 84, volatility: "med", heatRisk: "med", eventTags: ["faction", "fiber"] },
  { ticker: "MTRX", name: "Matrix Salt", basePrice: 58, volatility: "low", heatRisk: "low", eventTags: ["lattice", "unlock"] },
  { ticker: "AETH", name: "Aether Tabs", basePrice: 41, volatility: "high", heatRisk: "high", eventTags: ["rumor", "pump"] },
  { ticker: "BLCK", name: "Blacklight Serum", basePrice: 179, volatility: "very_high", heatRisk: "very_high", eventTags: ["contraband", "margin"] },
];

export const INITIAL_RESOURCES: DemoResources = {
  balanceObol: 1_000_000,
  energySeconds: 72 * 60 * 60,
  heat: 6,
};

export const DEMO_STARTING_BALANCE = INITIAL_RESOURCES.balanceObol;

export function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

export function createInitialPrices(): PriceMap {
  return Object.fromEntries(DEMO_COMMODITIES.map((commodity) => [commodity.ticker, commodity.basePrice]));
}

export function createInitialChanges(): ChangeMap {
  return Object.fromEntries(DEMO_COMMODITIES.map((commodity) => [commodity.ticker, 0]));
}

export function getCommodity(ticker: string): Commodity | undefined {
  return DEMO_COMMODITIES.find((commodity) => commodity.ticker === ticker);
}

export function getHeatDelta(ticker: string, side: "BUY" | "SELL"): number {
  const commodity = getCommodity(ticker);
  if (!commodity) {
    throw new Error(`Unknown ticker: ${ticker}`);
  }

  if (side === "BUY") {
    return HEAT_FACTOR[commodity.heatRisk];
  }

  return Math.max(1, HEAT_FACTOR[commodity.heatRisk] - 3);
}

export function getTradeEnergyCost(side: TradeIntent, quantity: number): number {
  const baseCost = side === "BUY" ? 90 : 75;
  return Math.max(15, Math.round((baseCost * Math.max(1, quantity)) / DEFAULT_TRADE_QUANTITY));
}

export function getStealthAdjustedHeatDelta(
  resources: Pick<DemoResources, "heat"> & { stealth?: number },
  ticker: string,
  side: TradeIntent,
): number {
  const stealth = resources.stealth ?? 0;
  const mitigation = Math.floor(stealth / 35);
  const panicTax = resources.heat >= 80 ? 2 : resources.heat >= 60 ? 1 : 0;

  return Math.max(1, getHeatDelta(ticker, side) + panicTax - mitigation);
}

export function getValueBasedTradeHeatDelta(ticker: string, totalCost: number): number {
  const divisor = HIGH_RISK_TICKERS.has(ticker) ? 2500 : 5000;
  return Math.max(1, Math.ceil(Math.max(0, totalCost) / divisor));
}

export function applyMarketClockPulse(
  resources: Pick<DemoResources, "energySeconds" | "heat"> & {
    integrity?: number;
    stealth?: number;
    influence?: number;
  },
  tick: number,
): {
  energySeconds: number;
  heat: number;
  integrity?: number;
  stealth?: number;
  influence?: number;
} {
  const heat = Math.max(0, resources.heat - (tick > 0 && tick % 20 === 0 ? 1 : 0));
  const energySeconds = Math.max(0, resources.energySeconds - 30);
  const integrity =
    resources.integrity === undefined
      ? undefined
      : Math.max(0, resources.integrity - (resources.heat >= 90 ? 1 : 0));

  return {
    ...resources,
    energySeconds,
    heat,
    integrity,
  };
}

export function applyLocationPriceModifiers(
  prices: PriceMap,
  locationIdOrDefinition: string | LocationDefinition | null | undefined,
  districtState: DistrictState | DistrictStateRecord = "NORMAL",
): PriceMap {
  const location =
    typeof locationIdOrDefinition === "string" || !locationIdOrDefinition
      ? getLocation(locationIdOrDefinition)
      : locationIdOrDefinition;

  return Object.fromEntries(
    DEMO_COMMODITIES.map((commodity) => {
      const current = prices[commodity.ticker] ?? commodity.basePrice;
      const demandBonus = commodityMatchesLocationDemand(commodity, location) ? 1.1 : 1;
      return [commodity.ticker, roundCurrency(current * location.priceMod * demandBonus * getDistrictPriceMultiplier(districtState, commodity, location.id))];
    }),
  );
}

export function canExecuteTrade(input: {
  ticker: string;
  side: TradeIntent;
  quantity: number;
  resources: { energySeconds: number; heat: number; stealth?: number };
}): { ok: true } | { ok: false; reason: string } {
  if (input.resources.energySeconds < DORMANT_ENERGY_THRESHOLD_SECONDS) {
    return { ok: false, reason: "Dormant mode: buy energy before trading." };
  }

  const energyCost = getTradeEnergyCost(input.side, input.quantity);
  if (input.resources.energySeconds < energyCost) {
    return { ok: false, reason: "Not enough Energy for this order." };
  }

  const heatDelta = getStealthAdjustedHeatDelta(
    input.resources,
    input.ticker,
    input.side,
  );
  if (input.resources.heat + heatDelta >= 100) {
    return { ok: false, reason: "Heat ceiling reached. Wait or cool down first." };
  }

  return { ok: true };
}

export function advancePrices(currentPrices: PriceMap, tick: number): { prices: PriceMap; changes: ChangeMap } {
  const nextPrices: PriceMap = {};
  const changes: ChangeMap = {};

  for (const commodity of DEMO_COMMODITIES) {
    const current = currentPrices[commodity.ticker] ?? commodity.basePrice;
    const stream = seededStream(`${commodity.ticker}:${tick}:market`);
    const noise = (stream() - 0.5) * 2;
    const drift = DRIFT_BIAS[commodity.ticker] ?? 0;
    const swing = noise * VOLATILITY_FACTOR[commodity.volatility];
    const rawNext = current * (1 + drift + swing);
    const next = roundCurrency(Math.max(1, rawNext));

    nextPrices[commodity.ticker] = next;
    changes[commodity.ticker] = roundCurrency(next - current);
  }

  return { prices: nextPrices, changes };
}

export function applyAssistSignal(
  prices: PriceMap,
  changes: ChangeMap,
  ticker: string,
  boost = 0.012,
): { prices: PriceMap; changes: ChangeMap } {
  const current = prices[ticker];
  if (current === undefined) {
    return { prices, changes };
  }

  const boosted = roundCurrency(current * (1 + boost));
  const boostDelta = roundCurrency(boosted - current);

  return {
    prices: { ...prices, [ticker]: boosted },
    changes: {
      ...changes,
      [ticker]: roundCurrency((changes[ticker] ?? 0) + boostDelta),
    },
  };
}

export function buyCommodity(input: {
  ticker: string;
  quantity: number;
  price: number;
  resources: DemoResources;
  holding?: DemoHolding;
}): { resources: DemoResources; holding: DemoHolding } {
  const commodity = getCommodity(input.ticker);
  if (!commodity) {
    throw new Error(`Unknown ticker: ${input.ticker}`);
  }

  const quantity = Math.max(1, Math.floor(input.quantity));
  const total = roundCurrency(input.price * quantity);
  if (input.resources.balanceObol < total) {
    throw new Error("Insufficient 0BOL");
  }

  const currentQuantity = input.holding?.quantity ?? 0;
  const currentCostBasis = (input.holding?.avgEntry ?? 0) * currentQuantity;
  const nextQuantity = currentQuantity + quantity;
  const nextAvgEntry = roundCurrency((currentCostBasis + total) / nextQuantity);

  return {
    resources: {
      balanceObol: roundCurrency(input.resources.balanceObol - total),
      energySeconds: Math.max(0, input.resources.energySeconds - 90),
      heat: Math.min(100, input.resources.heat + HEAT_FACTOR[commodity.heatRisk]),
    },
    holding: {
      ticker: input.ticker,
      quantity: nextQuantity,
      avgEntry: nextAvgEntry,
    },
  };
}

export function sellCommodity(input: {
  ticker: string;
  price: number;
  resources: DemoResources;
  holding: DemoHolding;
}): { resources: DemoResources; realizedPnl: number } {
  const commodity = getCommodity(input.ticker);
  if (!commodity) {
    throw new Error(`Unknown ticker: ${input.ticker}`);
  }

  if (input.holding.quantity <= 0) {
    throw new Error("Nothing to sell");
  }

  const proceeds = roundCurrency(input.price * input.holding.quantity);
  const costBasis = roundCurrency(input.holding.avgEntry * input.holding.quantity);
  const realizedPnl = roundCurrency(proceeds - costBasis);

  return {
    resources: {
      balanceObol: roundCurrency(input.resources.balanceObol + proceeds),
      energySeconds: Math.max(0, input.resources.energySeconds - 75),
      heat: Math.max(0, input.resources.heat + Math.max(1, HEAT_FACTOR[commodity.heatRisk] - 3)),
    },
    realizedPnl,
  };
}

export function formatObol(value: number): string {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

export function formatDelta(value: number): string {
  const rounded = roundCurrency(value);
  return `${rounded >= 0 ? "+" : ""}${rounded.toFixed(2)}`;
}
