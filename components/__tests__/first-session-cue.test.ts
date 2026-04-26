import { getFirstSessionCueCopy } from "@/components/first-session-cue";
import type { Position } from "@/engine/types";

function position(input: Partial<Position> = {}): Position {
  return {
    id: "position-1",
    ticker: "VBLM",
    quantity: 10,
    avgEntry: 24,
    realizedPnl: 0,
    unrealizedPnl: 0,
    openedAt: "2077-04-01T00:00:00.000Z",
    closedAt: null,
    ...input,
  };
}

describe("first-session cue copy", () => {
  it("starts by routing the player from home into S1LKROAD", () => {
    expect(
      getFirstSessionCueCopy({
        surface: "home",
        positions: {},
        firstTradeComplete: false,
        selectedTicker: "VBLM",
      }),
    ).toMatchObject({
      step: "01",
      title: "ENTER S1LKROAD",
      tone: "cyan",
    });
  });

  it("tells the player to buy the selected starter ticker in terminal", () => {
    expect(
      getFirstSessionCueCopy({
        surface: "terminal",
        positions: {},
        firstTradeComplete: false,
        selectedTicker: "VBLM",
      }),
    ).toMatchObject({
      step: "02",
      title: "BUY THE STARTER SIGNAL",
      lines: expect.arrayContaining(["[NEXT] execute buy"]),
    });
  });

  it("waits when the open starter position is not profitable yet", () => {
    expect(
      getFirstSessionCueCopy({
        surface: "terminal",
        positions: { VBLM: position({ unrealizedPnl: -2 }) },
        firstTradeComplete: false,
        selectedTicker: "VBLM",
      }),
    ).toMatchObject({
      step: "03",
      title: "WAIT FOR GREEN TAPE",
      tone: "amber",
      lines: expect.arrayContaining(["[NEXT] wait tick"]),
    });
  });

  it("switches to sell guidance once the open starter position is profitable", () => {
    expect(
      getFirstSessionCueCopy({
        surface: "terminal",
        positions: { VBLM: position({ unrealizedPnl: 12.5 }) },
        firstTradeComplete: false,
        selectedTicker: "VBLM",
      }),
    ).toMatchObject({
      step: "03",
      title: "SELL THE GREEN TAPE",
      tone: "green",
      lines: expect.arrayContaining(["[NEXT] sell position"]),
    });
  });

  it("moves out of tutorial mode after the first profitable sell", () => {
    expect(
      getFirstSessionCueCopy({
        surface: "home",
        positions: {},
        firstTradeComplete: true,
        selectedTicker: "VBLM",
      }),
    ).toMatchObject({
      step: "04",
      title: "FIRST PROFIT BANKED",
      tone: "green",
    });
  });
});
