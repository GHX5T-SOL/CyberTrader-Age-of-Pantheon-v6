import {
  getCommodity,
  getStealthAdjustedHeatDelta,
  getTradeEnergyCost,
  roundCurrency,
  type ChangeMap,
  type DemoHolding,
  type DemoResources,
  type PriceMap,
} from "./demo-market";
import type {
  Faction,
  FactionMarketPressure,
  FactionStanding,
  LimitOrder,
  LimitOrderExecution,
  LimitOrderFill,
  LimitOrderSide,
} from "./types";

export type HoldingMap = Record<string, DemoHolding | undefined>;

export interface ResolveLimitOrdersInput {
  orders: readonly LimitOrder[];
  prices: PriceMap;
  resources: DemoResources;
  holdings: HoldingMap;
  tick: number;
}

export interface ResolveLimitOrdersResult {
  orders: LimitOrder[];
  fills: LimitOrderFill[];
  resources: DemoResources;
  holdings: HoldingMap;
}

export interface LimitOrderResolution {
  order: LimitOrder;
  resources: DemoResources;
  holding: DemoHolding | null;
  execution: LimitOrderExecution | null;
}

const LIMIT_ORDER_DEFAULT_DURATION_TICKS = 12;
const LIMIT_ORDER_MAX_DURATION_TICKS = 96;
const FACTION_PRESSURE_DURATION_TICKS = 8;

const FACTION_TICKER_BIAS: Record<Faction, Record<string, number>> = {
  FREE_SPLINTERS: { VBLM: 0.8, MTRX: 0.55, BLCK: -0.45 },
  BLACKWAKE: { PGAS: 1.25, FDST: 0.85, BLCK: 0.75, NGLS: -0.35 },
  NULL_CROWN: { GLCH: 1, AETH: 0.85, BLCK: 0.65 },
  ARCHIVISTS: { NGLS: 0.95, ORRS: 0.75, GLCH: 0.55, FDST: -0.35 },
};

const FACTION_PRESSURE_HEAT_DELTA: Record<Faction, number> = {
  FREE_SPLINTERS: 0,
  BLACKWAKE: 3,
  NULL_CROWN: 2,
  ARCHIVISTS: 1,
};

export function createLimitOrder(input: {
  playerId: string;
  ticker: string;
  side: LimitOrderSide;
  quantity: number;
  limitPrice: number;
  createdAtTick: number;
  expiresAtTick?: number;
  durationTicks?: number;
  faction?: Faction | null;
}): LimitOrder {
  const ticker = input.ticker.trim().toUpperCase();
  if (!getCommodity(ticker)) {
    throw new Error(`Unknown ticker: ${ticker}`);
  }
  const playerId = input.playerId.trim() || "local-agent";
  const quantity = Math.max(1, Math.floor(input.quantity));
  const limitPrice = roundCurrency(Math.max(0.01, input.limitPrice));
  const createdAtTick = Math.max(0, Math.floor(input.createdAtTick));
  const durationTicks = Math.min(
    LIMIT_ORDER_MAX_DURATION_TICKS,
    Math.max(1, Math.floor(input.durationTicks ?? LIMIT_ORDER_DEFAULT_DURATION_TICKS)),
  );
  const expiresAtTick = Math.max(
    createdAtTick + 1,
    Math.floor(input.expiresAtTick ?? createdAtTick + durationTicks),
  );

  return {
    id: ["limit", playerId, ticker, input.side.toLowerCase(), quantity, Math.round(limitPrice * 100), createdAtTick].join("-"),
    playerId,
    ticker,
    side: input.side,
    quantity,
    limitPrice,
    status: "open",
    createdAtTick,
    expiresAtTick,
    faction: input.faction ?? null,
    filledAtTick: null,
    executedAtTick: null,
    cancelledAtTick: null,
    cancelReason: null,
    rejectionReason: null,
  };
}

export function shouldExecuteLimitOrder(order: LimitOrder, marketPrice: number): boolean {
  if (order.status !== "open") {
    return false;
  }
  return order.side === "BUY" ? marketPrice <= order.limitPrice : marketPrice >= order.limitPrice;
}

export function cancelLimitOrder(order: LimitOrder, cancelledAtTick: number, cancelReason = "cancelled"): LimitOrder {
  if (order.status !== "open") {
    return order;
  }
  return {
    ...order,
    status: "cancelled",
    cancelledAtTick: Math.max(0, Math.floor(cancelledAtTick)),
    cancelReason,
  };
}

export function resolveLimitOrders(input: ResolveLimitOrdersInput): ResolveLimitOrdersResult {
  const tick = Math.max(0, Math.floor(input.tick));
  let resources = { ...input.resources };
  const holdings: HoldingMap = { ...input.holdings };
  const fills: LimitOrderFill[] = [];
  const orders = input.orders.map((order) => {
    const activeOrder = expireLimitOrder(order, tick);
    if (activeOrder.status !== "open") {
      return activeOrder;
    }
    const marketPrice = input.prices[activeOrder.ticker];
    if (marketPrice === undefined || !shouldExecuteLimitOrder(activeOrder, marketPrice)) {
      return activeOrder;
    }
    const result = fillLimitOrder({ order: activeOrder, marketPrice, resources, holdings, tick });
    resources = result.resources;
    Object.keys(holdings).forEach((ticker) => {
      if (result.holdings[ticker] === undefined) {
        delete holdings[ticker];
      }
    });
    Object.assign(holdings, result.holdings);
    if (result.fill) {
      fills.push(result.fill);
    }
    return result.order;
  });
  return { orders, fills, resources, holdings };
}

export function resolveLimitOrder(input: {
  order: LimitOrder;
  marketPrice: number;
  tick: number;
  resources: DemoResources;
  holding?: DemoHolding | null;
}): LimitOrderResolution {
  const resolved = resolveLimitOrders({
    orders: [input.order],
    prices: { [input.order.ticker]: input.marketPrice },
    resources: input.resources,
    holdings: input.holding ? { [input.holding.ticker]: input.holding } : {},
    tick: input.tick,
  });
  const order = resolved.orders[0] ?? input.order;
  const fill = resolved.fills[0];
  return {
    order: fill ? { ...order, status: "executed", executedAtTick: fill.tick } : order,
    resources: resolved.resources,
    holding: resolved.holdings[input.order.ticker] ?? null,
    execution: fill
      ? {
          orderId: fill.orderId,
          ticker: fill.ticker,
          side: fill.side,
          quantity: fill.quantity,
          limitPrice: fill.limitPrice,
          executedPrice: fill.executionPrice,
          tick: fill.tick,
          balanceDelta: fill.side === "BUY"
            ? -roundCurrency(fill.executionPrice * fill.quantity)
            : roundCurrency(fill.executionPrice * fill.quantity),
          heatDelta: fill.heatDelta,
          realizedPnl: fill.realizedPnl,
        }
      : null,
  };
}

export function createFactionMarketPressure(input: {
  faction: Faction;
  tick: number;
  reputation: number;
}): FactionMarketPressure {
  const tick = Math.max(0, Math.floor(input.tick));
  const reputation = Math.max(0, Math.min(100, Math.floor(input.reputation)));
  return {
    id: ["pressure", input.faction, reputation, tick].join("-"),
    faction: input.faction,
    tick,
    reputation,
    intensity: roundCurrency(0.008 + reputation / 5_000),
    tickerBias: FACTION_TICKER_BIAS[input.faction],
    heatDelta: FACTION_PRESSURE_HEAT_DELTA[input.faction],
    volatilityMultiplier: reputation >= 90 ? 1.1 : reputation >= 50 ? 1 : 0.75,
    expiresAtTick: tick + FACTION_PRESSURE_DURATION_TICKS,
  };
}

export function applyFactionMarketPressure(input: {
  prices: PriceMap;
  pressure: FactionMarketPressure;
  tick: number;
}): { prices: PriceMap; changes: ChangeMap; heatDelta: number } {
  const tick = Math.max(0, Math.floor(input.tick));
  const prices: PriceMap = { ...input.prices };
  const changes: ChangeMap = {};
  if (tick < input.pressure.tick || tick > input.pressure.expiresAtTick) {
    return { prices, changes, heatDelta: 0 };
  }
  for (const [ticker, bias] of Object.entries(input.pressure.tickerBias)) {
    const current = prices[ticker] ?? getCommodity(ticker)?.basePrice;
    if (current === undefined) {
      continue;
    }
    const next = roundCurrency(Math.max(1, current * (1 + input.pressure.intensity * input.pressure.volatilityMultiplier * bias)));
    prices[ticker] = next;
    changes[ticker] = roundCurrency(next - current);
  }
  return { prices, changes, heatDelta: input.pressure.heatDelta };
}

export function createFactionMarketPressures(input: {
  standing: FactionStanding;
  tick: number;
}): readonly {
  id: string;
  faction: Faction;
  standingTier: FactionStanding["tier"];
  ticker: string;
  direction: "support" | "suppress";
  intensityBps: number;
  startedAtTick: number;
  expiresAtTick: number;
  reason: string;
}[] {
  const pressure = createFactionMarketPressure({
    faction: input.standing.faction,
    reputation: input.standing.reputation,
    tick: input.tick,
  });
  return Object.entries(pressure.tickerBias).map(([ticker, bias]) => ({
    id: ["pressure", pressure.faction, input.standing.tier, bias >= 0 ? "support" : "suppress", ticker, pressure.tick].join("-"),
    faction: pressure.faction,
    standingTier: input.standing.tier,
    ticker,
    direction: bias >= 0 ? "support" : "suppress",
    intensityBps: Math.max(1, Math.round(pressure.intensity * pressure.volatilityMultiplier * Math.abs(bias) * 10_000)),
    startedAtTick: pressure.tick,
    expiresAtTick: pressure.expiresAtTick,
    reason: `${pressure.faction} market pressure ${bias >= 0 ? "supports" : "suppresses"} ${ticker}.`,
  }));
}

export function applyFactionMarketPressures(input: {
  prices: PriceMap;
  changes?: ChangeMap;
  pressures: readonly {
    ticker: string;
    direction: "support" | "suppress";
    intensityBps: number;
    startedAtTick: number;
    expiresAtTick: number;
  }[];
  tick: number;
}): { prices: PriceMap; changes: ChangeMap } {
  const tick = Math.max(0, Math.floor(input.tick));
  const prices: PriceMap = { ...input.prices };
  const changes: ChangeMap = { ...(input.changes ?? {}) };
  for (const pressure of input.pressures) {
    if (tick < pressure.startedAtTick || tick > pressure.expiresAtTick) {
      continue;
    }
    const current = prices[pressure.ticker] ?? getCommodity(pressure.ticker)?.basePrice;
    if (current === undefined) {
      continue;
    }
    const multiplier = pressure.direction === "support" ? 1 + pressure.intensityBps / 10_000 : 1 - pressure.intensityBps / 10_000;
    const next = roundCurrency(Math.max(1, current * multiplier));
    prices[pressure.ticker] = next;
    changes[pressure.ticker] = roundCurrency((changes[pressure.ticker] ?? 0) + next - current);
  }
  return { prices, changes };
}

export function updateLimitOrderForTick(order: LimitOrder, tick: number): LimitOrder {
  return expireLimitOrder(order, tick);
}

function expireLimitOrder(order: LimitOrder, tick: number): LimitOrder {
  if (order.status !== "open" || tick <= order.expiresAtTick) {
    return order;
  }
  return { ...order, status: "expired", cancelledAtTick: tick, cancelReason: "expired" };
}

function fillLimitOrder(input: {
  order: LimitOrder;
  marketPrice: number;
  resources: DemoResources;
  holdings: HoldingMap;
  tick: number;
}): { order: LimitOrder; fill: LimitOrderFill | null; resources: DemoResources; holdings: HoldingMap } {
  const energyCost = getTradeEnergyCost(input.order.side, input.order.quantity);
  const heatDelta = getStealthAdjustedHeatDelta(input.resources, input.order.ticker, input.order.side);
  if (input.resources.energySeconds < energyCost) {
    return cancelOrderForResolution(input, "cancelled: insufficient energy");
  }
  if (input.resources.heat + heatDelta >= 100) {
    return cancelOrderForResolution(input, "cancelled: heat ceiling");
  }
  return input.order.side === "BUY"
    ? fillBuyLimitOrder({ ...input, energyCost, heatDelta })
    : fillSellLimitOrder({ ...input, energyCost, heatDelta });
}

function fillBuyLimitOrder(input: {
  order: LimitOrder;
  marketPrice: number;
  resources: DemoResources;
  holdings: HoldingMap;
  tick: number;
  energyCost: number;
  heatDelta: number;
}): { order: LimitOrder; fill: LimitOrderFill | null; resources: DemoResources; holdings: HoldingMap } {
  const total = roundCurrency(input.marketPrice * input.order.quantity);
  if (input.resources.balanceObol < total) {
    return cancelOrderForResolution(input, "cancelled: insufficient 0BOL");
  }
  const currentHolding = input.holdings[input.order.ticker];
  const currentQuantity = currentHolding?.quantity ?? 0;
  const currentCostBasis = (currentHolding?.avgEntry ?? 0) * currentQuantity;
  const nextQuantity = currentQuantity + input.order.quantity;
  return finalizeFill({
    ...input,
    resources: {
      balanceObol: roundCurrency(input.resources.balanceObol - total),
      energySeconds: Math.max(0, input.resources.energySeconds - input.energyCost),
      heat: input.resources.heat + input.heatDelta,
    },
    holdings: {
      ...input.holdings,
      [input.order.ticker]: {
        ticker: input.order.ticker,
        quantity: nextQuantity,
        avgEntry: roundCurrency((currentCostBasis + total) / nextQuantity),
      },
    },
    realizedPnl: 0,
  });
}

function fillSellLimitOrder(input: {
  order: LimitOrder;
  marketPrice: number;
  resources: DemoResources;
  holdings: HoldingMap;
  tick: number;
  energyCost: number;
  heatDelta: number;
}): { order: LimitOrder; fill: LimitOrderFill | null; resources: DemoResources; holdings: HoldingMap } {
  const currentHolding = input.holdings[input.order.ticker];
  if (!currentHolding) {
    return cancelOrderForResolution(input, "cancelled: missing holding");
  }
  if (currentHolding.quantity < input.order.quantity) {
    return cancelOrderForResolution(input, "cancelled: insufficient holding");
  }
  const proceeds = roundCurrency(input.marketPrice * input.order.quantity);
  const costBasis = roundCurrency(currentHolding.avgEntry * input.order.quantity);
  const nextQuantity = roundCurrency(currentHolding.quantity - input.order.quantity);
  const holdings = { ...input.holdings };
  if (nextQuantity > 0) {
    holdings[input.order.ticker] = { ...currentHolding, quantity: nextQuantity };
  } else {
    delete holdings[input.order.ticker];
  }
  return finalizeFill({
    ...input,
    resources: {
      balanceObol: roundCurrency(input.resources.balanceObol + proceeds),
      energySeconds: Math.max(0, input.resources.energySeconds - input.energyCost),
      heat: input.resources.heat + input.heatDelta,
    },
    holdings,
    realizedPnl: roundCurrency(proceeds - costBasis),
  });
}

function finalizeFill(input: {
  order: LimitOrder;
  marketPrice: number;
  resources: DemoResources;
  holdings: HoldingMap;
  tick: number;
  energyCost: number;
  heatDelta: number;
  realizedPnl: number;
}): { order: LimitOrder; fill: LimitOrderFill; resources: DemoResources; holdings: HoldingMap } {
  return {
    order: { ...input.order, status: "filled", filledAtTick: input.tick, executedAtTick: input.tick },
    fill: {
      id: `fill-${input.order.id}-${input.tick}`,
      orderId: input.order.id,
      playerId: input.order.playerId,
      ticker: input.order.ticker,
      side: input.order.side,
      quantity: input.order.quantity,
      limitPrice: input.order.limitPrice,
      executionPrice: roundCurrency(input.marketPrice),
      tick: input.tick,
      faction: input.order.faction,
      heatDelta: input.heatDelta,
      energyCost: input.energyCost,
      realizedPnl: input.realizedPnl,
    },
    resources: input.resources,
    holdings: input.holdings,
  };
}

function cancelOrderForResolution(
  input: { order: LimitOrder; resources: DemoResources; holdings: HoldingMap; tick: number },
  reason: string,
): { order: LimitOrder; fill: null; resources: DemoResources; holdings: HoldingMap } {
  return {
    order: cancelLimitOrder(input.order, input.tick, reason),
    fill: null,
    resources: input.resources,
    holdings: input.holdings,
  };
}
