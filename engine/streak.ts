import type { TradeStreak } from "@/engine/types";

export const STREAK_WINDOW_MS = 30 * 60_000;

export function createInitialStreak(): TradeStreak {
  return {
    count: 0,
    multiplier: 1,
    lastProfitableTradeAt: null,
    expiresAt: null,
    record: 0,
  };
}

export function getStreakMultiplier(count: number): number {
  if (count >= 15) {
    return 1.2;
  }
  if (count >= 10) {
    return 1.15;
  }
  if (count >= 7) {
    return 1.12;
  }
  if (count >= 5) {
    return 1.08;
  }
  if (count >= 3) {
    return 1.05;
  }
  if (count >= 2) {
    return 1.03;
  }
  return 1;
}

export function getStreakTitle(count: number): TradeStreak["unlockedTitle"] {
  if (count >= 15) {
    return "Oracle";
  }
  if (count >= 10) {
    return "Prophet";
  }
  if (count >= 5) {
    return "Hot Hand";
  }
  return undefined;
}

export function applySellToStreak(input: {
  streak: TradeStreak;
  realizedPnl: number;
  nowMs: number;
}): TradeStreak {
  if (input.realizedPnl < 0) {
    return {
      ...createInitialStreak(),
      record: Math.max(input.streak.record, input.streak.count),
    };
  }

  if (input.realizedPnl === 0) {
    return expireStreakIfNeeded(input.streak, input.nowMs);
  }

  const current = expireStreakIfNeeded(input.streak, input.nowMs);
  const count = current.count + 1;
  return {
    count,
    multiplier: getStreakMultiplier(count),
    lastProfitableTradeAt: input.nowMs,
    expiresAt: input.nowMs + STREAK_WINDOW_MS,
    record: Math.max(current.record, count),
    unlockedTitle: getStreakTitle(count),
  };
}

export function expireStreakIfNeeded(streak: TradeStreak, nowMs: number): TradeStreak {
  if (streak.expiresAt && nowMs >= streak.expiresAt) {
    return {
      ...createInitialStreak(),
      record: Math.max(streak.record, streak.count),
    };
  }

  const multiplier = getStreakMultiplier(streak.count);
  const unlockedTitle = getStreakTitle(streak.count);
  return multiplier === streak.multiplier && unlockedTitle === streak.unlockedTitle
    ? streak
    : { ...streak, multiplier, unlockedTitle };
}
