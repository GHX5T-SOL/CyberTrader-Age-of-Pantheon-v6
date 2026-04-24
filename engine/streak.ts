import type { TradeStreak } from "@/engine/types";

export const STREAK_WINDOW_MS = 30 * 60_000;

export function createInitialStreak(): TradeStreak {
  return {
    count: 0,
    multiplier: 1,
    lastProfitableTradeAt: null,
    expiresAt: null,
  };
}

export function getStreakMultiplier(count: number): number {
  if (count >= 10) {
    return 2;
  }
  if (count >= 5) {
    return 1.5;
  }
  if (count >= 3) {
    return 1.2;
  }
  if (count >= 2) {
    return 1.1;
  }
  return 1;
}

export function applySellToStreak(input: {
  streak: TradeStreak;
  realizedPnl: number;
  nowMs: number;
}): TradeStreak {
  if (input.realizedPnl < 0) {
    return createInitialStreak();
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
  };
}

export function expireStreakIfNeeded(streak: TradeStreak, nowMs: number): TradeStreak {
  if (streak.expiresAt && nowMs >= streak.expiresAt) {
    return createInitialStreak();
  }

  const multiplier = getStreakMultiplier(streak.count);
  return multiplier === streak.multiplier ? streak : { ...streak, multiplier };
}
