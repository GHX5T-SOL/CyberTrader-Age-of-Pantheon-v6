import {
  formatEconomyReplaySummary,
  runEconomyReplay,
  type EconomyReplaySummary,
} from "@/engine/economy-replay";
import {
  runDemoPressureAudit,
  type DemoPressureOutcome,
  type DemoPressureStrategyId,
} from "@/engine/demo-pressure";

export const ORACLE_LAUNCH_TUNING_TARGETS = {
  replaySessions: 1000,
  ticksPerSession: 60,
  maxSoftLocks: 0,
  maxImpossibleStates: 0,
  minProfitableSessions: 980,
  medianPnlMin: 25,
  medianPnlMax: 100,
  medianMaxHeatMin: 45,
  medianMaxHeatMax: 70,
  medianFirstProfitTickMax: 6,
  raidSessionMin: 50,
  raidSessionMax: 160,
  minViableStrategies: 3,
  starterMaxHeat: 29,
  routeRunnerMinHeat: 30,
  routeRunnerMaxHeat: 69,
  contrabandMinHeat: 70,
  heatCeilingExclusive: 100,
  highRiskRewardMultiplier: 2,
} as const;

export interface LaunchTuningAudit {
  replay: EconomyReplaySummary;
  pressure: DemoPressureOutcome[];
  issues: string[];
}

export function runLaunchTuningAudit(): LaunchTuningAudit {
  const replay = runEconomyReplay({
    ticks: ORACLE_LAUNCH_TUNING_TARGETS.ticksPerSession,
  });
  const pressure = runDemoPressureAudit({
    ticks: ORACLE_LAUNCH_TUNING_TARGETS.ticksPerSession,
  });
  const issues = [
    ...collectReplayIssues(replay),
    ...collectPressureIssues(pressure),
  ];

  return { replay, pressure, issues };
}

export function formatLaunchTuningAudit(audit: LaunchTuningAudit): string {
  const pressureLines = audit.pressure.map((outcome) =>
    [
      outcome.strategyId,
      `pnl=${outcome.realizedPnl.toFixed(2)}`,
      `trades=${outcome.trades}`,
      `profitable=${outcome.profitableTrades}`,
      `maxHeat=${outcome.maxHeat}`,
      `firstProfitTick=${outcome.firstProfitableSellTick ?? "none"}`,
      `issues=${outcome.issues.length}`,
    ].join(" "),
  );

  return [
    formatEconomyReplaySummary(audit.replay),
    ...pressureLines,
    `launchTuningIssues=${audit.issues.length}`,
  ].join("\n");
}

function collectReplayIssues(replay: EconomyReplaySummary): string[] {
  const targets = ORACLE_LAUNCH_TUNING_TARGETS;
  const issues: string[] = [];

  if (replay.sessionCount !== targets.replaySessions) {
    issues.push(`replay_session_count:${replay.sessionCount}`);
  }
  if (replay.ticksPerSession !== targets.ticksPerSession) {
    issues.push(`replay_tick_count:${replay.ticksPerSession}`);
  }
  if (replay.issueCounts.soft_lock > targets.maxSoftLocks) {
    issues.push(`soft_locks:${replay.issueCounts.soft_lock}`);
  }
  if (replay.issueCounts.impossible_state > targets.maxImpossibleStates) {
    issues.push(`impossible_states:${replay.issueCounts.impossible_state}`);
  }
  if (replay.profitableSessionCount < targets.minProfitableSessions) {
    issues.push(`profitable_sessions:${replay.profitableSessionCount}`);
  }
  if (
    replay.medians.realizedPnl < targets.medianPnlMin ||
    replay.medians.realizedPnl > targets.medianPnlMax
  ) {
    issues.push(`median_pnl:${replay.medians.realizedPnl}`);
  }
  if (
    replay.medians.maxHeat < targets.medianMaxHeatMin ||
    replay.medians.maxHeat > targets.medianMaxHeatMax
  ) {
    issues.push(`median_max_heat:${replay.medians.maxHeat}`);
  }
  if (
    replay.medians.firstProfitableSellTick === null ||
    replay.medians.firstProfitableSellTick > targets.medianFirstProfitTickMax
  ) {
    issues.push(`median_first_profit_tick:${replay.medians.firstProfitableSellTick ?? "none"}`);
  }
  if (
    replay.raidSessionCount < targets.raidSessionMin ||
    replay.raidSessionCount > targets.raidSessionMax
  ) {
    issues.push(`raid_sessions:${replay.raidSessionCount}`);
  }

  return issues;
}

function collectPressureIssues(pressure: DemoPressureOutcome[]): string[] {
  const targets = ORACLE_LAUNCH_TUNING_TARGETS;
  const issues: string[] = [];
  const starter = getPressureOutcome(pressure, "starter-stabilizer");
  const routeRunner = getPressureOutcome(pressure, "route-runner");
  const contraband = getPressureOutcome(pressure, "contraband-sprint");

  if (pressure.length < targets.minViableStrategies) {
    issues.push(`strategy_count:${pressure.length}`);
  }

  for (const outcome of pressure) {
    if (outcome.issues.length > 0) {
      issues.push(`${outcome.strategyId}_issues:${outcome.issues.join("|")}`);
    }
    if (outcome.profitableTrades <= 0 || outcome.realizedPnl <= 0) {
      issues.push(`${outcome.strategyId}_unprofitable:${outcome.realizedPnl}`);
    }
    if (outcome.maxHeat >= targets.heatCeilingExclusive) {
      issues.push(`${outcome.strategyId}_heat_ceiling:${outcome.maxHeat}`);
    }
  }

  if (!starter) {
    issues.push("missing_starter_strategy");
  } else if (starter.maxHeat > targets.starterMaxHeat) {
    issues.push(`starter_heat:${starter.maxHeat}`);
  }

  if (!routeRunner) {
    issues.push("missing_route_runner_strategy");
  } else if (
    routeRunner.maxHeat < targets.routeRunnerMinHeat ||
    routeRunner.maxHeat > targets.routeRunnerMaxHeat
  ) {
    issues.push(`route_runner_heat:${routeRunner.maxHeat}`);
  }

  if (!contraband) {
    issues.push("missing_contraband_strategy");
  } else if (contraband.maxHeat < targets.contrabandMinHeat) {
    issues.push(`contraband_heat:${contraband.maxHeat}`);
  }

  if (starter && routeRunner && routeRunner.realizedPnl <= starter.realizedPnl) {
    issues.push(`route_reward:${routeRunner.realizedPnl}`);
  }

  if (
    routeRunner &&
    contraband &&
    contraband.realizedPnl <
      routeRunner.realizedPnl * targets.highRiskRewardMultiplier
  ) {
    issues.push(`contraband_reward:${contraband.realizedPnl}`);
  }

  return issues;
}

function getPressureOutcome(
  outcomes: readonly DemoPressureOutcome[],
  id: DemoPressureStrategyId,
): DemoPressureOutcome | undefined {
  return outcomes.find((outcome) => outcome.strategyId === id);
}
