import {
  BETA_TUNED_ARCHETYPES,
  BETA_TUNING_DELTAS,
  formatAllBetaTuningComparisons,
  runBetaTunedArchetypes,
  runBetaTuningComparisons,
  type BetaTuningComparison,
} from "../beta-tuning";
import type { ArchetypeReport } from "../player-archetypes";

jest.setTimeout(120_000);

describe("oracle-p0-006 beta tuning", () => {
  let tunedReports: ArchetypeReport[];

  beforeAll(() => {
    tunedReports = runBetaTunedArchetypes();
  });

  it("logs beta tuning comparisons when ORACLE_BETA_TUNING_LOG=1", () => {
    if (process.env.ORACLE_BETA_TUNING_LOG === "1") {
      const comparisons = runBetaTuningComparisons();
      console.info(formatAllBetaTuningComparisons(comparisons));
    }
  });

  it("defines four beta-tuned archetypes", () => {
    expect(BETA_TUNED_ARCHETYPES).toHaveLength(4);
    const ids = BETA_TUNED_ARCHETYPES.map((a) => a.id);
    expect(ids).toContain("cautious-grinder");
    expect(ids).toContain("momentum-trader");
    expect(ids).toContain("heat-seeker");
    expect(ids).toContain("speed-runner");
  });

  it("documents four tuning deltas with rationale", () => {
    expect(BETA_TUNING_DELTAS).toHaveLength(4);
    for (const delta of BETA_TUNING_DELTAS) {
      expect(delta.rationale.length).toBeGreaterThan(0);
    }
  });

  it("covers all four archetypes over 200 seeds × 60 ticks", () => {
    expect(tunedReports).toHaveLength(4);
    for (const report of tunedReports) {
      expect(report.seedCount).toBe(200);
      expect(report.ticks).toBe(60);
    }
  });

  it("all tuned archetypes pass viability gates", () => {
    for (const report of tunedReports) {
      expect(report.passed).toBe(true);
      expect(report.failReasons).toHaveLength(0);
    }
  });

  it("zero impossible states across all tuned archetypes", () => {
    const total = tunedReports.reduce((acc, r) => acc + r.impossibleStateCount, 0);
    expect(total).toBe(0);
  });

  it("all tuned archetypes achieve >= 70% profitable sessions", () => {
    for (const report of tunedReports) {
      expect(report.profitableSessionFraction).toBeGreaterThanOrEqual(0.7);
    }
  });

  it("tuned cautious-grinder has higher medianPnl than oracle-p0-005 baseline (6.13)", () => {
    const tuned = tunedReports.find((r) => r.archetypeId === "cautious-grinder")!;
    expect(tuned.medianPnl).toBeGreaterThan(6.13);
  });

  it("tuned speed-runner has higher medianPnl than oracle-p0-005 baseline (8.43)", () => {
    const tuned = tunedReports.find((r) => r.archetypeId === "speed-runner")!;
    expect(tuned.medianPnl).toBeGreaterThan(8.43);
  });

  it("tuned heat-seeker achieves >= 99.5% profitable sessions", () => {
    const tuned = tunedReports.find((r) => r.archetypeId === "heat-seeker")!;
    expect(tuned.profitableSessionFraction).toBeGreaterThanOrEqual(0.995);
  });

  it("tuned momentum-trader remains stable (medianPnl > 20, 100% profitable)", () => {
    const tuned = tunedReports.find((r) => r.archetypeId === "momentum-trader")!;
    expect(tuned.passed).toBe(true);
    expect(tuned.medianPnl).toBeGreaterThan(20);
    expect(tuned.profitableSessionFraction).toBe(1);
  });

  it("tuned cautious-grinder still has lower max heat than tuned heat-seeker", () => {
    const grinder = tunedReports.find((r) => r.archetypeId === "cautious-grinder")!;
    const heatSeeker = tunedReports.find((r) => r.archetypeId === "heat-seeker")!;
    expect(grinder.medianMaxHeat).toBeLessThan(heatSeeker.medianMaxHeat);
  });

  it("tuned speed-runner still has higher median trade count than tuned cautious-grinder", () => {
    const speedRunner = tunedReports.find((r) => r.archetypeId === "speed-runner")!;
    const grinder = tunedReports.find((r) => r.archetypeId === "cautious-grinder")!;
    expect(speedRunner.medianTrades).toBeGreaterThanOrEqual(grinder.medianTrades);
  });

  it("is deterministic: two runs of tuned cautious-grinder produce identical results", () => {
    const tuned = BETA_TUNED_ARCHETYPES.find((a) => a.id === "cautious-grinder")!;
    const { runPlayerArchetypeReport } = require("../player-archetypes") as typeof import("../player-archetypes");
    const first = runPlayerArchetypeReport(tuned);
    const second = runPlayerArchetypeReport(tuned);
    expect(first.medianPnl).toBe(second.medianPnl);
    expect(first.profitableSessionCount).toBe(second.profitableSessionCount);
  });

  describe("comparison shape", () => {
    let comparisons: BetaTuningComparison[];

    beforeAll(() => {
      comparisons = runBetaTuningComparisons({ seedCount: 50, ticks: 60 });
    });

    it("produces four comparison results", () => {
      expect(comparisons).toHaveLength(4);
    });

    it("all comparisons have both baseline and tuned passing viability", () => {
      for (const comparison of comparisons) {
        expect(comparison.passedBaseline).toBe(true);
        expect(comparison.passedTuned).toBe(true);
      }
    });

    it("momentum-trader pnlDelta is near zero (unchanged parameters)", () => {
      const c = comparisons.find((r) => r.archetypeId === "momentum-trader")!;
      expect(Math.abs(c.pnlDelta)).toBeLessThan(5);
    });
  });
});
