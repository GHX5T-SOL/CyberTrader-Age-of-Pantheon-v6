import {
  BETA_TUNED_ARCHETYPES,
} from "@/engine/beta-tuning";
import {
  runPlayerArchetypeReport,
  type ArchetypeReport,
  type PlayerArchetype,
  type PlayerArchetypeId,
} from "@/engine/player-archetypes";
import { roundCurrency } from "@/engine/demo-market";

export const MARKET_SWARM_SEEDS_PER_AGENT = 40;
export const MARKET_SWARM_TICKS = 60;

export type MarketSwarmScenarioId =
  | "balanced-beta"
  | "novice-onramp"
  | "risk-spike"
  | "speedrun-race";

export type MarketSwarmStatus = "pass" | "watch" | "fail";

export interface MarketSwarmAgentMix {
  archetypeId: PlayerArchetypeId;
  agentCount: number;
  role: string;
  oracleFocus: string;
}

export interface MarketSwarmScenario {
  id: MarketSwarmScenarioId;
  label: string;
  description: string;
  seedPrefix: string;
  ticks: number;
  seedsPerAgent: number;
  agentMix: readonly MarketSwarmAgentMix[];
}

export interface MarketSwarmArchetypeResult {
  archetypeId: PlayerArchetypeId;
  role: string;
  agentCount: number;
  report: ArchetypeReport;
}

export interface MarketSwarmReport {
  scenarioId: MarketSwarmScenarioId;
  label: string;
  description: string;
  seedPrefix: string;
  totalAgents: number;
  seedsPerAgent: number;
  ticks: number;
  syntheticSessionCount: number;
  profitableSessionFraction: number;
  raidSessionFraction: number;
  noTradeSessionFraction: number;
  impossibleStateCount: number;
  weightedMedianPnl: number;
  weightedMedianTrades: number;
  weightedMedianMaxHeat: number;
  medianFirstProfitTick: number | null;
  status: MarketSwarmStatus;
  oracleRecommendations: string[];
  archetypes: MarketSwarmArchetypeResult[];
}

export const MARKET_SWARM_SCENARIOS: readonly MarketSwarmScenario[] = [
  {
    id: "balanced-beta",
    label: "Balanced Beta Table",
    description:
      "Default 20-player beta room mixing cautious, momentum, contraband, and speed-runner behaviour.",
    seedPrefix: "hydra-p0-001:balanced-beta",
    ticks: MARKET_SWARM_TICKS,
    seedsPerAgent: MARKET_SWARM_SEEDS_PER_AGENT,
    agentMix: [
      {
        archetypeId: "cautious-grinder",
        agentCount: 8,
        role: "new-player stabilizers",
        oracleFocus: "Keep VBLM as the tutorial commodity if first-profit timing stays early.",
      },
      {
        archetypeId: "momentum-trader",
        agentCount: 6,
        role: "post-tutorial optimizers",
        oracleFocus: "Watch PGAS/GLCH/ORRS/SNPS as the mid-game upgrade path.",
      },
      {
        archetypeId: "heat-seeker",
        agentCount: 3,
        role: "contraband pressure probes",
        oracleFocus: "Use raid exposure as the main risk-readiness signal.",
      },
      {
        archetypeId: "speed-runner",
        agentCount: 3,
        role: "high-frequency loop breakers",
        oracleFocus: "Detect whether low-margin churn overpowers tutorial pacing.",
      },
    ],
  },
  {
    id: "novice-onramp",
    label: "Novice Onramp",
    description:
      "A store-demo cohort dominated by careful first-session players and a small number of early optimizers.",
    seedPrefix: "hydra-p0-001:novice-onramp",
    ticks: MARKET_SWARM_TICKS,
    seedsPerAgent: MARKET_SWARM_SEEDS_PER_AGENT,
    agentMix: [
      {
        archetypeId: "cautious-grinder",
        agentCount: 14,
        role: "first-session learners",
        oracleFocus: "Measure whether safe play still feels rewarding enough for retention.",
      },
      {
        archetypeId: "momentum-trader",
        agentCount: 3,
        role: "early strategy learners",
        oracleFocus: "Confirm the first upgrade path is visible without pushing Heat too high.",
      },
      {
        archetypeId: "heat-seeker",
        agentCount: 1,
        role: "early contraband experimenter",
        oracleFocus: "Flag if one risky player can distort aggregate raid messaging.",
      },
      {
        archetypeId: "speed-runner",
        agentCount: 2,
        role: "fast tutorial repeaters",
        oracleFocus: "Check whether repeated low-risk trades still have enough payoff.",
      },
    ],
  },
  {
    id: "risk-spike",
    label: "Contraband Risk Spike",
    description:
      "A faction-rumor event cohort where many players chase high-risk commodities at once.",
    seedPrefix: "hydra-p0-001:risk-spike",
    ticks: MARKET_SWARM_TICKS,
    seedsPerAgent: MARKET_SWARM_SEEDS_PER_AGENT,
    agentMix: [
      {
        archetypeId: "cautious-grinder",
        agentCount: 3,
        role: "defensive liquidity",
        oracleFocus: "Verify safe players are not punished by global contraband pressure.",
      },
      {
        archetypeId: "momentum-trader",
        agentCount: 5,
        role: "upgrade-path arbitrage",
        oracleFocus: "Watch whether medium-risk routes remain viable during a heat wave.",
      },
      {
        archetypeId: "heat-seeker",
        agentCount: 9,
        role: "contraband swarm",
        oracleFocus: "Tune raid cadence and Heat warnings before beta events.",
      },
      {
        archetypeId: "speed-runner",
        agentCount: 3,
        role: "escape-value scalpers",
        oracleFocus: "Measure whether low-risk churn remains a valid fallback.",
      },
    ],
  },
  {
    id: "speedrun-race",
    label: "Speedrun Race",
    description:
      "A cohort trying to maximize completed trades and first-session speed for social clips.",
    seedPrefix: "hydra-p0-001:speedrun-race",
    ticks: MARKET_SWARM_TICKS,
    seedsPerAgent: MARKET_SWARM_SEEDS_PER_AGENT,
    agentMix: [
      {
        archetypeId: "cautious-grinder",
        agentCount: 3,
        role: "baseline learners",
        oracleFocus: "Keep a stable baseline while faster loops are stressed.",
      },
      {
        archetypeId: "momentum-trader",
        agentCount: 4,
        role: "clip-friendly optimizers",
        oracleFocus: "Confirm the medium-risk path has clear payoff in short sessions.",
      },
      {
        archetypeId: "heat-seeker",
        agentCount: 2,
        role: "highlight-chasing risk takers",
        oracleFocus: "Ensure contraband does not become the only exciting clip path.",
      },
      {
        archetypeId: "speed-runner",
        agentCount: 11,
        role: "high-frequency racers",
        oracleFocus: "Watch trade-count inflation and low PnL-per-action fatigue.",
      },
    ],
  },
];

export function runMarketSwarmScenario(
  scenario: MarketSwarmScenario,
): MarketSwarmReport {
  const archetypes = scenario.agentMix.map((mix) => {
    const archetype = getTunedArchetype(mix.archetypeId);
    return {
      archetypeId: mix.archetypeId,
      role: mix.role,
      agentCount: mix.agentCount,
      report: runPlayerArchetypeReport(archetype, {
        seedCount: scenario.seedsPerAgent,
        ticks: scenario.ticks,
        seedPrefix: `${scenario.seedPrefix}:${mix.archetypeId}`,
      }),
    };
  });

  const totalAgents = sum(archetypes.map((entry) => entry.agentCount));
  const syntheticSessionCount = totalAgents * scenario.seedsPerAgent;
  const weightedProfitableSessions = sum(
    archetypes.map((entry) => entry.report.profitableSessionCount * entry.agentCount),
  );
  const weightedRaidSessions = sum(
    archetypes.map((entry) => entry.report.raidSessionCount * entry.agentCount),
  );
  const weightedNoTradeSessions = sum(
    archetypes.map((entry) => entry.report.noTradeSessionCount * entry.agentCount),
  );
  const impossibleStateCount = sum(
    archetypes.map((entry) => entry.report.impossibleStateCount * entry.agentCount),
  );

  const medianFirstProfitTick = weightedNullableMean(
    archetypes.map((entry) => ({
      value: entry.report.medianFirstProfitTick,
      weight: entry.agentCount,
    })),
  );

  const baseReport = {
    scenarioId: scenario.id,
    label: scenario.label,
    description: scenario.description,
    seedPrefix: scenario.seedPrefix,
    totalAgents,
    seedsPerAgent: scenario.seedsPerAgent,
    ticks: scenario.ticks,
    syntheticSessionCount,
    profitableSessionFraction: roundRatio(weightedProfitableSessions, syntheticSessionCount),
    raidSessionFraction: roundRatio(weightedRaidSessions, syntheticSessionCount),
    noTradeSessionFraction: roundRatio(weightedNoTradeSessions, syntheticSessionCount),
    impossibleStateCount,
    weightedMedianPnl: weightedMean(
      archetypes.map((entry) => ({
        value: entry.report.medianPnl,
        weight: entry.agentCount,
      })),
    ),
    weightedMedianTrades: weightedMean(
      archetypes.map((entry) => ({
        value: entry.report.medianTrades,
        weight: entry.agentCount,
      })),
    ),
    weightedMedianMaxHeat: weightedMean(
      archetypes.map((entry) => ({
        value: entry.report.medianMaxHeat,
        weight: entry.agentCount,
      })),
    ),
    medianFirstProfitTick,
    archetypes,
  };

  const oracleRecommendations = buildOracleRecommendations(baseReport, scenario);
  return {
    ...baseReport,
    status: deriveStatus(baseReport),
    oracleRecommendations,
  };
}

export function runAllMarketSwarmScenarios(): MarketSwarmReport[] {
  return MARKET_SWARM_SCENARIOS.map(runMarketSwarmScenario);
}

export function formatMarketSwarmReport(report: MarketSwarmReport): string {
  const profitPct = pct(report.profitableSessionFraction);
  const raidPct = pct(report.raidSessionFraction);
  const noTradePct = pct(report.noTradeSessionFraction);
  const archetypeLines = report.archetypes.map((entry) => {
    const archetypeProfit = pct(entry.report.profitableSessionFraction);
    const raidPctForType = pct(entry.report.raidSessionCount / entry.report.seedCount);
    return [
      `  - ${entry.archetypeId} agents=${entry.agentCount}`,
      `profitable=${archetypeProfit}`,
      `raids=${raidPctForType}`,
      `medianPnl=${entry.report.medianPnl.toFixed(2)}`,
      `medianHeat=${entry.report.medianMaxHeat}`,
    ].join(" ");
  });

  return [
    `HYDRA-SWARM ${report.scenarioId} status=${report.status}`,
    `agents=${report.totalAgents} syntheticSessions=${report.syntheticSessionCount} seedsPerAgent=${report.seedsPerAgent} ticks=${report.ticks}`,
    `profitable=${profitPct} raids=${raidPct} noTrade=${noTradePct} impossibleStates=${report.impossibleStateCount}`,
    `weightedMedianPnl=${report.weightedMedianPnl.toFixed(2)} weightedTrades=${report.weightedMedianTrades.toFixed(2)} weightedMaxHeat=${report.weightedMedianMaxHeat.toFixed(2)} firstProfitTick=${report.medianFirstProfitTick ?? "none"}`,
    ...archetypeLines,
    "Oracle handoff:",
    ...report.oracleRecommendations.map((recommendation) => `  - ${recommendation}`),
  ].join("\n");
}

export function formatAllMarketSwarmReports(reports: MarketSwarmReport[]): string {
  return reports.map(formatMarketSwarmReport).join("\n\n");
}

function getTunedArchetype(id: PlayerArchetypeId): PlayerArchetype {
  const archetype = BETA_TUNED_ARCHETYPES.find((candidate) => candidate.id === id);
  if (!archetype) {
    throw new Error(`Unknown tuned archetype: ${id}`);
  }
  return archetype;
}

function deriveStatus(
  report: Omit<MarketSwarmReport, "status" | "oracleRecommendations">,
): MarketSwarmStatus {
  if (
    report.impossibleStateCount > 0 ||
    report.profitableSessionFraction < 0.85 ||
    report.noTradeSessionFraction > 0.02
  ) {
    return "fail";
  }

  if (
    report.raidSessionFraction > 0.6 ||
    report.weightedMedianMaxHeat >= 50 ||
    report.weightedMedianPnl < 10 ||
    (report.medianFirstProfitTick !== null && report.medianFirstProfitTick > 4)
  ) {
    return "watch";
  }

  return "pass";
}

function buildOracleRecommendations(
  report: Omit<MarketSwarmReport, "status" | "oracleRecommendations">,
  scenario: MarketSwarmScenario,
): string[] {
  const recommendations = scenario.agentMix.map(
    (mix) => `${mix.archetypeId}: ${mix.oracleFocus}`,
  );

  if (report.raidSessionFraction > 0.6) {
    recommendations.push(
      "Oracle: treat raid cadence as the primary tuning risk before live beta events.",
    );
  }

  if (report.weightedMedianMaxHeat >= 50) {
    recommendations.push(
      "Oracle/Vex: treat high Heat exposure as the warning-copy and raid-threshold tuning risk.",
    );
  }

  if (report.weightedMedianPnl < 10) {
    recommendations.push(
      "Nyx/Oracle: raise safe-loop reward clarity before this cohort reaches beta.",
    );
  }

  if (report.medianFirstProfitTick !== null && report.medianFirstProfitTick > 4) {
    recommendations.push(
      "Vex/Nyx: keep first-profit guidance visible longer for this scenario.",
    );
  }

  if (report.impossibleStateCount === 0 && report.profitableSessionFraction >= 0.95) {
    recommendations.push(
      "Oracle: viable for beta; use this scenario as a regression fixture after economy changes.",
    );
  }

  return recommendations;
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

function weightedMean(values: readonly { value: number; weight: number }[]): number {
  const totalWeight = sum(values.map((entry) => entry.weight));
  if (totalWeight <= 0) {
    return 0;
  }
  return roundCurrency(sum(values.map((entry) => entry.value * entry.weight)) / totalWeight);
}

function weightedNullableMean(
  values: readonly { value: number | null; weight: number }[],
): number | null {
  const present = values.filter((entry): entry is { value: number; weight: number } => entry.value !== null);
  if (!present.length) {
    return null;
  }
  return weightedMean(present);
}

function roundRatio(numerator: number, denominator: number): number {
  if (denominator <= 0) {
    return 0;
  }
  return Math.round((numerator / denominator) * 10_000) / 10_000;
}

function pct(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}
