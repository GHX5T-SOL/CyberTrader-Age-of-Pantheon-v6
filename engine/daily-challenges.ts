import { getRankSnapshot } from "@/engine/rank";
import type { DailyChallenge } from "@/engine/types";

export function getDailyChallengeDayKey(nowMs: number): string {
  return new Date(nowMs).toISOString().slice(0, 10);
}

export function createDailyChallenges(nowMs: number, rankLevel: number): DailyChallenge[] {
  const dayKey = getDailyChallengeDayKey(nowMs);
  const nextRank = getRankSnapshot(rankLevel * 250).nextXpRequired ?? 200;
  return [
    {
      id: `${dayKey}_profit`,
      type: "daily_profit",
      title: "Earn 50,000 0BOL profit today.",
      target: 50_000,
      progress: 0,
      rewardObol: 25_000,
      rewardXp: 120,
      completed: false,
      claimed: false,
    },
    {
      id: `${dayKey}_plaza_trades`,
      type: "location_trades",
      title: "Complete 3 trades in Neon Plaza.",
      target: 3,
      progress: 0,
      rewardObol: 7_500,
      rewardXp: 60,
      completed: false,
      claimed: false,
    },
    {
      id: `${dayKey}_courier`,
      type: "courier_success",
      title: "Deliver a courier shipment successfully.",
      target: 1,
      progress: 0,
      rewardObol: 10_000,
      rewardXp: Math.max(50, Math.floor(nextRank / 20)),
      completed: false,
      claimed: false,
    },
  ];
}

export function advanceDailyChallengeProgress(
  challenges: DailyChallenge[],
  updates: Partial<Record<DailyChallenge["type"], number>>,
): DailyChallenge[] {
  return challenges.map((challenge) => {
    const delta = updates[challenge.type] ?? 0;
    if (delta <= 0 || challenge.claimed) {
      return challenge;
    }

    const progress = Math.min(challenge.target, challenge.progress + delta);
    return {
      ...challenge,
      progress,
      completed: progress >= challenge.target,
    };
  });
}

export function claimDailyChallenge(
  challenges: DailyChallenge[],
  challengeId: string,
): { challenges: DailyChallenge[]; claimed: DailyChallenge | null } {
  const claimed = challenges.find(
    (challenge) => challenge.id === challengeId && challenge.completed && !challenge.claimed,
  ) ?? null;

  if (!claimed) {
    return { challenges, claimed: null };
  }

  return {
    claimed,
    challenges: challenges.map((challenge) =>
      challenge.id === challengeId ? { ...challenge, claimed: true } : challenge,
    ),
  };
}
