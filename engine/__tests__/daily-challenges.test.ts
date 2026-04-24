import { advanceDailyChallengeProgress, claimDailyChallenge, createDailyChallenges } from "../daily-challenges";

describe("daily challenges", () => {
  it("creates three daily objectives and tracks progress", () => {
    const challenges = createDailyChallenges(Date.parse("2026-04-24T00:00:00Z"), 1);
    const updated = advanceDailyChallengeProgress(challenges, {
      courier_success: 1,
    });

    expect(challenges).toHaveLength(3);
    expect(updated.find((challenge) => challenge.type === "courier_success")?.completed).toBe(true);
  });

  it("claims completed rewards once", () => {
    const challenges = advanceDailyChallengeProgress(
      createDailyChallenges(Date.parse("2026-04-24T00:00:00Z"), 1),
      { courier_success: 1 },
    );
    const target = challenges.find((challenge) => challenge.type === "courier_success")!;
    const result = claimDailyChallenge(challenges, target.id);

    expect(result.claimed?.id).toBe(target.id);
    expect(result.challenges.find((challenge) => challenge.id === target.id)?.claimed).toBe(true);
  });
});
