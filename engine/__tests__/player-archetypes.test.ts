import {
  ARCHETYPE_SEED_COUNT,
  ARCHETYPE_TICKS,
  PLAYER_ARCHETYPES,
  formatAllArchetypeReports,
  runAllPlayerArchetypes,
  runPlayerArchetypeReport,
  type ArchetypeReport,
} from "../player-archetypes";

jest.setTimeout(120_000);

describe("player archetype strategy reports", () => {
  let reports: ArchetypeReport[];

  beforeAll(() => {
    reports = runAllPlayerArchetypes();
  });

  it("logs all archetype reports when ORACLE_ARCHETYPES_LOG=1", () => {
    if (process.env.ORACLE_ARCHETYPES_LOG === "1") {
      console.info(formatAllArchetypeReports(reports));
    }
  });

  it(`covers all ${PLAYER_ARCHETYPES.length} archetypes over ${ARCHETYPE_SEED_COUNT} seeds × ${ARCHETYPE_TICKS} ticks`, () => {
    expect(reports).toHaveLength(PLAYER_ARCHETYPES.length);
    for (const report of reports) {
      expect(report.seedCount).toBe(ARCHETYPE_SEED_COUNT);
      expect(report.ticks).toBe(ARCHETYPE_TICKS);
    }
  });

  it("all archetypes pass viability gates", () => {
    for (const report of reports) {
      expect(report.passed).toBe(true);
      expect(report.failReasons).toHaveLength(0);
    }
  });

  it("all archetypes produce zero impossible states", () => {
    for (const report of reports) {
      expect(report.impossibleStateCount).toBe(0);
    }
  });

  it("all archetypes achieve at least 70% profitable sessions", () => {
    for (const report of reports) {
      expect(report.profitableSessionFraction).toBeGreaterThanOrEqual(0.7);
    }
  });

  it("cautious-grinder has lower median max heat than heat-seeker", () => {
    const grinder = reports.find((r) => r.archetypeId === "cautious-grinder")!;
    const heatSeeker = reports.find((r) => r.archetypeId === "heat-seeker")!;
    expect(grinder.medianMaxHeat).toBeLessThan(heatSeeker.medianMaxHeat);
  });

  it("speed-runner has higher median trade count than cautious-grinder", () => {
    const speedRunner = reports.find((r) => r.archetypeId === "speed-runner")!;
    const grinder = reports.find((r) => r.archetypeId === "cautious-grinder")!;
    expect(speedRunner.medianTrades).toBeGreaterThanOrEqual(grinder.medianTrades);
  });

  it("heat-seeker has more raid sessions than cautious-grinder", () => {
    const heatSeeker = reports.find((r) => r.archetypeId === "heat-seeker")!;
    const grinder = reports.find((r) => r.archetypeId === "cautious-grinder")!;
    expect(heatSeeker.raidSessionCount).toBeGreaterThanOrEqual(grinder.raidSessionCount);
  });

  it("is deterministic: two runs of cautious-grinder produce identical median PnL", () => {
    const archetype = PLAYER_ARCHETYPES.find((a) => a.id === "cautious-grinder")!;
    const first = runPlayerArchetypeReport(archetype);
    const second = runPlayerArchetypeReport(archetype);
    expect(first.medianPnl).toBe(second.medianPnl);
    expect(first.profitableSessionCount).toBe(second.profitableSessionCount);
    expect(first.raidSessionCount).toBe(second.raidSessionCount);
  });

  it("all archetypes report a positive median first-profit tick", () => {
    for (const report of reports) {
      if (report.medianFirstProfitTick !== null) {
        expect(report.medianFirstProfitTick).toBeGreaterThan(0);
        expect(report.medianFirstProfitTick).toBeLessThanOrEqual(ARCHETYPE_TICKS);
      }
    }
  });
});
