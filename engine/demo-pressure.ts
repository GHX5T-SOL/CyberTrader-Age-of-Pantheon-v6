import { COURIER_SERVICES } from "@/data/locations";
import {
  getBountyByHeat,
  getBountyCourierRiskBonus,
  getBountyRaidIntervalTicks,
  getBountyRiskLabel,
} from "@/engine/bounty";
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
import { checkRaid } from "@/engine/raid-checker";
import type { Position } from "@/engine/types";

export const DEMO_PRESSURE_TICKS = 60;

export const DEMO_PRESSURE_TARGETS = {
  minViableStrategies: 3,
  maxIssues: 0,
  starterFirstProfitTickMax: 6,
  visibleRiskHeatMin: 30,
  highRiskHeatMin: 70,
  heatCeilingBuffer: 100,
} as const;

export type DemoPressureStrategyId =
  | "starter-stabilizer"
  | "route-runner"
  | "contraband-sprint";

export interface DemoPressureStrategy {
  id: DemoPressureStrategyId;
  label: string;
  tickers: readonly string[];
  quantities: readonly number[];
  profitTargetPct: number;
  stopLossPct: number;
  maxHoldTicks: number;
  maxEntryHeat: number;
  maxClosedPositions: number;
}

export interface CourierRiskBand {
  serviceId: string;
  serviceName: string;
  lossChance: number;
  riskLabel: ReturnType<typeof getBountyRiskLabel>;
}

export interface DemoPressureOutcome {
  strategyId: DemoPressureStrategyId;
  label: string;
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
  bountyStatuses: string[];
  courierRisk: CourierRiskBand[];
  issues: string[];
}

interface PressureHolding extends DemoHolding {
  openedTick: number;
}

export const DEMO_PRESSURE_STRATEGIES: readonly DemoPressureStrategy[] = [
  {
    id: "starter-stabilizer",
    label: "Starter VBLM stabilizer",
    tickers: ["VBLM"],
    quantities: [10],
    profitTargetPct: 0.004,
    stopLossPct: 0.025,
    maxHoldTicks: 3,
    maxEntryHeat: 24,
    maxClosedPositions: 1,
  },
  {
    id: "route-runner",
    label: "Route runner medium tape",
    tickers: ["NGLS", "PGAS", "ORRS"],
    quantities: [25, 10, 10],
    profitTargetPct: 0.006,
    stopLossPct: 0.028,
    maxHoldTicks: 3,
    maxEntryHeat: 58,
    maxClosedPositions: 8,
  },
  {
    id: "contraband-sprint",
    label: "Contraband sprint",
    tickers: ["AETH", "FDST", "BLCK"],
    quantities: [25, 25, 10],
    profitTargetPct: 0.01,
    stopLossPct: 0.04,
    maxHoldTicks: 3,
    maxEntryHeat: 82,
    maxClosedPositions: 8,
  },
];

export function runDemoPressureAudit(input?: {
  ticks?: number;
  seed?: string;
}): DemoPressureOutcome[] {
  return DEMO_PRESSURE_STRATEGIES.map((strategy) =>
    runDemoPressureStrategy(strategy, input),
  );
}

export function runDemoPressureStrategy(
  strategy: DemoPressureStrategy,
  input?: { ticks?: number; seed?: string },
): DemoPressureOutcome {
  const ticks = input?.ticks ?? DEMO_PRESSURE_TICKS;
  const seed = input?.seed ?? "nyx-p0-002";
  let resources: DemoResources = { ...INITIAL_RESOURCES };
  let prices = createInitialPrices();
  let holding: PressureHolding | null = null;
  let entryIndex = 0;
  let realizedPnl = 0;
  let trades = 0;
  let closedPositions = 0;
  let profitableTrades = 0;
  let blockedTrades = 0;
  let raids = 0;
  let maxHeat = resources.heat;
  let minEnergySeconds = resources.energySeconds;
  let firstProfitableSellTick: number | null = null;
  const bountyStatuses = new Set<string>([getBountyByHeat(resources.heat).status]);
  const issues: string[] = [];

  for (let tick = 1; tick <= ticks; tick += 1) {
    prices = advancePrices(prices, tick, `${seed}:${strategy.id}`).prices;
    resources = { ...resources, ...applyMarketClockPulse(resources, tick) };

    if (!isPossibleState(resources, prices, holding)) {
      issues.push(`impossible_state:${tick}`);
    }

    if (holding) {
      const sale = maybeSellPressureHolding({
        holding,
        prices,
        resources,
        strategy,
        tick,
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
        closedPositions += 1;
        holding = null;
      } else if (sale.blocked) {
        blockedTrades += 1;
        if (tick === ticks) {
          issues.push(`blocked_exit:${sale.reason}`);
        }
      }
    }

    if (
      !holding &&
      closedPositions < strategy.maxClosedPositions &&
      resources.heat < strategy.maxEntryHeat &&
      tick < ticks
    ) {
      const ticker = strategy.tickers[entryIndex % strategy.tickers.length] ?? strategy.tickers[0];
      const quantity = strategy.quantities[entryIndex % strategy.quantities.length] ?? strategy.quantities[0];
      entryIndex += 1;

      if (ticker && quantity) {
        const price = prices[ticker];
        const check = canExecuteTrade({
          ticker,
          side: "BUY",
          quantity,
          resources,
        });
        const totalCost = price === undefined ? Infinity : roundCurrency(price * quantity);

        if (check.ok && price !== undefined && resources.balanceObol >= totalCost) {
          const bought = buyCommodity({
            ticker,
            quantity,
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
    bountyStatuses.add(bounty.status);
    const raid = checkRaid({
      seed: `${seed}:${strategy.id}`,
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
    minEnergySeconds = Math.min(minEnergySeconds, resources.energySeconds);
  }

  if (holding) {
    issues.push(`open_position:${holding.ticker}`);
  }
  if (trades === 0) {
    issues.push("no_trades");
  }

  return {
    strategyId: strategy.id,
    label: strategy.label,
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
    bountyStatuses: [...bountyStatuses],
    courierRisk: getCourierRiskBands(maxHeat),
    issues,
  };
}

export function getCourierRiskBands(heat: number): CourierRiskBand[] {
  const bountyBonus = getBountyCourierRiskBonus(heat);
  return COURIER_SERVICES.map((service) => {
    const lossChance = roundCurrency(Math.min(0.95, service.lossChance + bountyBonus));
    return {
      serviceId: service.id,
      serviceName: service.name,
      lossChance,
      riskLabel: getBountyRiskLabel(lossChance),
    };
  });
}

function maybeSellPressureHolding(input: {
  holding: PressureHolding;
  prices: PriceMap;
  resources: DemoResources;
  strategy: DemoPressureStrategy;
  tick: number;
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
  const targetPrice = roundCurrency(input.holding.avgEntry * (1 + input.strategy.profitTargetPct));
  const stopPrice = roundCurrency(input.holding.avgEntry * (1 - input.strategy.stopLossPct));
  const isProfitable = price > input.holding.avgEntry;
  const shouldSell =
    (input.force && isProfitable) ||
    (heldTicks >= input.strategy.maxHoldTicks && isProfitable) ||
    price >= targetPrice ||
    price <= stopPrice;

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

function toRaidPositions(
  holding: PressureHolding | null,
  prices: PriceMap,
): Record<string, Position> {
  if (!holding) {
    return {};
  }

  const currentPrice = prices[holding.ticker] ?? holding.avgEntry;
  return {
    [holding.ticker]: {
      id: `pressure-${holding.ticker}`,
      ticker: holding.ticker,
      quantity: holding.quantity,
      avgEntry: holding.avgEntry,
      realizedPnl: 0,
      unrealizedPnl: roundCurrency((currentPrice - holding.avgEntry) * holding.quantity),
      openedAt: "2077-04-01T00:00:00.000Z",
      closedAt: null,
    },
  };
}

function isPossibleState(
  resources: DemoResources,
  prices: PriceMap,
  holding: PressureHolding | null,
): boolean {
  if (
    resources.balanceObol < 0 ||
    resources.energySeconds < 0 ||
    resources.heat < 0 ||
    resources.heat >= DEMO_PRESSURE_TARGETS.heatCeilingBuffer
  ) {
    return false;
  }

  if (Object.values(prices).some((price) => !Number.isFinite(price) || price <= 0)) {
    return false;
  }

  return !holding || (holding.quantity > 0 && holding.avgEntry > 0);
}
