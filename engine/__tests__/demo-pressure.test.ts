import {
  DEMO_PRESSURE_TARGETS,
  runDemoPressureAudit,
} from "../demo-pressure";

describe("10-minute demo pressure tuning", () => {
  const outcomes = runDemoPressureAudit();

  if (process.env.NYX_PRESSURE_LOG === "1") {
    console.info(
      outcomes
        .map((outcome) =>
          [
            outcome.strategyId,
            `pnl=${outcome.realizedPnl.toFixed(2)}`,
            `trades=${outcome.trades}`,
            `profitable=${outcome.profitableTrades}`,
            `maxHeat=${outcome.maxHeat}`,
            `firstProfitTick=${outcome.firstProfitableSellTick ?? "none"}`,
            `courier=${outcome.courierRisk.map((band) => `${band.serviceName}:${band.riskLabel}`).join("/")}`,
          ].join(" "),
        )
        .join("\n"),
    );
  }

  it("keeps three repeatable player strategies viable without soft locks", () => {
    expect(outcomes).toHaveLength(DEMO_PRESSURE_TARGETS.minViableStrategies);

    for (const outcome of outcomes) {
      expect(outcome.issues).toEqual([]);
      expect(outcome.trades).toBeGreaterThan(0);
      expect(outcome.profitableTrades).toBeGreaterThan(0);
      expect(outcome.realizedPnl).toBeGreaterThan(0);
      expect(outcome.minEnergySeconds).toBeGreaterThan(0);
      expect(outcome.maxHeat).toBeLessThan(DEMO_PRESSURE_TARGETS.heatCeilingBuffer);
    }
  });

  it("keeps the starter path safe and profitable inside the guided window", () => {
    const starter = outcomes.find((outcome) => outcome.strategyId === "starter-stabilizer");

    expect(starter).toBeDefined();
    expect(starter?.firstProfitableSellTick).not.toBeNull();
    expect(starter?.firstProfitableSellTick).toBeLessThanOrEqual(
      DEMO_PRESSURE_TARGETS.starterFirstProfitTickMax,
    );
    expect(starter?.maxHeat).toBeLessThan(30);
    expect(starter?.bountyStatuses).toContain("SAFE");
  });

  it("makes risk escalation visible for medium and high pressure routes", () => {
    const routeRunner = outcomes.find((outcome) => outcome.strategyId === "route-runner");
    const contraband = outcomes.find((outcome) => outcome.strategyId === "contraband-sprint");

    expect(routeRunner).toBeDefined();
    expect(contraband).toBeDefined();
    expect(routeRunner?.maxHeat).toBeGreaterThanOrEqual(
      DEMO_PRESSURE_TARGETS.visibleRiskHeatMin,
    );
    expect(routeRunner?.bountyStatuses).toContain("WATCHED");

    expect(contraband?.maxHeat).toBeGreaterThanOrEqual(
      DEMO_PRESSURE_TARGETS.highRiskHeatMin,
    );
    expect(contraband?.bountyStatuses).toContain("PRIORITY TARGET");
    expect(contraband?.courierRisk.some((band) => band.riskLabel === "high" || band.riskLabel === "critical")).toBe(true);
  });
});
