import {
  formatAllArchetypeReports,
  PLAYER_ARCHETYPES,
  runPlayerArchetypeReport,
  type ArchetypeReport,
  type PlayerArchetype,
  type PlayerArchetypeId,
} from "@/engine/player-archetypes";

// oracle-p0-006: Tuned archetype parameter set derived from oracle-p0-005 baseline analysis.
// Changes relative to oracle-p0-005 baseline:
//   cautious-grinder : VBLM qty 10→15, profitTargetPct 0.003→0.005 (baseline medianPnl 6.13 too low)
//   heat-seeker      : profitTargetPct 0.012→0.010 (fix 1/200 non-profitable edge case)
//   speed-runner     : qty [5,5,5]→[8,8,8] (amplify frequency advantage, baseline medianPnl 8.43)
//   momentum-trader  : no p0-006 numeric change; oracle-p1-009 admits GLCH into the shared medium-risk mix
export const BETA_TUNED_ARCHETYPES: readonly PlayerArchetype[] = [
  {
    id: "cautious-grinder",
    label: "Cautious Grinder",
    description:
      "Low-risk positions in very-low/low heat commodities; prioritises capital preservation over aggressive PnL",
    tickers: ["VBLM", "NGLS", "MTRX"],
    quantities: [15, 10, 5],
    profitTargetPct: 0.005,
    stopLossPct: 0.02,
    maxHoldTicks: 4,
    maxEntryHeat: 20,
    maxClosedPositions: 12,
  },
  {
    id: "momentum-trader",
    label: "Momentum Trader",
    description:
      "Medium-risk positions following price momentum in mid-volatility commodities, including GLCH drift exposure; balanced heat/PnL profile",
    tickers: ["PGAS", "GLCH", "ORRS", "SNPS"],
    quantities: [25, 10, 10, 10],
    profitTargetPct: 0.007,
    stopLossPct: 0.028,
    maxHoldTicks: 3,
    maxEntryHeat: 50,
    maxClosedPositions: 8,
  },
  {
    id: "heat-seeker",
    label: "Heat Seeker",
    description:
      "High-risk contraband positions; tolerates elevated heat and raid exposure in pursuit of larger per-trade PnL",
    tickers: ["FDST", "AETH", "BLCK"],
    quantities: [10, 25, 5],
    profitTargetPct: 0.01,
    stopLossPct: 0.045,
    maxHoldTicks: 4,
    maxEntryHeat: 58,
    maxClosedPositions: 6,
  },
  {
    id: "speed-runner",
    label: "Speed Runner",
    description:
      "High-frequency scalping across safe commodities; maximises completed trade cycles per session over per-trade margin",
    tickers: ["VBLM", "MTRX", "PGAS"],
    quantities: [8, 8, 8],
    profitTargetPct: 0.003,
    stopLossPct: 0.018,
    maxHoldTicks: 3,
    maxEntryHeat: 38,
    maxClosedPositions: 20,
  },
];

export interface BetaTuningDelta {
  archetypeId: PlayerArchetypeId;
  changes: string[];
  rationale: string;
}

export const BETA_TUNING_DELTAS: readonly BetaTuningDelta[] = [
  {
    archetypeId: "cautious-grinder",
    changes: ["quantities[0] (VBLM) 10→15", "profitTargetPct 0.003→0.005"],
    rationale:
      "Baseline median PnL was 6.13 — too low to reward patient play. Larger VBLM position and a modestly higher profit target improve per-trade returns while preserving the zero-heat-risk profile.",
  },
  {
    archetypeId: "momentum-trader",
    changes: [],
    rationale:
      "No oracle-p0-006 numeric tuning change. Baseline already passed the dominant post-tutorial pattern, and oracle-p1-009 now routes that same medium-risk strategy through GLCH drift exposure.",
  },
  {
    archetypeId: "heat-seeker",
    changes: ["profitTargetPct 0.012→0.010"],
    rationale:
      "Baseline had 1/200 non-profitable sessions (99.5%). Lowering the profit target from 1.2% to 1.0% makes the target reachable in more tick windows on volatile commodities, addressing the edge-case failure without changing the risk profile.",
  },
  {
    archetypeId: "speed-runner",
    changes: ["quantities [5,5,5]→[8,8,8]"],
    rationale:
      "Baseline: 22 trades per session but only 8.43 median PnL (≈0.38 per trade). Larger positions (60% increase) amplify the frequency advantage — the fast-cycling character is preserved but each cycle returns more 0BOL.",
  },
];

export interface BetaTuningComparison {
  archetypeId: PlayerArchetypeId;
  baseline: ArchetypeReport;
  tuned: ArchetypeReport;
  delta: BetaTuningDelta;
  pnlDelta: number;
  passedBaseline: boolean;
  passedTuned: boolean;
}

export function runBetaTunedArchetypes(input?: {
  seedCount?: number;
  ticks?: number;
}): ArchetypeReport[] {
  return BETA_TUNED_ARCHETYPES.map((archetype) =>
    runPlayerArchetypeReport(archetype, input),
  );
}

export function runBetaTuningComparisons(input?: {
  seedCount?: number;
  ticks?: number;
}): BetaTuningComparison[] {
  return BETA_TUNED_ARCHETYPES.map((tuned) => {
    const baselineArchetype = PLAYER_ARCHETYPES.find((a) => a.id === tuned.id)!;
    const baseline = runPlayerArchetypeReport(baselineArchetype, input);
    const tunedReport = runPlayerArchetypeReport(tuned, input);
    const delta = BETA_TUNING_DELTAS.find((d) => d.archetypeId === tuned.id)!;
    return {
      archetypeId: tuned.id,
      baseline,
      tuned: tunedReport,
      delta,
      pnlDelta: tunedReport.medianPnl - baseline.medianPnl,
      passedBaseline: baseline.passed,
      passedTuned: tunedReport.passed,
    };
  });
}

export function formatBetaTuningComparison(comparison: BetaTuningComparison): string {
  const sign = comparison.pnlDelta >= 0 ? "+" : "";
  return [
    `BETA-TUNING ${comparison.archetypeId}`,
    `Changes: ${comparison.delta.changes.length > 0 ? comparison.delta.changes.join(", ") : "none"}`,
    `Rationale: ${comparison.delta.rationale}`,
    `baseline: medianPnl=${comparison.baseline.medianPnl.toFixed(2)} profitable=${(comparison.baseline.profitableSessionFraction * 100).toFixed(1)}% ${comparison.passedBaseline ? "PASS" : "FAIL"}`,
    `tuned:    medianPnl=${comparison.tuned.medianPnl.toFixed(2)} profitable=${(comparison.tuned.profitableSessionFraction * 100).toFixed(1)}% ${comparison.passedTuned ? "PASS" : "FAIL"}`,
    `delta:    pnl=${sign}${comparison.pnlDelta.toFixed(2)}`,
  ].join("\n");
}

export function formatAllBetaTuningComparisons(comparisons: BetaTuningComparison[]): string {
  return comparisons.map(formatBetaTuningComparison).join("\n\n");
}

export function formatBetaTunedArchetypeReports(reports: ArchetypeReport[]): string {
  return formatAllArchetypeReports(reports);
}
