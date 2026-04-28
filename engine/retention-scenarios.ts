import { BETA_TUNED_ARCHETYPES } from "@/engine/beta-tuning";
import { roundCurrency } from "@/engine/demo-market";
import {
  runPlayerArchetypeReport,
  type ArchetypeReport,
  type PlayerArchetype,
  type PlayerArchetypeId,
} from "@/engine/player-archetypes";

export const RETENTION_FIRST_BETA_PLAYERS = 20;
export const RETENTION_SEEDS_PER_PLAYER = 10;
export const RETENTION_TICKS = 60;

export type RetentionPlayerArchetypeId =
  | "guided-newcomer"
  | "steady-upgrader"
  | "contraband-tourist"
  | "clip-speedrunner"
  | "returning-casual";

export type RetentionScenarioId =
  | "balanced-first-week"
  | "tutorial-friction"
  | "risk-event-pulse"
  | "short-session-return";

export type RetentionStatus = "pass" | "watch" | "fail";

export type ChurnTriggerId =
  | "slow-first-profit"
  | "low-reward"
  | "heat-anxiety"
  | "low-agency"
  | "action-fatigue"
  | "no-trade-risk"
  | "unstable-state";

interface RetentionThresholds {
  minMedianPnl: number;
  minMedianTrades: number;
  maxFirstProfitTick: number;
  maxComfortHeat: number;
  maxRaidFraction: number;
  maxComfortTrades?: number;
}

export interface RetentionPlayerArchetype {
  id: RetentionPlayerArchetypeId;
  label: string;
  sourceArchetypeId: PlayerArchetypeId;
  description: string;
  baseD1ReturnFraction: number;
  raidSensitivity: number;
  thresholds: RetentionThresholds;
  archetype: PlayerArchetype;
}

export interface RetentionPersonaMix {
  personaId: RetentionPlayerArchetypeId;
  playerCount: number;
  role: string;
  designFocus: string;
}

export interface RetentionScenario {
  id: RetentionScenarioId;
  label: string;
  description: string;
  seedPrefix: string;
  ticks: number;
  seedsPerPlayer: number;
  personaMix: readonly RetentionPersonaMix[];
}

export interface ChurnTriggerDetail {
  id: ChurnTriggerId;
  reason: string;
}

export interface RetentionPersonaResult {
  personaId: RetentionPlayerArchetypeId;
  label: string;
  sourceArchetypeId: PlayerArchetypeId;
  role: string;
  playerCount: number;
  report: ArchetypeReport;
  raidSessionFraction: number;
  noTradeSessionFraction: number;
  estimatedD1ReturnFraction: number;
  churnRiskFraction: number;
  churnTriggers: ChurnTriggerDetail[];
}

export interface ChurnTriggerSummary {
  id: ChurnTriggerId;
  playerCount: number;
  reasons: string[];
}

export interface RetentionScenarioReport {
  scenarioId: RetentionScenarioId;
  label: string;
  description: string;
  seedPrefix: string;
  totalPlayers: number;
  seedsPerPlayer: number;
  ticks: number;
  syntheticSessionCount: number;
  estimatedD1ReturnFraction: number;
  estimatedRetainedPlayers: number;
  atRiskPlayerFraction: number;
  weightedMedianPnl: number;
  weightedMedianTrades: number;
  weightedMedianMaxHeat: number;
  weightedRaidSessionFraction: number;
  impossibleStateCount: number;
  status: RetentionStatus;
  churnTriggers: ChurnTriggerSummary[];
  gameDesignerRecommendations: string[];
  personas: RetentionPersonaResult[];
}

export const RETENTION_PLAYER_ARCHETYPES: readonly RetentionPlayerArchetype[] = [
  {
    id: "guided-newcomer",
    label: "Guided Newcomer",
    sourceArchetypeId: "cautious-grinder",
    description: "First-session player who follows safe cues and needs an early visible win.",
    baseD1ReturnFraction: 0.7,
    raidSensitivity: 0.55,
    thresholds: {
      minMedianPnl: 10,
      minMedianTrades: 6,
      maxFirstProfitTick: 4,
      maxComfortHeat: 24,
      maxRaidFraction: 0.05,
      maxComfortTrades: 14,
    },
    archetype: {
      ...getTunedArchetype("cautious-grinder"),
      label: "Guided Newcomer",
      description: "Safe tutorial-led VBLM/NGLS/MTRX loop for first-session learners.",
      maxClosedPositions: 10,
    },
  },
  {
    id: "steady-upgrader",
    label: "Steady Upgrader",
    sourceArchetypeId: "momentum-trader",
    description: "Post-tutorial player who returns if the medium-risk upgrade path is legible.",
    baseD1ReturnFraction: 0.74,
    raidSensitivity: 0.45,
    thresholds: {
      minMedianPnl: 28,
      minMedianTrades: 5,
      maxFirstProfitTick: 4,
      maxComfortHeat: 52,
      maxRaidFraction: 0.25,
      maxComfortTrades: 12,
    },
    archetype: getTunedArchetype("momentum-trader"),
  },
  {
    id: "contraband-tourist",
    label: "Contraband Tourist",
    sourceArchetypeId: "heat-seeker",
    description: "Risk-curious player who may churn if raid pressure feels unfair.",
    baseD1ReturnFraction: 0.68,
    raidSensitivity: 0.7,
    thresholds: {
      minMedianPnl: 26,
      minMedianTrades: 4,
      maxFirstProfitTick: 5,
      maxComfortHeat: 50,
      maxRaidFraction: 0.35,
      maxComfortTrades: 10,
    },
    archetype: getTunedArchetype("heat-seeker"),
  },
  {
    id: "clip-speedrunner",
    label: "Clip Speedrunner",
    sourceArchetypeId: "speed-runner",
    description: "High-frequency player chasing fast clips and visible progress density.",
    baseD1ReturnFraction: 0.72,
    raidSensitivity: 0.35,
    thresholds: {
      minMedianPnl: 12,
      minMedianTrades: 16,
      maxFirstProfitTick: 3,
      maxComfortHeat: 42,
      maxRaidFraction: 0.18,
      maxComfortTrades: 22,
    },
    archetype: getTunedArchetype("speed-runner"),
  },
  {
    id: "returning-casual",
    label: "Returning Casual",
    sourceArchetypeId: "cautious-grinder",
    description: "Short-session player who returns if safe progress is obvious without over-trading.",
    baseD1ReturnFraction: 0.66,
    raidSensitivity: 0.5,
    thresholds: {
      minMedianPnl: 7,
      minMedianTrades: 4,
      maxFirstProfitTick: 5,
      maxComfortHeat: 30,
      maxRaidFraction: 0.08,
      maxComfortTrades: 10,
    },
    archetype: {
      ...getTunedArchetype("cautious-grinder"),
      label: "Returning Casual",
      description: "Shorter VBLM/PGAS/MTRX loop tuned for low-time return sessions.",
      tickers: ["VBLM", "PGAS", "MTRX"],
      quantities: [12, 8, 6],
      profitTargetPct: 0.004,
      maxHoldTicks: 3,
      maxEntryHeat: 30,
      maxClosedPositions: 8,
    },
  },
];

export const RETENTION_SCENARIOS: readonly RetentionScenario[] = [
  {
    id: "balanced-first-week",
    label: "Balanced First Week",
    description: "Default first-20 beta room for retention regression after economy changes.",
    seedPrefix: "hydra-p1-002:balanced-first-week",
    ticks: RETENTION_TICKS,
    seedsPerPlayer: RETENTION_SEEDS_PER_PLAYER,
    personaMix: [
      {
        personaId: "guided-newcomer",
        playerCount: 6,
        role: "first-session learners",
        designFocus: "Protect the tutorial win and safe-loop reward clarity.",
      },
      {
        personaId: "steady-upgrader",
        playerCount: 5,
        role: "medium-risk optimizers",
        designFocus: "Keep PGAS/ORRS/SNPS as the first upgrade path.",
      },
      {
        personaId: "contraband-tourist",
        playerCount: 3,
        role: "risk-curious testers",
        designFocus: "Use Heat warnings before raid pressure feels arbitrary.",
      },
      {
        personaId: "clip-speedrunner",
        playerCount: 3,
        role: "social clip chasers",
        designFocus: "Keep high-frequency play rewarding without action fatigue.",
      },
      {
        personaId: "returning-casual",
        playerCount: 3,
        role: "low-time returners",
        designFocus: "Make short-session progress obvious on return.",
      },
    ],
  },
  {
    id: "tutorial-friction",
    label: "Tutorial Friction",
    description: "New-player-heavy cohort that detects slow first-profit and low-reward churn.",
    seedPrefix: "hydra-p1-002:tutorial-friction",
    ticks: RETENTION_TICKS,
    seedsPerPlayer: RETENTION_SEEDS_PER_PLAYER,
    personaMix: [
      {
        personaId: "guided-newcomer",
        playerCount: 10,
        role: "guided learners",
        designFocus: "Keep the first profitable sell visible and early.",
      },
      {
        personaId: "returning-casual",
        playerCount: 4,
        role: "low-time learners",
        designFocus: "Reduce repeat-session reorientation cost.",
      },
      {
        personaId: "steady-upgrader",
        playerCount: 3,
        role: "early optimizers",
        designFocus: "Expose the upgrade path without burying the tutorial.",
      },
      {
        personaId: "clip-speedrunner",
        playerCount: 2,
        role: "fast repeaters",
        designFocus: "Keep speed play optional rather than required.",
      },
      {
        personaId: "contraband-tourist",
        playerCount: 1,
        role: "risk sampler",
        designFocus: "Make the first contraband warning legible.",
      },
    ],
  },
  {
    id: "risk-event-pulse",
    label: "Risk Event Pulse",
    description: "Weekend rumor cohort with elevated contraband curiosity and Heat exposure.",
    seedPrefix: "hydra-p1-002:risk-event-pulse",
    ticks: RETENTION_TICKS,
    seedsPerPlayer: RETENTION_SEEDS_PER_PLAYER,
    personaMix: [
      {
        personaId: "contraband-tourist",
        playerCount: 7,
        role: "event risk takers",
        designFocus: "Check whether Heat warnings prevent raid-driven churn.",
      },
      {
        personaId: "steady-upgrader",
        playerCount: 5,
        role: "medium-risk stabilizers",
        designFocus: "Keep non-contraband upgrade loops viable during event pressure.",
      },
      {
        personaId: "clip-speedrunner",
        playerCount: 3,
        role: "fallback scalpers",
        designFocus: "Confirm speed play remains a low-Heat fallback.",
      },
      {
        personaId: "guided-newcomer",
        playerCount: 3,
        role: "safe-loop observers",
        designFocus: "Protect new players from global event anxiety.",
      },
      {
        personaId: "returning-casual",
        playerCount: 2,
        role: "low-time event returners",
        designFocus: "Surface event stakes without overwhelming short sessions.",
      },
    ],
  },
  {
    id: "short-session-return",
    label: "Short Session Return",
    description: "Low-time cohort that tests whether returning players see progress quickly.",
    seedPrefix: "hydra-p1-002:short-session-return",
    ticks: RETENTION_TICKS,
    seedsPerPlayer: RETENTION_SEEDS_PER_PLAYER,
    personaMix: [
      {
        personaId: "returning-casual",
        playerCount: 8,
        role: "short-session returners",
        designFocus: "Keep resume state and next action clear.",
      },
      {
        personaId: "clip-speedrunner",
        playerCount: 5,
        role: "quick-session chasers",
        designFocus: "Avoid high trade-count fatigue in short sessions.",
      },
      {
        personaId: "guided-newcomer",
        playerCount: 3,
        role: "returning learners",
        designFocus: "Retain first-session guidance after a break.",
      },
      {
        personaId: "steady-upgrader",
        playerCount: 2,
        role: "upgrade samplers",
        designFocus: "Keep the medium-risk path discoverable in one visit.",
      },
      {
        personaId: "contraband-tourist",
        playerCount: 2,
        role: "risk samplers",
        designFocus: "Prevent short-session Heat spikes from feeling punitive.",
      },
    ],
  },
];

export function runRetentionScenario(
  scenario: RetentionScenario,
): RetentionScenarioReport {
  const personas = scenario.personaMix.map((mix) => {
    const persona = getRetentionPersona(mix.personaId);
    const report = runPlayerArchetypeReport(persona.archetype, {
      seedCount: scenario.seedsPerPlayer,
      ticks: scenario.ticks,
      seedPrefix: `${scenario.seedPrefix}:${persona.id}`,
    });
    const raidSessionFraction = roundRatio(report.raidSessionCount, report.seedCount);
    const noTradeSessionFraction = roundRatio(report.noTradeSessionCount, report.seedCount);
    const churnTriggers = deriveChurnTriggers(persona, report);
    const estimatedD1ReturnFraction = deriveD1ReturnFraction({
      persona,
      report,
      raidSessionFraction,
      noTradeSessionFraction,
    });

    return {
      personaId: persona.id,
      label: persona.label,
      sourceArchetypeId: persona.sourceArchetypeId,
      role: mix.role,
      playerCount: mix.playerCount,
      report,
      raidSessionFraction,
      noTradeSessionFraction,
      estimatedD1ReturnFraction,
      churnRiskFraction: roundFraction(1 - estimatedD1ReturnFraction),
      churnTriggers,
    };
  });

  const totalPlayers = sum(personas.map((entry) => entry.playerCount));
  const syntheticSessionCount = totalPlayers * scenario.seedsPerPlayer;
  const estimatedD1ReturnFraction = weightedFraction(
    personas.map((entry) => ({
      value: entry.estimatedD1ReturnFraction,
      weight: entry.playerCount,
    })),
  );
  const atRiskPlayers = sum(
    personas
      .filter((entry) => entry.churnRiskFraction >= 0.34 || entry.churnTriggers.length >= 2)
      .map((entry) => entry.playerCount),
  );
  const baseReport = {
    scenarioId: scenario.id,
    label: scenario.label,
    description: scenario.description,
    seedPrefix: scenario.seedPrefix,
    totalPlayers,
    seedsPerPlayer: scenario.seedsPerPlayer,
    ticks: scenario.ticks,
    syntheticSessionCount,
    estimatedD1ReturnFraction,
    estimatedRetainedPlayers: roundCurrency(estimatedD1ReturnFraction * totalPlayers),
    atRiskPlayerFraction: roundRatio(atRiskPlayers, totalPlayers),
    weightedMedianPnl: weightedCurrency(
      personas.map((entry) => ({
        value: entry.report.medianPnl,
        weight: entry.playerCount,
      })),
    ),
    weightedMedianTrades: weightedCurrency(
      personas.map((entry) => ({
        value: entry.report.medianTrades,
        weight: entry.playerCount,
      })),
    ),
    weightedMedianMaxHeat: weightedCurrency(
      personas.map((entry) => ({
        value: entry.report.medianMaxHeat,
        weight: entry.playerCount,
      })),
    ),
    weightedRaidSessionFraction: weightedFraction(
      personas.map((entry) => ({
        value: entry.raidSessionFraction,
        weight: entry.playerCount,
      })),
    ),
    impossibleStateCount: sum(
      personas.map((entry) => entry.report.impossibleStateCount * entry.playerCount),
    ),
    churnTriggers: summarizeChurnTriggers(personas),
    personas,
  };

  return {
    ...baseReport,
    status: deriveRetentionStatus(baseReport),
    gameDesignerRecommendations: buildGameDesignerRecommendations(baseReport, scenario),
  };
}

export function runAllRetentionScenarios(): RetentionScenarioReport[] {
  return RETENTION_SCENARIOS.map(runRetentionScenario);
}

export function formatRetentionScenarioReport(report: RetentionScenarioReport): string {
  const triggerLines =
    report.churnTriggers.length > 0
      ? report.churnTriggers.map(
          (trigger) =>
            `  - ${trigger.id} players=${trigger.playerCount} reasons=${trigger.reasons.join(" | ")}`,
        )
      : ["  - none"];
  const personaLines = report.personas.map((entry) =>
    [
      `  - ${entry.personaId} players=${entry.playerCount}`,
      `d1=${pct(entry.estimatedD1ReturnFraction)}`,
      `churnRisk=${pct(entry.churnRiskFraction)}`,
      `medianPnl=${entry.report.medianPnl.toFixed(2)}`,
      `trades=${entry.report.medianTrades}`,
      `heat=${entry.report.medianMaxHeat}`,
      `triggers=${entry.churnTriggers.map((trigger) => trigger.id).join(",") || "none"}`,
    ].join(" "),
  );

  return [
    `HYDRA-RETENTION ${report.scenarioId} status=${report.status}`,
    `players=${report.totalPlayers} syntheticSessions=${report.syntheticSessionCount} seedsPerPlayer=${report.seedsPerPlayer} ticks=${report.ticks}`,
    `estimatedD1=${pct(report.estimatedD1ReturnFraction)} retainedPlayers=${report.estimatedRetainedPlayers.toFixed(2)} atRisk=${pct(report.atRiskPlayerFraction)}`,
    `weightedMedianPnl=${report.weightedMedianPnl.toFixed(2)} weightedTrades=${report.weightedMedianTrades.toFixed(2)} weightedMaxHeat=${report.weightedMedianMaxHeat.toFixed(2)} raids=${pct(report.weightedRaidSessionFraction)} impossibleStates=${report.impossibleStateCount}`,
    "Personas:",
    ...personaLines,
    "Churn triggers:",
    ...triggerLines,
    "Game Designer handoff:",
    ...report.gameDesignerRecommendations.map((recommendation) => `  - ${recommendation}`),
  ].join("\n");
}

export function formatAllRetentionScenarioReports(
  reports: RetentionScenarioReport[],
): string {
  return reports.map(formatRetentionScenarioReport).join("\n\n");
}

function getTunedArchetype(id: PlayerArchetypeId): PlayerArchetype {
  const archetype = BETA_TUNED_ARCHETYPES.find((candidate) => candidate.id === id);
  if (!archetype) {
    throw new Error(`Unknown tuned archetype: ${id}`);
  }
  return { ...archetype };
}

function getRetentionPersona(id: RetentionPlayerArchetypeId): RetentionPlayerArchetype {
  const persona = RETENTION_PLAYER_ARCHETYPES.find((candidate) => candidate.id === id);
  if (!persona) {
    throw new Error(`Unknown retention persona: ${id}`);
  }
  return persona;
}

function deriveChurnTriggers(
  persona: RetentionPlayerArchetype,
  report: ArchetypeReport,
): ChurnTriggerDetail[] {
  const triggers: ChurnTriggerDetail[] = [];
  const thresholds = persona.thresholds;
  const raidSessionFraction = report.raidSessionCount / report.seedCount;
  const noTradeSessionFraction = report.noTradeSessionCount / report.seedCount;

  if (
    report.medianFirstProfitTick === null ||
    report.medianFirstProfitTick > thresholds.maxFirstProfitTick
  ) {
    triggers.push({
      id: "slow-first-profit",
      reason: `firstProfitTick=${report.medianFirstProfitTick ?? "none"} max=${thresholds.maxFirstProfitTick}`,
    });
  }

  if (report.medianPnl < thresholds.minMedianPnl) {
    triggers.push({
      id: "low-reward",
      reason: `medianPnl=${report.medianPnl.toFixed(2)} min=${thresholds.minMedianPnl.toFixed(2)}`,
    });
  }

  if (
    report.medianMaxHeat > thresholds.maxComfortHeat ||
    raidSessionFraction > thresholds.maxRaidFraction
  ) {
    triggers.push({
      id: "heat-anxiety",
      reason: `medianHeat=${report.medianMaxHeat} raid=${pct(raidSessionFraction)} comfortHeat=${thresholds.maxComfortHeat}`,
    });
  }

  if (report.medianTrades < thresholds.minMedianTrades) {
    triggers.push({
      id: "low-agency",
      reason: `medianTrades=${report.medianTrades} min=${thresholds.minMedianTrades}`,
    });
  }

  if (
    thresholds.maxComfortTrades !== undefined &&
    report.medianTrades > thresholds.maxComfortTrades
  ) {
    triggers.push({
      id: "action-fatigue",
      reason: `medianTrades=${report.medianTrades} comfortMax=${thresholds.maxComfortTrades}`,
    });
  }

  if (noTradeSessionFraction > 0) {
    triggers.push({
      id: "no-trade-risk",
      reason: `noTrade=${pct(noTradeSessionFraction)}`,
    });
  }

  if (report.impossibleStateCount > 0) {
    triggers.push({
      id: "unstable-state",
      reason: `impossibleStates=${report.impossibleStateCount}`,
    });
  }

  return triggers;
}

function deriveD1ReturnFraction(input: {
  persona: RetentionPlayerArchetype;
  report: ArchetypeReport;
  raidSessionFraction: number;
  noTradeSessionFraction: number;
}): number {
  const { persona, report, raidSessionFraction, noTradeSessionFraction } = input;
  const thresholds = persona.thresholds;
  let score = persona.baseD1ReturnFraction;

  const rewardRatio =
    thresholds.minMedianPnl > 0
      ? (report.medianPnl - thresholds.minMedianPnl) / thresholds.minMedianPnl
      : 0;
  score += clamp(rewardRatio * 0.16, -0.16, 0.12);

  if (report.medianFirstProfitTick === null) {
    score -= 0.2;
  } else {
    const firstProfitDelta = thresholds.maxFirstProfitTick - report.medianFirstProfitTick;
    score += clamp(firstProfitDelta * 0.02, -0.16, 0.08);
  }

  const lowTradeDelta = thresholds.minMedianTrades - report.medianTrades;
  if (lowTradeDelta > 0) {
    score -= clamp(lowTradeDelta * 0.025, 0, 0.16);
  } else {
    score += 0.03;
  }

  if (
    thresholds.maxComfortTrades !== undefined &&
    report.medianTrades > thresholds.maxComfortTrades
  ) {
    score -= clamp((report.medianTrades - thresholds.maxComfortTrades) * 0.015, 0, 0.14);
  }

  if (report.medianMaxHeat > thresholds.maxComfortHeat) {
    score -= clamp((report.medianMaxHeat - thresholds.maxComfortHeat) * 0.006, 0, 0.16);
  }

  if (raidSessionFraction > thresholds.maxRaidFraction) {
    score -= clamp(
      (raidSessionFraction - thresholds.maxRaidFraction) * persona.raidSensitivity,
      0,
      0.22,
    );
  }

  score -= clamp(noTradeSessionFraction * 0.3, 0, 0.2);

  if (report.impossibleStateCount > 0) {
    score -= 0.3;
  }

  return roundFraction(clamp(score, 0, 1));
}

function summarizeChurnTriggers(
  personas: readonly RetentionPersonaResult[],
): ChurnTriggerSummary[] {
  const summaries = new Map<ChurnTriggerId, { playerCount: number; reasons: Set<string> }>();

  for (const persona of personas) {
    for (const trigger of persona.churnTriggers) {
      const existing =
        summaries.get(trigger.id) ?? { playerCount: 0, reasons: new Set<string>() };
      existing.playerCount += persona.playerCount;
      existing.reasons.add(`${persona.personaId}: ${trigger.reason}`);
      summaries.set(trigger.id, existing);
    }
  }

  return Array.from(summaries.entries())
    .map(([id, summary]) => ({
      id,
      playerCount: summary.playerCount,
      reasons: Array.from(summary.reasons),
    }))
    .sort((a, b) => b.playerCount - a.playerCount || a.id.localeCompare(b.id));
}

function deriveRetentionStatus(
  report: Omit<RetentionScenarioReport, "status" | "gameDesignerRecommendations">,
): RetentionStatus {
  if (
    report.totalPlayers !== RETENTION_FIRST_BETA_PLAYERS ||
    report.impossibleStateCount > 0 ||
    report.estimatedD1ReturnFraction < 0.55
  ) {
    return "fail";
  }

  if (
    report.estimatedD1ReturnFraction < 0.68 ||
    report.atRiskPlayerFraction > 0.35 ||
    report.weightedRaidSessionFraction > 0.28 ||
    report.churnTriggers.some((trigger) => trigger.playerCount >= 7)
  ) {
    return "watch";
  }

  return "pass";
}

function buildGameDesignerRecommendations(
  report: Omit<RetentionScenarioReport, "status" | "gameDesignerRecommendations">,
  scenario: RetentionScenario,
): string[] {
  const recommendations = scenario.personaMix.map(
    (mix) => `${mix.personaId}: ${mix.designFocus}`,
  );

  for (const trigger of report.churnTriggers) {
    switch (trigger.id) {
      case "slow-first-profit":
        recommendations.push(
          "Nyx/Vex: keep first-profit guidance visible until the first profitable sell closes.",
        );
        break;
      case "low-reward":
        recommendations.push(
          "Oracle/Nyx: raise safe-loop reward clarity before inviting this beta mix.",
        );
        break;
      case "heat-anxiety":
        recommendations.push(
          "Oracle/Vex: tune Heat warning copy and raid expectations before event cohorts.",
        );
        break;
      case "low-agency":
        recommendations.push(
          "Nyx: add a clearer next-best action when median completed trades fall below persona expectations.",
        );
        break;
      case "action-fatigue":
        recommendations.push(
          "Nyx/Oracle: watch high-frequency loops for fatigue; keep progress summaries visible.",
        );
        break;
      case "no-trade-risk":
        recommendations.push(
          "Vex/Axiom: treat no-trade sessions as onboarding blockers and reproduce the route.",
        );
        break;
      case "unstable-state":
        recommendations.push(
          "Ghost/Rune: block beta until impossible states are removed from the simulation.",
        );
        break;
    }
  }

  if (deriveRetentionStatus(report) !== "fail" && report.estimatedD1ReturnFraction >= 0.64) {
    recommendations.push(
      "Hydra: keep this first-20 cohort as a regression fixture after economy or tutorial changes.",
    );
  }

  return unique(recommendations);
}

function weightedCurrency(values: readonly { value: number; weight: number }[]): number {
  const totalWeight = sum(values.map((entry) => entry.weight));
  if (totalWeight <= 0) {
    return 0;
  }
  return roundCurrency(sum(values.map((entry) => entry.value * entry.weight)) / totalWeight);
}

function weightedFraction(values: readonly { value: number; weight: number }[]): number {
  const totalWeight = sum(values.map((entry) => entry.weight));
  if (totalWeight <= 0) {
    return 0;
  }
  return roundFraction(sum(values.map((entry) => entry.value * entry.weight)) / totalWeight);
}

function roundRatio(numerator: number, denominator: number): number {
  if (denominator <= 0) {
    return 0;
  }
  return roundFraction(numerator / denominator);
}

function roundFraction(value: number): number {
  return Math.round(value * 10_000) / 10_000;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

function pct(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values));
}
