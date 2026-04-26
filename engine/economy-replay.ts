import { getBountyByHeat, getBountyRaidIntervalTicks } from "@/engine/bounty";
import {
  DEMO_COMMODITIES,
  INITIAL_RESOURCES,
  ORDER_SIZES,
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
import { seededStream } from "@/engine/prng";
import { checkRaid } from "@/engine/raid-checker";
import type { Position } from "@/engine/types";

export const ECONOMY_REPLAY_SESSION_COUNT = 1000;
export const ECONOMY_REPLAY_TICKS = 60;

export type EconomyReplayIssueType = "soft_lock" | "impossible_state";

export interface EconomyReplayIssue {
  seed: string;
  tick: number;
  type: EconomyReplayIssueType;
  detail: string;
}

export interface EconomyReplaySessionResult {
  seed: string;
  ticks: number;
  finalBalanceObol: number;
  realizedPnl: number;
  trades: number;
  profitableTrades: number;
  blockedTrades: number;
  raids: number;
  maxHeat: number;
  minEnergySeconds: number;
  firstProfitableSellTick: number | null;
  issues: EconomyReplayIssue[];
}

export interface EconomyReplaySummary {
  sessionCount: number;
  ticksPerSession: number;
  issueCounts: Record<EconomyReplayIssueType, number>;
  profitableSessionCount: number;
  raidSessionCount: number;
  medians: {
    finalBalanceObol: number;
    realizedPnl: number;
    trades: number;
    profitableTrades: number;
    blockedTrades: number;
    raids: number;
    maxHeat: number;
    minEnergySeconds: number;
    firstProfitableSellTick: number | null;
  };
  sessions: EconomyReplaySessionResult[];
}

interface ReplayHolding extends DemoHolding {
  openedTick: number;
}

const ENTRY_TICKERS = DEMO_COMMODITIES.filter(
  (commodity) => commodity.heatRisk === "very_low" || commodity.heatRisk === "low" || commodity.heatRisk === "med",
).map((commodity) => commodity.ticker);

const DEFENSIVE_TICKERS = DEMO_COMMODITIES.filter(
  (commodity) => commodity.heatRisk === "very_low" || commodity.heatRisk === "low",
).map((commodity) => commodity.ticker);

export function makeEconomyReplaySeeds(
  count = ECONOMY_REPLAY_SESSION_COUNT,
  prefix = "oracle-p0-001",
): string[] {
  return Array.from({ length: count }, (_, index) => `${prefix}-${String(index + 1).padStart(4, "0")}`);
}

export function runEconomyReplay(input?: {
  seeds?: readonly string[];
  ticks?: number;
  startingResources?: DemoResources;
}): EconomyReplaySummary {
  const seeds = input?.seeds ?? makeEconomyReplaySeeds();
  const ticks = input?.ticks ?? ECONOMY_REPLAY_TICKS;
  const sessions = seeds.map((seed) => runEconomyReplaySession(seed, {
    ticks,
    startingResources: input?.startingResources,
  }));
  const issues = sessions.flatMap((session) => session.issues);

  return {
    sessionCount: sessions.length,
    ticksPerSession: ticks,
    issueCounts: {
      soft_lock: issues.filter((issue) => issue.type === "soft_lock").length,
      impossible_state: issues.filter((issue) => issue.type === "impossible_state").length,
    },
    profitableSessionCount: sessions.filter((session) => session.profitableTrades > 0).length,
    raidSessionCount: sessions.filter((session) => session.raids > 0).length,
    medians: {
      finalBalanceObol: median(sessions.map((session) => session.finalBalanceObol)),
      realizedPnl: median(sessions.map((session) => session.realizedPnl)),
      trades: median(sessions.map((session) => session.trades)),
      profitableTrades: median(sessions.map((session) => session.profitableTrades)),
      blockedTrades: median(sessions.map((session) => session.blockedTrades)),
      raids: median(sessions.map((session) => session.raids)),
      maxHeat: median(sessions.map((session) => session.maxHeat)),
      minEnergySeconds: median(sessions.map((session) => session.minEnergySeconds)),
      firstProfitableSellTick: nullableMedian(
        sessions
          .map((session) => session.firstProfitableSellTick)
          .filter((tick): tick is number => tick !== null),
      ),
    },
    sessions,
  };
}

export function runEconomyReplaySession(
  seed: string,
  input?: { ticks?: number; startingResources?: DemoResources },
): EconomyReplaySessionResult {
  const ticks = input?.ticks ?? ECONOMY_REPLAY_TICKS;
  let resources = { ...(input?.startingResources ?? INITIAL_RESOURCES) };
  let prices = createInitialPrices();
  let holding: ReplayHolding | null = null;
  const issues: EconomyReplayIssue[] = [];
  let realizedPnl = 0;
  let trades = 0;
  let profitableTrades = 0;
  let blockedTrades = 0;
  let raids = 0;
  let maxHeat = resources.heat;
  let minEnergySeconds = resources.energySeconds;
  let firstProfitableSellTick: number | null = null;

  for (let tick = 1; tick <= ticks; tick += 1) {
    const tickPrices = advancePrices(prices, tick, seed);
    prices = tickPrices.prices;
    resources = { ...resources, ...applyMarketClockPulse(resources, tick) };
    maxHeat = Math.max(maxHeat, resources.heat);
    minEnergySeconds = Math.min(minEnergySeconds, resources.energySeconds);

    if (!isPossibleState(resources, prices, holding)) {
      issues.push({ seed, tick, type: "impossible_state", detail: "Negative resource, invalid price, or invalid holding detected." });
    }

    if (holding) {
      const sale = maybeSellHolding({
        seed,
        tick,
        prices,
        resources,
        holding,
        force: tick === ticks,
      });

      if (sale.sold) {
        resources = sale.resources;
        realizedPnl = roundCurrency(realizedPnl + sale.realizedPnl);
        trades += 1;
        if (sale.realizedPnl > 0) {
          profitableTrades += 1;
          firstProfitableSellTick = firstProfitableSellTick ?? tick;
        }
        holding = null;
      } else if (sale.blocked) {
        blockedTrades += 1;
        if (tick === ticks) {
          issues.push({ seed, tick, type: "soft_lock", detail: sale.reason });
        }
      }
    } else {
      const entry = chooseEntry(seed, tick, resources, prices);
      if (entry) {
        const check = canExecuteTrade({
          ticker: entry.ticker,
          side: "BUY",
          quantity: entry.quantity,
          resources,
        });
        const price = prices[entry.ticker];
        const totalCost = price === undefined ? Infinity : roundCurrency(price * entry.quantity);

        if (check.ok && price !== undefined && resources.balanceObol >= totalCost) {
          const bought = buyCommodity({
            ticker: entry.ticker,
            quantity: entry.quantity,
            price,
            resources,
          });
          resources = bought.resources;
          holding = { ...bought.holding, openedTick: tick };
          trades += 1;
        } else {
          blockedTrades += 1;
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
      const loss: number = raid.losses[holding.ticker] ?? 0;
      const nextQuantity = Math.max(0, holding.quantity - loss);
      holding = {
        ...holding,
        quantity: nextQuantity,
      };
      raids += 1;
      if (holding.quantity <= 0) {
        holding = null;
      }
    }

    maxHeat = Math.max(maxHeat, resources.heat);
    minEnergySeconds = Math.min(minEnergySeconds, resources.energySeconds);
  }

  if (trades === 0) {
    issues.push({ seed, tick: ticks, type: "soft_lock", detail: "Session completed without any executable trade." });
  }

  return {
    seed,
    ticks,
    finalBalanceObol: resources.balanceObol,
    realizedPnl,
    trades,
    profitableTrades,
    blockedTrades,
    raids,
    maxHeat,
    minEnergySeconds,
    firstProfitableSellTick,
    issues,
  };
}

export function formatEconomyReplaySummary(summary: EconomyReplaySummary): string {
  const medians = summary.medians;
  return [
    `sessions=${summary.sessionCount}`,
    `ticks=${summary.ticksPerSession}`,
    `profitableSessions=${summary.profitableSessionCount}`,
    `raidSessions=${summary.raidSessionCount}`,
    `softLocks=${summary.issueCounts.soft_lock}`,
    `impossibleStates=${summary.issueCounts.impossible_state}`,
    `medianPnl=${medians.realizedPnl.toFixed(2)}`,
    `medianFinalBalance=${medians.finalBalanceObol.toFixed(2)}`,
    `medianTrades=${medians.trades}`,
    `medianMaxHeat=${medians.maxHeat}`,
    `medianFirstProfitTick=${medians.firstProfitableSellTick ?? "none"}`,
  ].join(" ");
}

function chooseEntry(
  seed: string,
  tick: number,
  resources: DemoResources,
  prices: PriceMap,
): { ticker: string; quantity: number } | null {
  if (resources.heat >= 82) {
    return null;
  }

  const stream = seededStream(`${seed}:entry:${tick}:${Math.floor(resources.heat)}`);
  const candidates = resources.heat >= 48 ? DEFENSIVE_TICKERS : ENTRY_TICKERS;
  const ticker = candidates[Math.floor(stream() * candidates.length)] ?? DEFENSIVE_TICKERS[0];
  if (!ticker) {
    return null;
  }

  const price = prices[ticker];
  if (price === undefined) {
    return null;
  }

  const orderSize = ORDER_SIZES[Math.floor(stream() * ORDER_SIZES.length)] ?? ORDER_SIZES[0];
  const maxAffordable = Math.floor(resources.balanceObol / price);
  const heatLimitedSize = resources.heat >= 60 ? 5 : orderSize;
  const quantity = Math.max(1, Math.min(heatLimitedSize, maxAffordable));

  if (quantity <= 0) {
    return null;
  }

  return { ticker, quantity };
}

function maybeSellHolding(input: {
  seed: string;
  tick: number;
  prices: PriceMap;
  resources: DemoResources;
  holding: ReplayHolding;
  force: boolean;
}): (
  | { sold: true; resources: DemoResources; realizedPnl: number }
  | { sold: false; blocked: boolean; reason: string }
) {
  const price = input.prices[input.holding.ticker];
  if (price === undefined) {
    return { sold: false, blocked: true, reason: `No sale price for ${input.holding.ticker}.` };
  }

  const heldTicks = input.tick - input.holding.openedTick;
  const stream = seededStream(`${input.seed}:exit:${input.holding.ticker}:${input.holding.openedTick}`);
  const profitTarget = 1.004 + stream() * 0.014;
  const stopLoss = 0.982 - stream() * 0.008;
  const shouldSell =
    input.force ||
    heldTicks >= 3 ||
    price >= roundCurrency(input.holding.avgEntry * profitTarget) ||
    price <= roundCurrency(input.holding.avgEntry * stopLoss);

  if (!shouldSell) {
    return { sold: false, blocked: false, reason: "" };
  }

  const check = canExecuteTrade({
    ticker: input.holding.ticker,
    side: "SELL",
    quantity: input.holding.quantity,
    resources: input.resources,
  });
  if (!check.ok) {
    return { sold: false, blocked: true, reason: check.reason };
  }

  const sold = sellCommodity({
    ticker: input.holding.ticker,
    price,
    resources: input.resources,
    holding: input.holding,
  });

  return { sold: true, resources: sold.resources, realizedPnl: sold.realizedPnl };
}

function toRaidPositions(holding: ReplayHolding | null, prices: PriceMap): Record<string, Position> {
  if (!holding) {
    return {};
  }

  const currentPrice = prices[holding.ticker] ?? holding.avgEntry;
  return {
    [holding.ticker]: {
      id: `replay-${holding.ticker}`,
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
  holding: ReplayHolding | null,
): boolean {
  if (
    resources.balanceObol < 0 ||
    resources.energySeconds < 0 ||
    resources.heat < 0 ||
    resources.heat > 100
  ) {
    return false;
  }

  if (Object.values(prices).some((price) => !Number.isFinite(price) || price <= 0)) {
    return false;
  }

  return !holding || (holding.quantity > 0 && holding.avgEntry > 0);
}

function median(values: number[]): number {
  if (!values.length) {
    return 0;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const midpoint = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) {
    return sorted[midpoint]!;
  }

  return roundCurrency((sorted[midpoint - 1]! + sorted[midpoint]!) / 2);
}

function nullableMedian(values: number[]): number | null {
  return values.length ? median(values) : null;
}
