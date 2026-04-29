import { roundCurrency } from "@/engine/demo-market";
import {
  runAllRetentionScenarios,
  type ChurnTriggerId,
  type RetentionPlayerArchetypeId,
  type RetentionScenarioId,
  type RetentionScenarioReport,
} from "@/engine/retention-scenarios";

export type RetentionTuningOwner = "nyx" | "oracle" | "vex" | "axiom" | "rune";
export type RetentionTuningPriority = "P1" | "P2";

interface RetentionTuningRecipe {
  owner: RetentionTuningOwner;
  secondaryOwners: readonly RetentionTuningOwner[];
  priority: RetentionTuningPriority;
  objective: string;
  implementationCue: string;
  successMetric: string;
}

export interface RetentionTriggerAggregate {
  id: ChurnTriggerId;
  affectedPlayerSlots: number;
  scenarioIds: RetentionScenarioId[];
  personaIds: RetentionPlayerArchetypeId[];
  reasons: string[];
}

export interface RetentionTuningAction {
  id: string;
  triggerId: ChurnTriggerId;
  owner: RetentionTuningOwner;
  secondaryOwners: RetentionTuningOwner[];
  priority: RetentionTuningPriority;
  affectedPlayerSlots: number;
  scenarioIds: RetentionScenarioId[];
  personaIds: RetentionPlayerArchetypeId[];
  objective: string;
  implementationCue: string;
  successMetric: string;
}

export interface RetentionTuningHandoff {
  id: "hydra-p1-003";
  label: string;
  generatedFromScenarioCount: number;
  scenarioIds: RetentionScenarioId[];
  watchScenarioIds: RetentionScenarioId[];
  averageD1ReturnFraction: number;
  minD1ReturnFraction: number;
  impossibleStateCount: number;
  topTriggers: RetentionTriggerAggregate[];
  actions: RetentionTuningAction[];
  acceptanceCriteria: string[];
}

const TRIGGER_PRIORITY: readonly ChurnTriggerId[] = [
  "unstable-state",
  "low-reward",
  "slow-first-profit",
  "heat-anxiety",
  "action-fatigue",
  "low-agency",
  "no-trade-risk",
];

const TUNING_RECIPES: Record<ChurnTriggerId, RetentionTuningRecipe> = {
  "action-fatigue": {
    owner: "nyx",
    secondaryOwners: ["oracle", "vex"],
    priority: "P1",
    objective:
      "Reduce high-frequency loop fatigue without removing the speed-runner fantasy.",
    implementationCue:
      "Add a short-session progress summary and next-best-action beat after repeated closes before changing live economy constants.",
    successMetric:
      "Action-fatigue affects fewer than 8 weighted player slots in balanced-first-week and short-session-return.",
  },
  "heat-anxiety": {
    owner: "vex",
    secondaryOwners: ["oracle"],
    priority: "P1",
    objective:
      "Make Heat escalation and raid expectations legible before contraband or event cohorts spike anxiety.",
    implementationCue:
      "Surface a compact Heat ladder, contraband warning, and safe fallback lane on mission/terminal pressure surfaces.",
    successMetric:
      "Risk-event-pulse stays watch-or-better with heat-anxiety under 7 weighted player slots.",
  },
  "low-reward": {
    owner: "oracle",
    secondaryOwners: ["nyx"],
    priority: "P1",
    objective:
      "Raise perceived safe-loop payoff for tutorial-heavy cohorts without creating impossible states.",
    implementationCue:
      "Test a first-profit reward clarity patch before increasing starter lot size or target percentages.",
    successMetric:
      "Tutorial-friction keeps estimated D1 return at or above 72% and low-reward under 8 weighted player slots.",
  },
  "slow-first-profit": {
    owner: "nyx",
    secondaryOwners: ["vex"],
    priority: "P1",
    objective:
      "Keep first profitable sell timing obvious for players entering the medium-risk upgrade lane.",
    implementationCue:
      "Hold first-profit guidance on screen until the first green sale closes, especially when PGAS/GLCH is sampled early.",
    successMetric:
      "Median first profitable sell stays within each persona threshold in tutorial-friction.",
  },
  "low-agency": {
    owner: "nyx",
    secondaryOwners: ["vex"],
    priority: "P2",
    objective:
      "Give low-activity players a clearer next action before they stall out.",
    implementationCue:
      "Promote one explicit next command in the Oracle cue and Help terminal when median completed trades fall below expectation.",
    successMetric:
      "No active first-20 scenario reports low-agency for more than 4 weighted player slots.",
  },
  "no-trade-risk": {
    owner: "axiom",
    secondaryOwners: ["vex"],
    priority: "P1",
    objective:
      "Treat no-trade sessions as route blockers rather than balance noise.",
    implementationCue:
      "Capture and reproduce any no-trade route with Axiom smoke data before economy tuning.",
    successMetric:
      "No first-20 scenario reports no-trade-risk after smoke and retention reruns.",
  },
  "unstable-state": {
    owner: "rune",
    secondaryOwners: ["oracle"],
    priority: "P1",
    objective:
      "Block beta tuning until impossible simulation states are removed.",
    implementationCue:
      "Reproduce the exact seed, patch the state transition, then rerun ship:check and retention:tuning.",
    successMetric:
      "Impossible state count is exactly 0 across all retention scenarios.",
  },
};

export function buildRetentionTuningHandoff(
  reports: readonly RetentionScenarioReport[] = runAllRetentionScenarios(),
): RetentionTuningHandoff {
  const scenarioIds = reports.map((report) => report.scenarioId);
  const topTriggers = aggregateTriggers(reports);
  const actions = topTriggers.map((trigger) => toAction(trigger));
  const minD1ReturnFraction =
    reports.length > 0
      ? roundFraction(Math.min(...reports.map((report) => report.estimatedD1ReturnFraction)))
      : 0;

  return {
    id: "hydra-p1-003",
    label: "Hydra retention trigger tuning handoff",
    generatedFromScenarioCount: reports.length,
    scenarioIds,
    watchScenarioIds: reports
      .filter((report) => report.status === "watch")
      .map((report) => report.scenarioId),
    averageD1ReturnFraction: weightedAverageD1(reports),
    minD1ReturnFraction,
    impossibleStateCount: sum(reports.map((report) => report.impossibleStateCount)),
    topTriggers,
    actions,
    acceptanceCriteria: [
      `Keep every first-20 retention scenario at or above ${pct(0.62)} estimated D1 return; current minimum is ${pct(minD1ReturnFraction)}.`,
      "Keep impossible state count at exactly 0 before any Nyx/Oracle/Vex tuning patch ships.",
      "Triage the top two weighted triggers before adding new beta cohorts or store-preview beats.",
      "Rerun npm run retention:tuning after economy, tutorial, mission, or Heat-warning changes.",
    ],
  };
}

export function formatRetentionTuningHandoff(handoff: RetentionTuningHandoff): string {
  const triggerLines =
    handoff.topTriggers.length > 0
      ? handoff.topTriggers.map(
          (trigger) =>
            `  - ${trigger.id} affectedSlots=${trigger.affectedPlayerSlots} scenarios=${trigger.scenarioIds.join(",")} personas=${trigger.personaIds.join(",")}`,
        )
      : ["  - none"];
  const actionLines =
    handoff.actions.length > 0
      ? handoff.actions.map(
          (action) =>
            [
              `  - ${action.id}`,
              `owner=${action.owner}`,
              `secondary=${action.secondaryOwners.join(",") || "none"}`,
              `priority=${action.priority}`,
              `affectedSlots=${action.affectedPlayerSlots}`,
              `success="${action.successMetric}"`,
            ].join(" "),
        )
      : ["  - none"];

  return [
    `HYDRA-TUNING ${handoff.id}`,
    `label=${handoff.label}`,
    `scenarios=${handoff.generatedFromScenarioCount} watch=${handoff.watchScenarioIds.join(",") || "none"} averageD1=${pct(handoff.averageD1ReturnFraction)} minD1=${pct(handoff.minD1ReturnFraction)} impossibleStates=${handoff.impossibleStateCount}`,
    "Top triggers:",
    ...triggerLines,
    "Nyx/Oracle/Vex handoff:",
    ...actionLines,
    "Acceptance:",
    ...handoff.acceptanceCriteria.map((criterion) => `  - ${criterion}`),
  ].join("\n");
}

function aggregateTriggers(
  reports: readonly RetentionScenarioReport[],
): RetentionTriggerAggregate[] {
  const buckets = new Map<
    ChurnTriggerId,
    {
      affectedPlayerSlots: number;
      scenarioIds: Set<RetentionScenarioId>;
      personaIds: Set<RetentionPlayerArchetypeId>;
      reasons: Set<string>;
    }
  >();

  for (const report of reports) {
    for (const trigger of report.churnTriggers) {
      const bucket =
        buckets.get(trigger.id) ??
        {
          affectedPlayerSlots: 0,
          scenarioIds: new Set<RetentionScenarioId>(),
          personaIds: new Set<RetentionPlayerArchetypeId>(),
          reasons: new Set<string>(),
        };

      bucket.affectedPlayerSlots += trigger.playerCount;
      bucket.scenarioIds.add(report.scenarioId);
      for (const reason of trigger.reasons) {
        bucket.reasons.add(reason);
      }
      for (const persona of report.personas) {
        if (persona.churnTriggers.some((entry) => entry.id === trigger.id)) {
          bucket.personaIds.add(persona.personaId);
        }
      }
      buckets.set(trigger.id, bucket);
    }
  }

  const scenarioOrder = reports.map((report) => report.scenarioId);

  return Array.from(buckets.entries())
    .map(([id, bucket]) => ({
      id,
      affectedPlayerSlots: bucket.affectedPlayerSlots,
      scenarioIds: sortScenarioIds(Array.from(bucket.scenarioIds), scenarioOrder),
      personaIds: Array.from(bucket.personaIds).sort(),
      reasons: Array.from(bucket.reasons).sort(),
    }))
    .sort(
      (a, b) =>
        b.affectedPlayerSlots - a.affectedPlayerSlots ||
        triggerRank(a.id) - triggerRank(b.id) ||
        a.id.localeCompare(b.id),
    );
}

function toAction(trigger: RetentionTriggerAggregate): RetentionTuningAction {
  const recipe = TUNING_RECIPES[trigger.id];

  return {
    id: `hydra-p1-003-${trigger.id}`,
    triggerId: trigger.id,
    owner: recipe.owner,
    secondaryOwners: [...recipe.secondaryOwners],
    priority: recipe.priority,
    affectedPlayerSlots: trigger.affectedPlayerSlots,
    scenarioIds: trigger.scenarioIds,
    personaIds: trigger.personaIds,
    objective: recipe.objective,
    implementationCue: recipe.implementationCue,
    successMetric: recipe.successMetric,
  };
}

function sortScenarioIds(
  ids: RetentionScenarioId[],
  order: readonly RetentionScenarioId[],
): RetentionScenarioId[] {
  return ids.sort((a, b) => order.indexOf(a) - order.indexOf(b));
}

function triggerRank(id: ChurnTriggerId): number {
  const index = TRIGGER_PRIORITY.indexOf(id);
  return index >= 0 ? index : TRIGGER_PRIORITY.length;
}

function weightedAverageD1(reports: readonly RetentionScenarioReport[]): number {
  const totalPlayers = sum(reports.map((report) => report.totalPlayers));
  if (totalPlayers <= 0) {
    return 0;
  }

  return roundFraction(
    sum(
      reports.map((report) => report.estimatedD1ReturnFraction * report.totalPlayers),
    ) / totalPlayers,
  );
}

function sum(values: readonly number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

function roundFraction(value: number): number {
  return Math.round(value * 10_000) / 10_000;
}

function pct(value: number): string {
  return `${roundCurrency(value * 100).toFixed(1)}%`;
}
