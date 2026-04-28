import {
  RETENTION_FIRST_BETA_PLAYERS,
  RETENTION_PLAYER_ARCHETYPES,
  RETENTION_SCENARIOS,
  formatAllRetentionScenarioReports,
  runAllRetentionScenarios,
  runRetentionScenario,
  type RetentionScenarioReport,
} from "../retention-scenarios";

jest.setTimeout(120_000);

describe("hydra-p1-002 retention and churn scenarios", () => {
  let reports: RetentionScenarioReport[];

  beforeAll(() => {
    reports = runAllRetentionScenarios();
  });

  it("logs retention reports when HYDRA_RETENTION_LOG=1", () => {
    if (process.env.HYDRA_RETENTION_LOG === "1") {
      console.info(formatAllRetentionScenarioReports(reports));
    }
  });

  it("defines five retention player archetypes", () => {
    expect(RETENTION_PLAYER_ARCHETYPES).toHaveLength(5);
    expect(RETENTION_PLAYER_ARCHETYPES.map((persona) => persona.id).sort()).toEqual([
      "clip-speedrunner",
      "contraband-tourist",
      "guided-newcomer",
      "returning-casual",
      "steady-upgrader",
    ]);
  });

  it("defines four deterministic first-20 beta scenarios", () => {
    expect(RETENTION_SCENARIOS).toHaveLength(4);
    for (const scenario of RETENTION_SCENARIOS) {
      expect(scenario.seedPrefix).toBe(`hydra-p1-002:${scenario.id}`);
      expect(scenario.personaMix.reduce((total, mix) => total + mix.playerCount, 0)).toBe(
        RETENTION_FIRST_BETA_PLAYERS,
      );
      expect(scenario.personaMix).toHaveLength(5);
    }
  });

  it("runs every scenario with 200 synthetic sessions and zero impossible states", () => {
    for (const report of reports) {
      expect(report.totalPlayers).toBe(20);
      expect(report.seedsPerPlayer).toBe(10);
      expect(report.syntheticSessionCount).toBe(200);
      expect(report.impossibleStateCount).toBe(0);
    }
  });

  it("keeps all first-20 scenarios above the retention viability floor", () => {
    for (const report of reports) {
      expect(report.estimatedD1ReturnFraction).toBeGreaterThanOrEqual(0.62);
      expect(report.status).not.toBe("fail");
    }
  });

  it("logs churn triggers for game-design handoff", () => {
    for (const report of reports) {
      expect(report.churnTriggers.length).toBeGreaterThan(0);
      expect(report.gameDesignerRecommendations.join("\n")).toContain("Hydra");
    }
  });

  it("flags contraband event Heat as a watch trigger", () => {
    const riskEvent = reports.find((report) => report.scenarioId === "risk-event-pulse")!;
    expect(riskEvent.status).toBe("watch");
    expect(riskEvent.churnTriggers.map((trigger) => trigger.id)).toContain("heat-anxiety");
    expect(riskEvent.gameDesignerRecommendations.join("\n")).toContain("Heat warning");
  });

  it("shows tutorial-friction has more low-reward exposure than risk-event-pulse", () => {
    const tutorial = reports.find((report) => report.scenarioId === "tutorial-friction")!;
    const riskEvent = reports.find((report) => report.scenarioId === "risk-event-pulse")!;
    const tutorialLowReward =
      tutorial.churnTriggers.find((trigger) => trigger.id === "low-reward")?.playerCount ?? 0;
    const riskLowReward =
      riskEvent.churnTriggers.find((trigger) => trigger.id === "low-reward")?.playerCount ?? 0;
    expect(tutorialLowReward).toBeGreaterThan(riskLowReward);
  });

  it("is deterministic for repeated balanced-first-week runs", () => {
    const scenario = RETENTION_SCENARIOS.find(
      (entry) => entry.id === "balanced-first-week",
    )!;
    const first = runRetentionScenario(scenario);
    const second = runRetentionScenario(scenario);
    expect(first.estimatedD1ReturnFraction).toBe(second.estimatedD1ReturnFraction);
    expect(first.weightedMedianPnl).toBe(second.weightedMedianPnl);
    expect(first.churnTriggers).toEqual(second.churnTriggers);
  });

  it("formats reports with churn trigger and game designer sections", () => {
    const output = formatAllRetentionScenarioReports(reports);
    expect(output).toContain("HYDRA-RETENTION balanced-first-week");
    expect(output).toContain("Churn triggers:");
    expect(output).toContain("Game Designer handoff:");
  });
});
