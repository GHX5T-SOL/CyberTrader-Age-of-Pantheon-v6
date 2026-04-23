import {
  INITIAL_RESOURCES,
  advancePrices,
  buyCommodity,
  createInitialPrices,
  sellCommodity,
} from "../demo-market";

describe("demo market loop", () => {
  it("creates deterministic price maps for the same tick", () => {
    const initial = createInitialPrices();
    const a = advancePrices(initial, 1);
    const b = advancePrices(initial, 1);

    expect(a).toEqual(b);
  });

  it("buying a commodity updates resources and holding", () => {
    const result = buyCommodity({
      ticker: "VBLM",
      quantity: 10,
      price: 24,
      resources: INITIAL_RESOURCES,
    });

    expect(result.resources.balanceObol).toBe(999760);
    expect(result.resources.energySeconds).toBe(INITIAL_RESOURCES.energySeconds - 90);
    expect(result.resources.heat).toBe(INITIAL_RESOURCES.heat + 1);
    expect(result.holding.quantity).toBe(10);
    expect(result.holding.avgEntry).toBe(24);
  });

  it("selling a holding realizes pnl and restores balance", () => {
    const bought = buyCommodity({
      ticker: "VBLM",
      quantity: 10,
      price: 24,
      resources: INITIAL_RESOURCES,
    });

    const sold = sellCommodity({
      ticker: "VBLM",
      price: 27,
      resources: bought.resources,
      holding: bought.holding,
    });

    expect(sold.realizedPnl).toBe(30);
    expect(sold.resources.balanceObol).toBe(1_000_030);
  });
});
