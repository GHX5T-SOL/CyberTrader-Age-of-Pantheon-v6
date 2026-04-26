import {
  ECONOMY_STRESS_SCENARIOS,
  formatEconomyStressReport,
  runEconomyStress,
} from "../economy-stress";

describe("economy stress scenarios", () => {
  let results: ReturnType<typeof runEconomyStress>;

  beforeAll(() => {
    results = runEconomyStress();
  });

  it("logs the full stress report when ORACLE_STRESS_LOG=1", () => {
    if (process.env.ORACLE_STRESS_LOG === "1") {
      console.info(formatEconomyStressReport(results));
    }
  });

  it("covers all defined stress scenarios", () => {
    expect(results).toHaveLength(ECONOMY_STRESS_SCENARIOS.length);
    const ids = results.map((r) => r.scenario.id);
    for (const scenario of ECONOMY_STRESS_SCENARIOS) {
      expect(ids).toContain(scenario.id);
    }
  });

  it("produces zero impossible states in every stress scenario", () => {
    for (const result of results) {
      expect(result.impossibleStates).toBe(0);
    }
  });

  it("produces zero negative-balance sessions in every stress scenario", () => {
    for (const result of results) {
      expect(result.negativeBalanceSessions).toBe(0);
    }
  });

  it("passes all stress scenario gate criteria", () => {
    for (const result of results) {
      expect(result.passed).toBe(true);
    }
  });

  it("low-balance-floor: balance never goes negative even at 500 0BOL start", () => {
    const result = results.find((r) => r.scenario.id === "low-balance-floor")!;
    expect(result).toBeDefined();
    expect(result.negativeBalanceSessions).toBe(0);
    expect(result.impossibleStates).toBe(0);
  });

  it("high-heat-entry: Heat=75 start produces no impossible states and handles raids", () => {
    const result = results.find((r) => r.scenario.id === "high-heat-entry")!;
    expect(result).toBeDefined();
    expect(result.impossibleStates).toBe(0);
    expect(result.summary.issueCounts.impossible_state).toBe(0);
    expect(result.summary.medians.maxHeat).toBeGreaterThanOrEqual(75);
    expect(result.summary.medians.maxHeat).toBeLessThanOrEqual(100);
  });

  it("energy-depleted: near-zero energy causes trades to block, not crash", () => {
    const result = results.find((r) => r.scenario.id === "energy-depleted")!;
    expect(result).toBeDefined();
    expect(result.impossibleStates).toBe(0);
    expect(result.negativeBalanceSessions).toBe(0);
    expect(result.summary.medians.minEnergySeconds).toBeGreaterThanOrEqual(0);
  });

  it("near-heat-ceiling: Heat=88 start causes buy blocks, no crashes", () => {
    const result = results.find((r) => r.scenario.id === "near-heat-ceiling")!;
    expect(result).toBeDefined();
    expect(result.impossibleStates).toBe(0);
    expect(result.negativeBalanceSessions).toBe(0);
    expect(result.summary.medians.maxHeat).toBeGreaterThanOrEqual(88);
    expect(result.summary.medians.maxHeat).toBeLessThanOrEqual(100);
  });
});
