import { getInventorySlots, getRankByXP, getRankSnapshot, getTradeXp } from "../rank";

describe("rank progression", () => {
  it("uses the requested early rank table", () => {
    expect(getRankByXP(0)).toMatchObject({ level: 1, title: "Boot Ghost", inventorySlots: 5 });
    expect(getRankByXP(200)).toMatchObject({ level: 2, title: "Packet Rat", inventorySlots: 6 });
    expect(getRankByXP(2000)).toMatchObject({ level: 5, title: "Node Thief", inventorySlots: 10 });
    expect(getInventorySlots(5)).toBe(10);
  });

  it("returns a complete rank snapshot", () => {
    expect(getRankSnapshot(550)).toMatchObject({
      level: 3,
      title: "Signal Runner",
      xp: 550,
      inventorySlots: 7,
      nextXpRequired: 1000,
    });
  });

  it("calculates trade XP from realized PnL", () => {
    expect(getTradeXp({ realizedPnl: 1500, isFirstProfitableTradeToday: true })).toBe(101);
    expect(getTradeXp({ realizedPnl: 0, isFirstProfitableTradeToday: false })).toBe(10);
    expect(getTradeXp({ realizedPnl: -20, isFirstProfitableTradeToday: false })).toBe(5);
  });
});
