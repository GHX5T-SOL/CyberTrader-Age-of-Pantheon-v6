import { getOperatorBriefCopy } from "@/components/operator-brief";
import { HIGH_HEAT_STRATEGY_THRESHOLD } from "@/engine/strategy-guidance";
import type { Position } from "@/engine/types";

function position(input: Partial<Position> = {}): Position {
  return {
    id: "position-1",
    ticker: "VBLM",
    quantity: 15,
    avgEntry: 24,
    realizedPnl: 0,
    unrealizedPnl: 0,
    openedAt: "2077-04-01T00:00:00.000Z",
    closedAt: null,
    ...input,
  };
}

describe("operator retention brief copy", () => {
  it("points home players to the terminal with the starter script visible", () => {
    const copy = getOperatorBriefCopy({
      surface: "home",
      positions: {},
      firstTradeComplete: false,
      selectedTicker: "VBLM",
      heat: 6,
    });

    expect(copy.nextAction).toMatchObject({
      kind: "enter-terminal",
      label: "[ ENTER S1LKROAD 4.0 ]",
      ticker: "VBLM",
    });
    expect(copy.progressLabel).toBe("0/1 FIRST PROFIT");
    expect(copy.lines).toContain("starter script is VBLM x15");
  });

  it("turns the terminal brief into a starter buy command", () => {
    const copy = getOperatorBriefCopy({
      surface: "terminal",
      positions: {},
      firstTradeComplete: false,
      selectedTicker: "VBLM",
      heat: 6,
    });

    expect(copy.nextAction).toMatchObject({
      kind: "buy-starter",
      label: "[ EXECUTE VBLM BUY ]",
      ticker: "VBLM",
    });
    expect(copy.signal).toBe("NOMINAL");
  });

  it("keeps first-session detours focused on the VBLM starter lane", () => {
    const copy = getOperatorBriefCopy({
      surface: "terminal",
      positions: {},
      firstTradeComplete: false,
      selectedTicker: "PGAS",
      heat: 8,
    });

    expect(copy.nextAction).toMatchObject({
      kind: "select-starter",
      label: "[ SELECT VBLM ]",
      ticker: "VBLM",
    });
    expect(copy.lines).toContain("PGAS can wait");
  });

  it("uses wait and sell actions to reduce repeated close-loop fatigue", () => {
    const waiting = getOperatorBriefCopy({
      surface: "terminal",
      positions: { VBLM: position({ unrealizedPnl: -1.25 }) },
      firstTradeComplete: false,
      selectedTicker: "VBLM",
      heat: 12,
    });
    const green = getOperatorBriefCopy({
      surface: "terminal",
      positions: { VBLM: position({ unrealizedPnl: 9.5 }) },
      firstTradeComplete: false,
      selectedTicker: "VBLM",
      heat: 12,
    });

    expect(waiting.nextAction.kind).toBe("wait-tick");
    expect(waiting.nextAction.label).toBe("[ WAIT MARKET TICK ]");
    expect(green.nextAction.kind).toBe("sell-green");
    expect(green.nextAction.label).toBe("[ SELL VBLM GREEN ]");
  });

  it("turns high Heat into a cooling action after first profit", () => {
    const copy = getOperatorBriefCopy({
      surface: "terminal",
      positions: {},
      firstTradeComplete: true,
      selectedTicker: "BLCK",
      heat: HIGH_HEAT_STRATEGY_THRESHOLD,
    });

    expect(copy.nextAction.kind).toBe("cool-heat");
    expect(copy.signal).toBe("WATCH");
    expect(copy.heatLabel).toBe("STOP LINE");
    expect(copy.lines).toContain("contraband stop line reached");
  });

  it("keeps the post-profit state pointed at an upgrade lane when Heat is calm", () => {
    const copy = getOperatorBriefCopy({
      surface: "home",
      positions: {},
      firstTradeComplete: true,
      selectedTicker: "VBLM",
      heat: 18,
    });

    expect(copy.nextAction.kind).toBe("upgrade-lane");
    expect(copy.progressLabel).toBe("1/1 FIRST PROFIT BANKED");
    expect(copy.lines).toContain("upgrade: PGAS/ORRS/SNPS");
  });
});

