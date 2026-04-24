import type { BountySnapshot, BountyTier } from "@/engine/types";

export const BOUNTY_LEVELS: readonly BountySnapshot[] = [
  {
    level: 0,
    status: "SAFE",
    heatMin: 0,
    heatMax: 29,
    courierRiskBonus: 0,
    missionRewardMultiplier: 1,
    raidProbabilityDivisor: 200,
  },
  {
    level: 1,
    status: "WATCHED",
    heatMin: 30,
    heatMax: 49,
    courierRiskBonus: 0.1,
    missionRewardMultiplier: 1.05,
    raidProbabilityDivisor: 200,
  },
  {
    level: 2,
    status: "HUNTED",
    heatMin: 50,
    heatMax: 69,
    courierRiskBonus: 0.25,
    missionRewardMultiplier: 1.2,
    raidProbabilityDivisor: 200,
  },
  {
    level: 3,
    status: "PRIORITY TARGET",
    heatMin: 70,
    heatMax: 100,
    courierRiskBonus: 0.4,
    missionRewardMultiplier: 1.35,
    raidProbabilityDivisor: 150,
  },
] as const;

export function getBountyByHeat(heat: number): BountySnapshot {
  const safeHeat = Math.max(0, Math.min(100, Math.floor(heat)));
  return BOUNTY_LEVELS.find(
    (level) => safeHeat >= level.heatMin && safeHeat <= level.heatMax,
  ) ?? BOUNTY_LEVELS[0]!;
}

export function getBountyCourierRiskBonus(heatOrTier: number | BountyTier): number {
  const level = heatOrTier <= 3
    ? BOUNTY_LEVELS.find((tier) => tier.level === heatOrTier)
    : getBountyByHeat(heatOrTier);
  return level?.courierRiskBonus ?? 0;
}

export function getBountyFlashFrequencyMultiplier(level: BountyTier): number {
  return level >= 2 ? 0.8 : 1;
}

export function getBountyRaidIntervalTicks(level: BountyTier): number {
  return level >= 3 ? 30 : 60;
}

export function getBountyRiskLabel(lossChance: number): "low" | "medium" | "high" | "critical" {
  if (lossChance >= 0.6) {
    return "critical";
  }
  if (lossChance >= 0.35) {
    return "high";
  }
  if (lossChance >= 0.15) {
    return "medium";
  }
  return "low";
}

