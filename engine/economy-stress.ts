import { INITIAL_RESOURCES } from "@/engine/demo-market";
import {
  makeEconomyReplaySeeds,
  runEconomyReplay,
  type EconomyReplaySummary,
} from "@/engine/economy-replay";

export const ECONOMY_STRESS_SEED_COUNT = 200;
export const ECONOMY_STRESS_TICKS = 60;

export interface EconomyStressScenario {
  id: string;
  label: string;
  startingResources: { balanceObol: number; energySeconds: number; heat: number };
  /** Minimum fraction of sessions that must have at least one trade. */
  minTradeSessionFraction: number;
}

export interface EconomyStressResult {
  scenario: EconomyStressScenario;
  summary: EconomyReplaySummary;
  impossibleStates: number;
  softLocks: number;
  negativeBalanceSessions: number;
  tradeSessionCount: number;
  passed: boolean;
  failReasons: string[];
}

export const ECONOMY_STRESS_SCENARIOS: readonly EconomyStressScenario[] = [
  {
    id: "low-balance-floor",
    label: "Low 0BOL floor entry (500 0BOL)",
    startingResources: {
      balanceObol: 500,
      energySeconds: INITIAL_RESOURCES.energySeconds,
      heat: INITIAL_RESOURCES.heat,
    },
    minTradeSessionFraction: 0,
  },
  {
    id: "high-heat-entry",
    label: "High heat entry (Heat=75, Priority Target zone)",
    startingResources: {
      balanceObol: INITIAL_RESOURCES.balanceObol,
      energySeconds: INITIAL_RESOURCES.energySeconds,
      heat: 75,
    },
    minTradeSessionFraction: 0.5,
  },
  {
    id: "energy-depleted",
    label: "Energy-depleted entry (300 seconds remaining)",
    startingResources: {
      balanceObol: INITIAL_RESOURCES.balanceObol,
      energySeconds: 300,
      heat: INITIAL_RESOURCES.heat,
    },
    minTradeSessionFraction: 0,
  },
  {
    id: "near-heat-ceiling",
    label: "Near heat ceiling entry (Heat=88)",
    startingResources: {
      balanceObol: INITIAL_RESOURCES.balanceObol,
      energySeconds: INITIAL_RESOURCES.energySeconds,
      heat: 88,
    },
    minTradeSessionFraction: 0,
  },
];

export function runEconomyStress(input?: {
  scenarios?: readonly EconomyStressScenario[];
  seedCount?: number;
  ticks?: number;
}): EconomyStressResult[] {
  const scenarios = input?.scenarios ?? ECONOMY_STRESS_SCENARIOS;
  const seedCount = input?.seedCount ?? ECONOMY_STRESS_SEED_COUNT;
  const ticks = input?.ticks ?? ECONOMY_STRESS_TICKS;

  return scenarios.map((scenario) => {
    const seeds = makeEconomyReplaySeeds(seedCount, `oracle-p0-003-${scenario.id}`);
    const summary = runEconomyReplay({
      seeds,
      ticks,
      startingResources: scenario.startingResources,
    });

    const negativeBalanceSessions = summary.sessions.filter(
      (s) => s.finalBalanceObol < 0,
    ).length;
    const tradeSessionCount = summary.sessions.filter((s) => s.trades > 0).length;
    const tradeSessionFraction = tradeSessionCount / summary.sessionCount;

    const failReasons: string[] = [];
    if (summary.issueCounts.impossible_state > 0) {
      failReasons.push(
        `${summary.issueCounts.impossible_state} impossible_state issues`,
      );
    }
    if (negativeBalanceSessions > 0) {
      failReasons.push(`${negativeBalanceSessions} sessions ended with negative balance`);
    }
    if (tradeSessionFraction < scenario.minTradeSessionFraction) {
      failReasons.push(
        `Only ${(tradeSessionFraction * 100).toFixed(1)}% of sessions had trades; expected at least ${(scenario.minTradeSessionFraction * 100).toFixed(0)}%`,
      );
    }

    return {
      scenario,
      summary,
      impossibleStates: summary.issueCounts.impossible_state,
      softLocks: summary.issueCounts.soft_lock,
      negativeBalanceSessions,
      tradeSessionCount,
      passed: failReasons.length === 0,
      failReasons,
    };
  });
}

export function formatEconomyStressReport(results: EconomyStressResult[]): string {
  const lines: string[] = [];
  for (const result of results) {
    const status = result.passed ? "PASS" : "FAIL";
    const s = result.summary;
    lines.push(
      `${status} [${result.scenario.id}] "${result.scenario.label}"`,
    );
    lines.push(
      `  sessions=${s.sessionCount} softLocks=${result.softLocks} impossibleStates=${result.impossibleStates} negativeBalance=${result.negativeBalanceSessions} tradeSessions=${result.tradeSessionCount}`,
    );
    lines.push(
      `  medianPnl=${s.medians.realizedPnl.toFixed(2)} medianMaxHeat=${s.medians.maxHeat} medianTrades=${s.medians.trades}`,
    );
    if (!result.passed) {
      for (const reason of result.failReasons) {
        lines.push(`  FAIL: ${reason}`);
      }
    }
  }
  return lines.join("\n");
}
