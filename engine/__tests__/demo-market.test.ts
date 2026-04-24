import {
  INITIAL_RESOURCES,
  applyMarketClockPulse,
  advancePrices,
  buyCommodity,
  canExecuteTrade,
  createInitialPrices,
  getTradeEnergyCost,
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

  it("blocks trades when heat or energy would break the run", () => {
    expect(getTradeEnergyCost("BUY", 25)).toBe(225);
    expect(
      canExecuteTrade({
        ticker: "BLCK",
        side: "BUY",
        quantity: 25,
        resources: { energySeconds: 10, heat: 6, stealth: 0 },
      }),
    ).toEqual({ ok: false, reason: "Dormant mode: buy energy before trading." });
    expect(
      canExecuteTrade({
        ticker: "BLCK",
        side: "BUY",
        quantity: 25,
        resources: { energySeconds: 5000, heat: 98, stealth: 0 },
      }),
    ).toEqual({ ok: false, reason: "Heat ceiling reached. Wait or cool down first." });
  });

  it("applies passive deck clock pressure deterministically", () => {
    const pulse = applyMarketClockPulse(
      { energySeconds: 3000, heat: 10, integrity: 82, stealth: 64, influence: 3 },
      3,
    );

    expect(pulse.energySeconds).toBe(3030);
    expect(pulse.heat).toBe(8);
    expect(pulse.integrity).toBe(82);
  });
});
