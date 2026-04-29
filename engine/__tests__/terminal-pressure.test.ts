import {
  applyTerminalFactionPressureToPrices,
  buildTerminalPressureCommand,
  getFactionReputationForPressure,
  getTerminalPressureWindow,
} from "../terminal-pressure";

describe("oracle-p1-011 terminal pressure command flow", () => {
  it("derives faction pressure reputation from aligned contacts", () => {
    expect(getFactionReputationForPressure({
      faction: "BLACKWAKE",
      npcReputation: { kite: 53, librarian: 99 },
    })).toBe(53);
  });

  it("creates deterministic 8-tick pressure windows for bound factions", () => {
    const window = getTerminalPressureWindow({
      faction: "BLACKWAKE",
      npcReputation: { kite: 52 },
      tick: 19,
    });

    expect(window).toMatchObject({
      faction: "BLACKWAKE",
      factionName: "Blackwake",
      reputation: 52,
      standingTier: "favored",
      startedAtTick: 16,
      expiresAtTick: 24,
      heatDelta: 3,
    });
    expect(window?.pressures.some((pressure) => pressure.ticker === "PGAS" && pressure.direction === "support")).toBe(true);
  });

  it("applies active pressure to prices without mutating the input map", () => {
    const prices = { PGAS: 91, VBLM: 24 };
    const result = applyTerminalFactionPressureToPrices({
      prices,
      faction: "BLACKWAKE",
      npcReputation: { kite: 52 },
      tick: 16,
    });

    expect(prices.PGAS).toBe(91);
    expect(result.prices.PGAS).toBeGreaterThan(91);
    expect(result.changes.PGAS).toBeGreaterThan(0);
    expect(result.window?.startedAtTick).toBe(16);
  });

  it("builds a selected ticker pressure strip and limit-trigger preview", () => {
    const command = buildTerminalPressureCommand({
      faction: "BLACKWAKE",
      npcReputation: { kite: 52 },
      selectedTicker: "PGAS",
      side: "SELL",
      price: 92,
      orderSize: 15,
      tick: 18,
      heat: 66,
    });

    expect(command).toMatchObject({
      factionName: "Blackwake",
      selectedTicker: "PGAS",
      ticker: "PGAS",
      selectedTickerAffected: true,
      direction: "support",
      ticksRemaining: 6,
      riskTone: "safe",
      triggerLabel: "SELL LIMIT >= 92.55 0BOL",
      triggerDetail: "PREVIEW // x15 // 6T WINDOW",
    });
  });

  it("returns null when AgentOS faction pressure is not bound", () => {
    expect(buildTerminalPressureCommand({
      faction: null,
      npcReputation: {},
      selectedTicker: "VBLM",
      side: "BUY",
      price: 24,
      orderSize: 15,
      tick: 0,
      heat: 6,
    })).toBeNull();
  });
});
