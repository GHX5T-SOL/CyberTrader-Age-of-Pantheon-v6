import {
  ECONOMY_ENDURANCE_SESSION_COUNT,
  ECONOMY_ENDURANCE_TICKS,
  formatEconomyEnduranceReport,
  runEconomyEndurance,
  type EconomyEnduranceSummary,
} from "../economy-endurance";

jest.setTimeout(120_000);

describe("economy endurance replay", () => {
  let summary: EconomyEnduranceSummary;

  beforeAll(() => {
    summary = runEconomyEndurance();
  });

  it("logs the endurance report when ORACLE_ENDURANCE_LOG=1", () => {
    if (process.env.ORACLE_ENDURANCE_LOG === "1") {
      console.info(formatEconomyEnduranceReport(summary));
    }
  });

  it(`covers ${ECONOMY_ENDURANCE_SESSION_COUNT} sessions over ${ECONOMY_ENDURANCE_TICKS} ticks`, () => {
    expect(summary.replay.sessionCount).toBe(ECONOMY_ENDURANCE_SESSION_COUNT);
    expect(summary.replay.ticksPerSession).toBe(ECONOMY_ENDURANCE_TICKS);
  });

  it("produces zero impossible states over 300-tick sessions", () => {
    expect(summary.replay.issueCounts.impossible_state).toBe(0);
  });

  it("produces zero negative-balance sessions over 300 ticks", () => {
    expect(summary.negativeBalanceSessions).toBe(0);
  });

  it("at least 90% of sessions have a profitable trade over 300 ticks", () => {
    const fraction = summary.profitableSessionCount / summary.replay.sessionCount;
    expect(fraction).toBeGreaterThanOrEqual(0.9);
  });

  it("median max Heat stays within valid bounds over extended play", () => {
    expect(summary.replay.medians.maxHeat).toBeGreaterThanOrEqual(0);
    expect(summary.replay.medians.maxHeat).toBeLessThanOrEqual(100);
  });

  it("P50 balance is positive (economy generates long-run value)", () => {
    expect(summary.balanceQuartiles.p50).toBeGreaterThan(0);
  });

  it("is deterministic: two runs produce identical metrics", () => {
    const second = runEconomyEndurance();
    expect(second.replay.medians.realizedPnl).toBe(summary.replay.medians.realizedPnl);
    expect(second.replay.issueCounts.impossible_state).toBe(
      summary.replay.issueCounts.impossible_state,
    );
    expect(second.negativeBalanceSessions).toBe(summary.negativeBalanceSessions);
    expect(second.profitableSessionCount).toBe(summary.profitableSessionCount);
  });

  it("passes all endurance gates", () => {
    expect(summary.passed).toBe(true);
    expect(summary.failReasons).toHaveLength(0);
  });
});
