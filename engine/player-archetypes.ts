import { getBountyByHeat, getBountyRaidIntervalTicks } from "@/engine/bounty";
import {
  INITIAL_RESOURCES,
  advancePrices,
  applyMarketClockPulse,
  buyCommodity,
  canExecuteTrade,
  createInitialPrices,
  roundCurrency,
  sellCommodity,
  type DemoHolding,
  type DemoResources,
  type PriceMap,
} from "@/engine/demo-market";
import { makeEconomyReplaySeeds } from "@/engine/economy-replay";
import { checkRaid } from "@/engine/raid-checker";
import type { Position } from "@/engine/types";

export const ARCHETYPE_SEED_COUNT = 200;
export const ARCHETYPE_TICKS = 60;

const MIN_PROFITABLE_SESSION_FRACTION = 0.7;

export type PlayerArchetypeId =
  | "cautious-grinder"
  | "momentum-trader"
  | "heat-seeker"
  | "speed-runner";

export interface PlayerArchetype {
  id: PlayerArchetypeId;
  label: string;
  description: string;
  tickers: readonly string[];
  quantities: readonly number[];
  profitTargetPct: number;
  stopLossPct: number;
  maxHoldTicks: number;
  maxEntryHeat: number;
  maxClosedPositions: number;
}

export const PLAYER_ARCHETYPES: readonly PlayerArchetype[] = [
  {
    id: "cautious-grinder",
    label: "Cautious Grinder",
    description:
      "Low-risk positions in very-low/low heat commodities; prioritises capital preservation over aggressive PnL",
    tickers: ["VBLM", "NGLS", "MTRX"],
    quantities: [10, 10, 5],
    profitTargetPct: 0.003,
    stopLossPct: 0.02,
    maxHoldTicks: 4,
    maxEntryHeat: 20,
    maxClosedPositions: 12,
  },
  {
    id: "momentum-trader",
    label: "Momentum Trader",
    description:
      "Medium-risk positions following price momentum in mid-volatility commodities; balanced heat/PnL profile",
    tickers: ["PGAS", "ORRS", "SNPS"],
    quantities: [25, 10, 10],
    profitTargetPct: 0.007,
    stopLossPct: 0.028,
    maxHoldTicks: 3,
    maxEntryHeat: 50,
    maxClosedPositions: 8,
  },
  {
    id: "heat-seeker",
    label: "Heat Seeker",
    description:
      "High-risk contraband positions; tolerates elevated heat and raid exposure in pursuit of larger per-trade PnL",
    tickers: ["FDST", "AETH", "BLCK"],
    quantities: [10, 25, 5],
    profitTargetPct: 0.012,
    stopLossPct: 0.045,
    maxHoldTicks: 4,
    maxEntryHeat: 58,
    maxClosedPositions: 6,
  },
  {
    id: "speed-runner",
    label: "Speed Runner",
    description:
      "High-frequency scalping across safe commodities; maximises completed trade cycles per session over per-trade margin",
    tickers: ["VBLM", "MTRX", "PGAS"],
    quantities: [5, 5, 5],
    profitTargetPct: 0.003,
    stopLossPct: 0.018,
    maxHoldTicks: 3,
    maxEntryHeat: 38,
    maxClosedPositions: 20,
  },
];

export interface ArchetypeSessionResult {
  seed: string;
  finalBalanceObol: number;
  realizedPnl: number;
  trades: number;
  profitableTrades: number;
  raids: number;
  maxHeat: number;
  firstProfitableSellTick: number | null;
  impossibleStates: number;
}

export interface ArchetypeReport {
  archetypeId: PlayerArchetypeId;
  label: string;
  description: string;
  seedCount: number;
  ticks: number;
  profitableSessionCount: number;
  profitableSessionFraction: number;
  raidSessionCount: number;
  noTradeSessionCount: number;
  impossibleStateCount: number;
  medianPnl: number;
  p25Pnl: number;
  p75Pnl: number;
  medianTrades: number;
  medianMaxHeat: number;
  medianFirstProfitTick: number | null;
  passed: boolean;
  failReasons: string[];
}

interface ArchetypeHolding extends DemoHolding {
  openedTick: number;
}

export function runPlayerArchetypeReport(
  archetype: PlayerArchetype,
  input?: { seedCount?: number; ticks?: number; seedPrefix?: string },
): ArchetypeReport {
  const seedCount = input?.seedCount ?? ARCHETYPE_SEED_COUNT;
  const ticks = input?.ticks ?? ARCHETYPE_TICKS;
  const seeds = makeEconomyReplaySeeds(
    seedCount,
    input?.seedPrefix ?? `oracle-p0-005:${archetype.id}`,
  );
  const sessions = seeds.map((seed) => runArchetypeSession(archetype, seed, ticks));

  const pnls = sessions.map((s) => s.realizedPnl).sort((a, b) => a - b);
  const profitableSessionCount = sessions.filter((s) => s.profitableTrades > 0).length;
  const raidSessionCount = sessions.filter((s) => s.raids > 0).length;
  const noTradeSessionCount = sessions.filter((s) => s.trades === 0).length;
  const impossibleStateCount = sessions.reduce((acc, s) => acc + s.impossibleStates, 0);

  const profitableSessionFraction = profitableSessionCount / seedCount;

  const failReasons: string[] = [];

  if (impossibleStateCount > 0) {
    failReasons.push(`${impossibleStateCount} impossible state(s)`);
  }

  if (profitableSessionFraction < MIN_PROFITABLE_SESSION_FRACTION) {
    failReasons.push(
      `Only ${(profitableSessionFraction * 100).toFixed(1)}% profitable sessions; expected >= ${(MIN_PROFITABLE_SESSION_FRACTION * 100).toFixed(0)}%`,
    );
  }

  const firstProfitTicks = sessions
    .map((s) => s.firstProfitableSellTick)
    .filter((t): t is number => t !== null);

  return {
    archetypeId: archetype.id,
    label: archetype.label,
    description: archetype.description,
    seedCount,
    ticks,
    profitableSessionCount,
    profitableSessionFraction,
    raidSessionCount,
    noTradeSessionCount,
    impossibleStateCount,
    medianPnl: median(pnls),
    p25Pnl: quartile(pnls, 0.25),
    p75Pnl: quartile(pnls, 0.75),
    medianTrades: median(sessions.map((s) => s.trades)),
    medianMaxHeat: median(sessions.map((s) => s.maxHeat)),
    medianFirstProfitTick: firstProfitTicks.length ? median(firstProfitTicks) : null,
    passed: failReasons.length === 0,
    failReasons,
  };
}

export function runAllPlayerArchetypes(input?: {
  seedCount?: number;
  ticks?: number;
}): ArchetypeReport[] {
  return PLAYER_ARCHETYPES.map((archetype) => runPlayerArchetypeReport(archetype, input));
}

export function formatArchetypeReport(report: ArchetypeReport): string {
  const pctProfit = (report.profitableSessionFraction * 100).toFixed(1);
  const raidPct = ((report.raidSessionCount / report.seedCount) * 100).toFixed(1);
  return [
    `ARCHETYPE ${report.archetypeId} seeds=${report.seedCount} ticks=${report.ticks}`,
    `profitable=${report.profitableSessionCount}/${report.seedCount} (${pctProfit}%) raids=${report.raidSessionCount} (${raidPct}%) noTrade=${report.noTradeSessionCount}`,
    `medianPnl=${report.medianPnl.toFixed(2)} p25=${report.p25Pnl.toFixed(2)} p75=${report.p75Pnl.toFixed(2)}`,
    `medianTrades=${report.medianTrades} medianMaxHeat=${report.medianMaxHeat} firstProfitTick=${report.medianFirstProfitTick ?? "none"}`,
    report.passed ? "STATUS: PASS" : `STATUS: FAIL — ${report.failReasons.join("; ")}`,
  ].join("\n");
}

export function formatAllArchetypeReports(reports: ArchetypeReport[]): string {
  return reports.map(formatArchetypeReport).join("\n\n");
}

function runArchetypeSession(
  archetype: PlayerArchetype,
  seed: string,
  ticks: number,
): ArchetypeSessionResult {
  let resources: DemoResources = { ...INITIAL_RESOURCES };
  let prices = createInitialPrices();
  let holding: ArchetypeHolding | null = null;
  let entryIndex = 0;
  let closedPositions = 0;
  let realizedPnl = 0;
  let trades = 0;
  let profitableTrades = 0;
  let raids = 0;
  let maxHeat = resources.heat;
  let firstProfitableSellTick: number | null = null;
  let impossibleStates = 0;

  for (let tick = 1; tick <= ticks; tick += 1) {
    prices = advancePrices(prices, tick, seed).prices;
    resources = { ...resources, ...applyMarketClockPulse(resources, tick) };
    maxHeat = Math.max(maxHeat, resources.heat);

    if (!isPossibleState(resources, prices, holding)) {
      impossibleStates += 1;
    }

    if (holding) {
      const sale = maybeSellArchetypeHolding({
        holding,
        prices,
        resources,
        archetype,
        tick,
        force: tick === ticks,
      });

      if (sale.sold) {
        resources = sale.resources;
        realizedPnl = roundCurrency(realizedPnl + sale.realizedPnl);
        trades += 1;
        closedPositions += 1;
        if (sale.realizedPnl > 0) {
          profitableTrades += 1;
          firstProfitableSellTick = firstProfitableSellTick ?? tick;
        }
        holding = null;
      }
    }

    if (
      !holding &&
      closedPositions < archetype.maxClosedPositions &&
      resources.heat < archetype.maxEntryHeat &&
      tick < ticks
    ) {
      const ticker =
        archetype.tickers[entryIndex % archetype.tickers.length] ?? archetype.tickers[0];
      const quantity =
        archetype.quantities[entryIndex % archetype.quantities.length] ??
        archetype.quantities[0];
      entryIndex += 1;

      if (ticker && quantity) {
        const price = prices[ticker];
        const check = canExecuteTrade({ ticker, side: "BUY", quantity, resources });
        const totalCost = price === undefined ? Infinity : roundCurrency(price * quantity);

        if (check.ok && price !== undefined && resources.balanceObol >= totalCost) {
          const bought = buyCommodity({ ticker, quantity, price, resources });
          resources = bought.resources;
          holding = { ...bought.holding, openedTick: tick };
          trades += 1;
        }
      }
    }

    const bounty = getBountyByHeat(resources.heat);
    const raid = checkRaid({
      seed,
      tick,
      heat: resources.heat,
      positions: toRaidPositions(holding, prices),
      raidIntervalTicks: getBountyRaidIntervalTicks(bounty.level),
      probabilityDivisor: bounty.raidProbabilityDivisor,
    });

    if (raid.triggered && holding) {
      const loss = raid.losses[holding.ticker] ?? 0;
      const quantity = Math.max(0, holding.quantity - loss);
      raids += 1;
      holding = quantity > 0 ? { ...holding, quantity } : null;
    }

    maxHeat = Math.max(maxHeat, resources.heat);
  }

  return {
    seed,
    finalBalanceObol: resources.balanceObol,
    realizedPnl,
    trades,
    profitableTrades,
    raids,
    maxHeat,
    firstProfitableSellTick,
    impossibleStates,
  };
}

function maybeSellArchetypeHolding(input: {
  holding: ArchetypeHolding;
  prices: PriceMap;
  resources: DemoResources;
  archetype: PlayerArchetype;
  tick: number;
  force: boolean;
}): { sold: true; resources: DemoResources; realizedPnl: number } | { sold: false } {
  const price = input.prices[input.holding.ticker];
  if (price === undefined) {
    return { sold: false };
  }

  const heldTicks = input.tick - input.holding.openedTick;
  const targetPrice = roundCurrency(input.holding.avgEntry * (1 + input.archetype.profitTargetPct));
  const stopPrice = roundCurrency(input.holding.avgEntry * (1 - input.archetype.stopLossPct));
  const isProfitable = price > input.holding.avgEntry;

  const shouldSell =
    (input.force && isProfitable) ||
    heldTicks >= input.archetype.maxHoldTicks ||
    price >= targetPrice ||
    price <= stopPrice;

  if (!shouldSell) {
    return { sold: false };
  }

  const check = canExecuteTrade({
    ticker: input.holding.ticker,
    side: "SELL",
    quantity: input.holding.quantity,
    resources: input.resources,
  });

  if (!check.ok) {
    return { sold: false };
  }

  const sold = sellCommodity({
    ticker: input.holding.ticker,
    price,
    resources: input.resources,
    holding: input.holding,
  });

  return { sold: true, resources: sold.resources, realizedPnl: sold.realizedPnl };
}

function toRaidPositions(
  holding: ArchetypeHolding | null,
  prices: PriceMap,
): Record<string, Position> {
  if (!holding) {
    return {};
  }
  const currentPrice = prices[holding.ticker] ?? holding.avgEntry;
  return {
    [holding.ticker]: {
      id: `archetype-${holding.ticker}`,
      ticker: holding.ticker,
      quantity: holding.quantity,
      avgEntry: holding.avgEntry,
      realizedPnl: 0,
      unrealizedPnl: roundCurrency((currentPrice - holding.avgEntry) * holding.quantity),
      openedAt: "2077-01-01T00:00:00.000Z",
      closedAt: null,
    },
  };
}

function isPossibleState(
  resources: DemoResources,
  prices: PriceMap,
  holding: ArchetypeHolding | null,
): boolean {
  if (
    resources.balanceObol < 0 ||
    resources.energySeconds < 0 ||
    resources.heat < 0 ||
    resources.heat > 100
  ) {
    return false;
  }
  if (Object.values(prices).some((p) => !Number.isFinite(p) || p <= 0)) {
    return false;
  }
  return !holding || (holding.quantity > 0 && holding.avgEntry > 0);
}

function median(values: number[]): number {
  if (!values.length) {
    return 0;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) {
    return sorted[mid]!;
  }
  return roundCurrency((sorted[mid - 1]! + sorted[mid]!) / 2);
}

function quartile(sorted: number[], q: number): number {
  if (!sorted.length) {
    return 0;
  }
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  const baseVal = sorted[base] ?? 0;
  const nextVal = sorted[base + 1] ?? baseVal;
  return roundCurrency(baseVal + rest * (nextVal - baseVal));
}
