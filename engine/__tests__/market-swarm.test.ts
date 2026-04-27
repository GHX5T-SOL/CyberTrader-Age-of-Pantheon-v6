import {
  MARKET_SWARM_SCENARIOS,
  formatAllMarketSwarmReports,
  runAllMarketSwarmScenarios,
  runMarketSwarmScenario,
  type MarketSwarmReport,
} from "../market-swarm";

jest.setTimeout(120_000);

describe("hydra-p0-001 market swarm scenarios", () => {
  let reports: MarketSwarmReport[];

  beforeAll(() => {
    reports = runAllMarketSwarmScenarios();
  });

  it("logs market swarm reports when HYDRA_SWARM_LOG=1", () => {
    if (process.env.HYDRA_SWARM_LOG === "1") {
      console.info(formatAllMarketSwarmReports(reports));
    }
  });

  it("defines four deterministic launch scenarios", () => {
    expect(MARKET_SWARM_SCENARIOS).toHaveLength(4);
    for (const scenario of MARKET_SWARM_SCENARIOS) {
      expect(scenario.seedPrefix).toBe(`hydra-p0-001:${scenario.id}`);
      expect(scenario.agentMix.length).toBeGreaterThanOrEqual(4);
      expect(scenario.agentMix.reduce((total, mix) => total + mix.agentCount, 0)).toBe(20);
    }
  });

  it("covers all tuned player archetypes in every scenario", () => {
    for (const report of reports) {
      expect(report.archetypes.map((entry) => entry.archetypeId).sort()).toEqual([
        "cautious-grinder",
        "heat-seeker",
        "momentum-trader",
        "speed-runner",
      ]);
    }
  });

  it("runs every scenario with 800 synthetic sessions and zero impossible states", () => {
    for (const report of reports) {
      expect(report.totalAgents).toBe(20);
      expect(report.seedsPerAgent).toBe(40);
      expect(report.syntheticSessionCount).toBe(800);
      expect(report.impossibleStateCount).toBe(0);
    }
  });

  it("keeps all launch scenarios above the beta viability floor", () => {
    for (const report of reports) {
      expect(report.profitableSessionFraction).toBeGreaterThanOrEqual(0.95);
      expect(report.noTradeSessionFraction).toBe(0);
      expect(report.status).not.toBe("fail");
    }
  });

  it("marks contraband-heavy swarm pressure as watch, not failure", () => {
    const riskSpike = reports.find((report) => report.scenarioId === "risk-spike")!;
    expect(riskSpike.status).toBe("watch");
    expect(riskSpike.oracleRecommendations.join("\n")).toContain("high Heat exposure");
  });

  it("shows the risk-spike scenario has more Heat exposure than novice onramp", () => {
    const novice = reports.find((report) => report.scenarioId === "novice-onramp")!;
    const riskSpike = reports.find((report) => report.scenarioId === "risk-spike")!;
    expect(riskSpike.weightedMedianMaxHeat).toBeGreaterThan(novice.weightedMedianMaxHeat);
  });

  it("is deterministic for a repeated balanced-beta run", () => {
    const scenario = MARKET_SWARM_SCENARIOS.find((entry) => entry.id === "balanced-beta")!;
    const first = runMarketSwarmScenario(scenario);
    const second = runMarketSwarmScenario(scenario);
    expect(first.profitableSessionFraction).toBe(second.profitableSessionFraction);
    expect(first.raidSessionFraction).toBe(second.raidSessionFraction);
    expect(first.weightedMedianPnl).toBe(second.weightedMedianPnl);
  });

  it("formats reports with an Oracle handoff", () => {
    const output = formatAllMarketSwarmReports(reports);
    expect(output).toContain("HYDRA-SWARM balanced-beta");
    expect(output).toContain("Oracle handoff:");
    expect(output).toContain("viable for beta");
  });
});
