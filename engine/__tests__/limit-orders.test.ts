import {
  INITIAL_RESOURCES,
  createInitialPrices,
  roundCurrency,
  type DemoHolding,
} from "../demo-market";
import {
  applyFactionMarketPressure,
  cancelLimitOrder,
  createFactionMarketPressure,
  createLimitOrder,
  resolveLimitOrders,
  type HoldingMap,
} from "../limit-orders";

describe("oracle-p1-010 deterministic limit orders and faction pressure", () => {
  it("creates serializable deterministic limit-order contracts", () => {
    const order = createLimitOrder({
      playerId: "local-agent",
      ticker: "vblm",
      side: "BUY",
      quantity: 15,
      limitPrice: 24.25,
      createdAtTick: 7,
      faction: "FREE_SPLINTERS",
    });

    expect(order).toMatchObject({
      id: "limit-local-agent-VBLM-buy-15-2425-7",
      playerId: "local-agent",
      ticker: "VBLM",
      side: "BUY",
      quantity: 15,
      limitPrice: 24.25,
      status: "open",
      createdAtTick: 7,
      expiresAtTick: 19,
      faction: "FREE_SPLINTERS",
      filledAtTick: null,
      cancelledAtTick: null,
      cancelReason: null,
    });
    expect(JSON.parse(JSON.stringify(order))).toEqual(order);
  });

  it("fills eligible buy orders deterministically", () => {
    const order = createLimitOrder({
      playerId: "local-agent",
      ticker: "VBLM",
      side: "BUY",
      quantity: 10,
      limitPrice: 25,
      createdAtTick: 2,
    });
    const input = {
      orders: [order],
      prices: { ...createInitialPrices(), VBLM: 24 },
      resources: { ...INITIAL_RESOURCES },
      holdings: {},
      tick: 3,
    };

    const first = resolveLimitOrders(input);
    const second = resolveLimitOrders(input);

    expect(first).toEqual(second);
    expect(first.orders[0]).toMatchObject({
      status: "filled",
      filledAtTick: 3,
    });
    expect(first.fills).toHaveLength(1);
    expect(first.fills[0]).toMatchObject({
      orderId: order.id,
      side: "BUY",
      quantity: 10,
      executionPrice: 24,
      realizedPnl: 0,
    });
    expect(first.holdings.VBLM).toEqual({
      ticker: "VBLM",
      quantity: 10,
      avgEntry: 24,
    });
    expect(first.resources.balanceObol).toBe(INITIAL_RESOURCES.balanceObol - 240);
    expect(first.resources.energySeconds).toBeLessThan(INITIAL_RESOURCES.energySeconds);
    expect(first.resources.heat).toBeGreaterThan(INITIAL_RESOURCES.heat);
  });

  it("fills eligible sell orders without creating negative holdings", () => {
    const order = createLimitOrder({
      playerId: "local-agent",
      ticker: "PGAS",
      side: "SELL",
      quantity: 8,
      limitPrice: 93,
      createdAtTick: 4,
      faction: "BLACKWAKE",
    });
    const holdings: HoldingMap = {
      PGAS: {
        ticker: "PGAS",
        quantity: 10,
        avgEntry: 90,
      },
    };

    const result = resolveLimitOrders({
      orders: [order],
      prices: { ...createInitialPrices(), PGAS: 94 },
      resources: { ...INITIAL_RESOURCES, balanceObol: 500 },
      holdings,
      tick: 6,
    });

    expect(result.orders[0]).toMatchObject({
      status: "filled",
      filledAtTick: 6,
    });
    expect(result.fills[0]).toMatchObject({
      side: "SELL",
      quantity: 8,
      executionPrice: 94,
      realizedPnl: 32,
      faction: "BLACKWAKE",
    });
    expect(result.holdings.PGAS).toEqual({
      ticker: "PGAS",
      quantity: 2,
      avgEntry: 90,
    });
    expect(result.resources.balanceObol).toBe(1_252);
  });

  it("cancels explicit orders and impossible sell orders", () => {
    const explicit = createLimitOrder({
      playerId: "local-agent",
      ticker: "GLCH",
      side: "BUY",
      quantity: 5,
      limitPrice: 90,
      createdAtTick: 1,
    });
    const cancelled = cancelLimitOrder(explicit, 2, "route changed");

    expect(cancelled).toMatchObject({
      status: "cancelled",
      cancelledAtTick: 2,
      cancelReason: "route changed",
    });
    expect(resolveLimitOrders({
      orders: [cancelled],
      prices: { ...createInitialPrices(), GLCH: 80 },
      resources: { ...INITIAL_RESOURCES },
      holdings: {},
      tick: 3,
    }).fills).toHaveLength(0);

    const impossibleSell = createLimitOrder({
      playerId: "local-agent",
      ticker: "AETH",
      side: "SELL",
      quantity: 3,
      limitPrice: 40,
      createdAtTick: 1,
    });
    const result = resolveLimitOrders({
      orders: [impossibleSell],
      prices: { ...createInitialPrices(), AETH: 50 },
      resources: { ...INITIAL_RESOURCES },
      holdings: {},
      tick: 2,
    });

    expect(result.orders[0]).toMatchObject({
      status: "cancelled",
      cancelReason: "cancelled: missing holding",
    });
    expect(result.fills).toHaveLength(0);
    expect(result.holdings.AETH).toBeUndefined();
  });

  it("expires stale open orders", () => {
    const order = createLimitOrder({
      playerId: "local-agent",
      ticker: "SNPS",
      side: "BUY",
      quantity: 6,
      limitPrice: 82,
      createdAtTick: 10,
      expiresAtTick: 12,
    });

    const result = resolveLimitOrders({
      orders: [order],
      prices: { ...createInitialPrices(), SNPS: 81 },
      resources: { ...INITIAL_RESOURCES },
      holdings: {},
      tick: 13,
    });

    expect(result.orders[0]).toMatchObject({
      status: "expired",
      cancelledAtTick: 13,
      cancelReason: "expired",
    });
    expect(result.fills).toHaveLength(0);
  });

  it("applies deterministic faction pressure without impossible prices", () => {
    const prices = createInitialPrices();
    const pressure = createFactionMarketPressure({
      faction: "NULL_CROWN",
      tick: 8,
      reputation: 55,
    });

    const first = applyFactionMarketPressure({
      prices,
      pressure,
      tick: 8,
    });
    const second = applyFactionMarketPressure({
      prices,
      pressure,
      tick: 8,
    });

    expect(first).toEqual(second);
    expect(JSON.parse(JSON.stringify(pressure))).toEqual(pressure);
    expect(first.prices.GLCH!).toBeGreaterThan(prices.GLCH!);
    expect(first.prices.AETH!).toBeGreaterThan(prices.AETH!);
    expect(first.prices.VBLM).toBe(prices.VBLM);
    expect(Object.values(first.prices).every((price) => Number.isFinite(price) && price >= 1)).toBe(true);
    expect(first.heatDelta).toBe(2);
  });

  it("lets faction pressure trigger a deterministic sell order", () => {
    const prices = createInitialPrices();
    const pressure = createFactionMarketPressure({
      faction: "BLACKWAKE",
      tick: 4,
      reputation: 100,
    });
    const pressured = applyFactionMarketPressure({
      prices,
      pressure,
      tick: 4,
    });
    const holding: DemoHolding = {
      ticker: "PGAS",
      quantity: 12,
      avgEntry: 90,
    };
    const limitPrice = roundCurrency(prices.PGAS! * 1.005);
    const order = createLimitOrder({
      playerId: "local-agent",
      ticker: "PGAS",
      side: "SELL",
      quantity: 12,
      limitPrice,
      createdAtTick: 4,
      faction: "BLACKWAKE",
    });

    expect(pressured.prices.PGAS!).toBeGreaterThanOrEqual(limitPrice);

    const result = resolveLimitOrders({
      orders: [order],
      prices: pressured.prices,
      resources: { ...INITIAL_RESOURCES },
      holdings: { PGAS: holding },
      tick: 5,
    });

    expect(result.orders[0]!.status).toBe("filled");
    expect(result.fills[0]!.executionPrice).toBe(pressured.prices.PGAS!);
    expect(result.fills[0]!.realizedPnl).toBeGreaterThan(0);
    expect(result.holdings.PGAS).toBeUndefined();
  });
});
