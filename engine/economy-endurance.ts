import { roundCurrency } from "@/engine/demo-market";
import {
  makeEconomyReplaySeeds,
  runEconomyReplay,
  type EconomyReplaySummary,
} from "@/engine/economy-replay";

export const ECONOMY_ENDURANCE_SESSION_COUNT = 1000;
export const ECONOMY_ENDURANCE_TICKS = 300;

export interface EconomyEnduranceQuartiles {
  p25: number;
  p50: number;
  p75: number;
}

export interface EconomyEnduranceSummary {
  replay: EconomyReplaySummary;
  balanceQuartiles: EconomyEnduranceQuartiles;
  pnlQuartiles: EconomyEnduranceQuartiles;
  noTradeSessions: number;
  negativeBalanceSessions: number;
  profitableSessionCount: number;
  passed: boolean;
  failReasons: string[];
}

const MIN_PROFITABLE_SESSION_FRACTION = 0.9;

export function runEconomyEndurance(input?: {
  sessionCount?: number;
  ticks?: number;
}): EconomyEnduranceSummary {
  const sessionCount = input?.sessionCount ?? ECONOMY_ENDURANCE_SESSION_COUNT;
  const ticks = input?.ticks ?? ECONOMY_ENDURANCE_TICKS;
  const seeds = makeEconomyReplaySeeds(sessionCount, "oracle-p0-004");
  const replay = runEconomyReplay({ seeds, ticks });

  const balances = replay.sessions.map((s) => s.finalBalanceObol).sort((a, b) => a - b);
  const pnls = replay.sessions.map((s) => s.realizedPnl).sort((a, b) => a - b);

  const noTradeSessions = replay.sessions.filter((s) => s.trades === 0).length;
  const negativeBalanceSessions = replay.sessions.filter((s) => s.finalBalanceObol < 0).length;
  const profitableSessionCount = replay.sessions.filter((s) => s.profitableTrades > 0).length;

  const failReasons: string[] = [];

  if (replay.issueCounts.impossible_state > 0) {
    failReasons.push(`${replay.issueCounts.impossible_state} impossible_state issue(s)`);
  }

  if (negativeBalanceSessions > 0) {
    failReasons.push(`${negativeBalanceSessions} sessions ended with negative balance`);
  }

  const profitableFraction = profitableSessionCount / sessionCount;
  if (profitableFraction < MIN_PROFITABLE_SESSION_FRACTION) {
    failReasons.push(
      `Only ${(profitableFraction * 100).toFixed(1)}% profitable sessions; expected >= ${(MIN_PROFITABLE_SESSION_FRACTION * 100).toFixed(0)}%`,
    );
  }

  return {
    replay,
    balanceQuartiles: {
      p25: quartile(balances, 0.25),
      p50: quartile(balances, 0.5),
      p75: quartile(balances, 0.75),
    },
    pnlQuartiles: {
      p25: quartile(pnls, 0.25),
      p50: quartile(pnls, 0.5),
      p75: quartile(pnls, 0.75),
    },
    noTradeSessions,
    negativeBalanceSessions,
    profitableSessionCount,
    passed: failReasons.length === 0,
    failReasons,
  };
}

export function formatEconomyEnduranceReport(summary: EconomyEnduranceSummary): string {
  const r = summary.replay;
  const lines = [
    `ENDURANCE REPLAY sessions=${r.sessionCount} ticks=${r.ticksPerSession}`,
    `impossibleStates=${r.issueCounts.impossible_state} softLocks=${r.issueCounts.soft_lock}`,
    `profitableSessions=${summary.profitableSessionCount}/${r.sessionCount} negativeBalance=${summary.negativeBalanceSessions} noTrade=${summary.noTradeSessions}`,
    `balanceP25=${summary.balanceQuartiles.p25.toFixed(2)} balanceP50=${summary.balanceQuartiles.p50.toFixed(2)} balanceP75=${summary.balanceQuartiles.p75.toFixed(2)}`,
    `pnlP25=${summary.pnlQuartiles.p25.toFixed(2)} pnlP50=${summary.pnlQuartiles.p50.toFixed(2)} pnlP75=${summary.pnlQuartiles.p75.toFixed(2)}`,
    `medianMaxHeat=${r.medians.maxHeat} medianTrades=${r.medians.trades} raidSessions=${r.raidSessionCount}`,
    summary.passed ? "STATUS: PASS" : `STATUS: FAIL — ${summary.failReasons.join("; ")}`,
  ];
  return lines.join("\n");
}

function quartile(sorted: number[], q: number): number {
  if (!sorted.length) {
    return 0;
  }
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  const baseVal = sorted[base] ?? 0;
  const nextVal = sorted[base + 1] ?? baseVal;
  return roundCurrency(baseVal + rest * (nextVal - baseVal));
}
