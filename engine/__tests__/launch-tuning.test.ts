import {
  ORACLE_LAUNCH_TUNING_TARGETS,
  formatLaunchTuningAudit,
  runLaunchTuningAudit,
} from "../launch-tuning";
import type { DemoPressureOutcome, DemoPressureStrategyId } from "../demo-pressure";

describe("Oracle launch tuning audit", () => {
  const audit = runLaunchTuningAudit();
  const targets = ORACLE_LAUNCH_TUNING_TARGETS;

  if (process.env.ORACLE_LAUNCH_TUNING_LOG === "1") {
    console.info(formatLaunchTuningAudit(audit));
  }

  it("keeps the 1000-seed replay inside launch survival bands", () => {
    expect(audit.issues).toHaveLength(0);
    expect(audit.replay.sessionCount).toBe(targets.replaySessions);
    expect(audit.replay.ticksPerSession).toBe(targets.ticksPerSession);
    expect(audit.replay.issueCounts.soft_lock).toBe(targets.maxSoftLocks);
    expect(audit.replay.issueCounts.impossible_state).toBe(
      targets.maxImpossibleStates,
    );
    expect(audit.replay.profitableSessionCount).toBeGreaterThanOrEqual(
      targets.minProfitableSessions,
    );
    expect(audit.replay.medians.realizedPnl).toBeGreaterThanOrEqual(
      targets.medianPnlMin,
    );
    expect(audit.replay.medians.realizedPnl).toBeLessThanOrEqual(
      targets.medianPnlMax,
    );
    expect(audit.replay.medians.maxHeat).toBeGreaterThanOrEqual(
      targets.medianMaxHeatMin,
    );
    expect(audit.replay.medians.maxHeat).toBeLessThanOrEqual(
      targets.medianMaxHeatMax,
    );
    expect(audit.replay.medians.firstProfitableSellTick).not.toBeNull();
    expect(audit.replay.medians.firstProfitableSellTick ?? Infinity).toBeLessThanOrEqual(
      targets.medianFirstProfitTickMax,
    );
    expect(audit.replay.raidSessionCount).toBeGreaterThanOrEqual(
      targets.raidSessionMin,
    );
    expect(audit.replay.raidSessionCount).toBeLessThanOrEqual(
      targets.raidSessionMax,
    );
  });

  it("keeps low, medium, and high-risk demo routes separated by pressure and reward", () => {
    const starter = requireOutcome("starter-stabilizer", audit.pressure);
    const routeRunner = requireOutcome("route-runner", audit.pressure);
    const contraband = requireOutcome("contraband-sprint", audit.pressure);

    expect(audit.pressure).toHaveLength(targets.minViableStrategies);
    expect(starter.maxHeat).toBeLessThanOrEqual(targets.starterMaxHeat);
    expect(starter.bountyStatuses).toContain("SAFE");

    expect(routeRunner.maxHeat).toBeGreaterThanOrEqual(
      targets.routeRunnerMinHeat,
    );
    expect(routeRunner.maxHeat).toBeLessThanOrEqual(
      targets.routeRunnerMaxHeat,
    );
    expect(routeRunner.bountyStatuses).toContain("WATCHED");
    expect(routeRunner.realizedPnl).toBeGreaterThan(starter.realizedPnl);

    expect(contraband.maxHeat).toBeGreaterThanOrEqual(
      targets.contrabandMinHeat,
    );
    expect(contraband.maxHeat).toBeLessThan(targets.heatCeilingExclusive);
    expect(contraband.bountyStatuses).toContain("PRIORITY TARGET");
    expect(contraband.realizedPnl).toBeGreaterThanOrEqual(
      routeRunner.realizedPnl * targets.highRiskRewardMultiplier,
    );
  });
});

function requireOutcome(
  id: DemoPressureStrategyId,
  outcomes: readonly DemoPressureOutcome[],
): DemoPressureOutcome {
  const outcome = outcomes.find((candidate) => candidate.strategyId === id);
  if (!outcome) {
    throw new Error(`Missing pressure outcome: ${id}`);
  }

  return outcome;
}
