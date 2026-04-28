import {
  HIGH_HEAT_STRATEGY_THRESHOLD,
  STARTER_GUIDANCE_QUANTITY,
  getLiveStrategyHint,
  getTickerStrategyLane,
} from "@/engine/strategy-guidance";

describe("strategy guidance", () => {
  it("maps launch tickers to player-facing strategy lanes", () => {
    expect(getTickerStrategyLane("VBLM")).toBe("starter");
    expect(getTickerStrategyLane("PGAS")).toBe("momentum");
    expect(getTickerStrategyLane("MTRX")).toBe("safe-cycle");
    expect(getTickerStrategyLane("BLCK")).toBe("contraband");
    expect(getTickerStrategyLane("GLCH")).toBe("wildcard");
  });

  it("keeps the first route on the tuned VBLM quantity", () => {
    const hint = getLiveStrategyHint({
      selectedTicker: "VBLM",
      firstTradeComplete: false,
      heat: 6,
      hasOpenPosition: false,
    });

    expect(hint.title).toBe("VBLM X15 STARTER ROUTE");
    expect(hint.lines).toContain(`[TUNED] VBLM x${STARTER_GUIDANCE_QUANTITY}`);
  });

  it("redirects first-session detours back to VBLM", () => {
    const hint = getLiveStrategyHint({
      selectedTicker: "PGAS",
      firstTradeComplete: false,
      heat: 6,
      hasOpenPosition: false,
    });

    expect(hint.title).toBe("SWITCH TO VBLM STARTER");
    expect(hint.lines).toContain("[NEXT] select VBLM");
  });

  it("surfaces the post-profit momentum upgrade lane", () => {
    const hint = getLiveStrategyHint({
      selectedTicker: "ORRS",
      firstTradeComplete: true,
      heat: 22,
      hasOpenPosition: false,
    });

    expect(hint.title).toBe("MOMENTUM UPGRADE LANE");
    expect(hint.lines).toContain("[UPGRADE] PGAS ORRS SNPS");
  });

  it("blocks scaling guidance when heat reaches the stop line", () => {
    const hint = getLiveStrategyHint({
      selectedTicker: "BLCK",
      firstTradeComplete: true,
      heat: HIGH_HEAT_STRATEGY_THRESHOLD,
      hasOpenPosition: false,
    });

    expect(hint.title).toBe("COOL HEAT BEFORE SCALING");
    expect(hint.lines).toContain("[HALT] contraband lane");
  });
});
