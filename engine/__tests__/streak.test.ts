import { applySellToStreak, createInitialStreak, expireStreakIfNeeded, getStreakMultiplier } from "../streak";

describe("trade streaks", () => {
  it("increments profitable sell streaks and applies multipliers", () => {
    let streak = createInitialStreak();
    streak = applySellToStreak({ streak, realizedPnl: 100, nowMs: 0 });
    streak = applySellToStreak({ streak, realizedPnl: 200, nowMs: 1000 });
    streak = applySellToStreak({ streak, realizedPnl: 300, nowMs: 2000 });

    expect(streak.count).toBe(3);
    expect(streak.multiplier).toBe(1.05);
    expect(getStreakMultiplier(10)).toBe(1.15);
  });

  it("breaks on loss and expires after thirty minutes", () => {
    const streak = applySellToStreak({
      streak: createInitialStreak(),
      realizedPnl: 100,
      nowMs: 0,
    });

    expect(applySellToStreak({ streak, realizedPnl: -1, nowMs: 100 }).count).toBe(0);
    expect(expireStreakIfNeeded(streak, 31 * 60_000).count).toBe(0);
  });
});
