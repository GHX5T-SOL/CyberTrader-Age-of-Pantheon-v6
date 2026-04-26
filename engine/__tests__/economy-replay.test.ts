import {
  ECONOMY_REPLAY_SESSION_COUNT,
  formatEconomyReplaySummary,
  makeEconomyReplaySeeds,
  runEconomyReplay,
} from "../economy-replay";

describe("economy replay harness", () => {
  it("runs 1000 seeded sessions deterministically and reports launch-tuning outcomes", () => {
    const seeds = makeEconomyReplaySeeds(ECONOMY_REPLAY_SESSION_COUNT);
    const first = runEconomyReplay({ seeds });
    const second = runEconomyReplay({ seeds });

    if (process.env.ORACLE_REPLAY_LOG === "1") {
      console.info(formatEconomyReplaySummary(first));
    }

    expect(first).toEqual(second);
    expect(first.sessionCount).toBe(1000);
    expect(first.issueCounts.impossible_state).toBe(0);
    expect(first.issueCounts.soft_lock).toBe(0);
    expect(first.profitableSessionCount).toBeGreaterThanOrEqual(900);
    expect(first.medians.trades).toBeGreaterThan(0);
    expect(first.medians.firstProfitableSellTick).not.toBeNull();
  });
});
