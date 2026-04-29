import {
  buildRetentionTuningHandoff,
  formatRetentionTuningHandoff,
  type RetentionTuningHandoff,
} from "../retention-tuning";
import { runAllRetentionScenarios } from "../retention-scenarios";

jest.setTimeout(120_000);

describe("hydra-p1-003 retention trigger tuning handoff", () => {
  let handoff: RetentionTuningHandoff;

  beforeAll(() => {
    handoff = buildRetentionTuningHandoff(runAllRetentionScenarios());
  });

  it("logs the tuning handoff when HYDRA_RETENTION_TUNING_LOG=1", () => {
    if (process.env.HYDRA_RETENTION_TUNING_LOG === "1") {
      console.info(formatRetentionTuningHandoff(handoff));
    }
  });

  it("is built from the four first-20 retention scenarios", () => {
    expect(handoff.generatedFromScenarioCount).toBe(4);
    expect(handoff.scenarioIds).toEqual([
      "balanced-first-week",
      "tutorial-friction",
      "risk-event-pulse",
      "short-session-return",
    ]);
    expect(handoff.watchScenarioIds).toEqual(handoff.scenarioIds);
    expect(handoff.impossibleStateCount).toBe(0);
    expect(handoff.minD1ReturnFraction).toBeGreaterThanOrEqual(0.62);
  });

  it("ranks action fatigue and heat anxiety as the dominant tuning triggers", () => {
    expect(handoff.topTriggers[0]?.id).toBe("action-fatigue");
    expect(handoff.topTriggers[0]?.affectedPlayerSlots).toBe(45);
    expect(handoff.topTriggers[1]?.id).toBe("heat-anxiety");
    expect(handoff.topTriggers[1]?.affectedPlayerSlots).toBe(30);
  });

  it("assigns Nyx, Oracle, and Vex deterministic follow-up actions", () => {
    const fatigue = handoff.actions.find((action) => action.triggerId === "action-fatigue");
    const heat = handoff.actions.find((action) => action.triggerId === "heat-anxiety");
    const reward = handoff.actions.find((action) => action.triggerId === "low-reward");

    expect(fatigue).toMatchObject({
      id: "hydra-p1-003-action-fatigue",
      owner: "nyx",
      priority: "P1",
    });
    expect(fatigue?.secondaryOwners).toEqual(["oracle", "vex"]);
    expect(heat).toMatchObject({
      id: "hydra-p1-003-heat-anxiety",
      owner: "vex",
      priority: "P1",
    });
    expect(heat?.secondaryOwners).toEqual(["oracle"]);
    expect(reward).toMatchObject({
      id: "hydra-p1-003-low-reward",
      owner: "oracle",
      priority: "P1",
    });
    expect(reward?.secondaryOwners).toEqual(["nyx"]);
  });

  it("keeps scenario and persona references attached to each action", () => {
    const heat = handoff.actions.find((action) => action.triggerId === "heat-anxiety")!;
    expect(heat.scenarioIds).toEqual([
      "balanced-first-week",
      "tutorial-friction",
      "risk-event-pulse",
      "short-session-return",
    ]);
    expect(heat.personaIds).toEqual(["contraband-tourist", "returning-casual"]);
    expect(heat.successMetric).toContain("Risk-event-pulse");
  });

  it("is deterministic for repeated runs", () => {
    const repeated = buildRetentionTuningHandoff(runAllRetentionScenarios());
    expect(repeated.topTriggers).toEqual(handoff.topTriggers);
    expect(repeated.actions).toEqual(handoff.actions);
    expect(repeated.acceptanceCriteria).toEqual(handoff.acceptanceCriteria);
  });

  it("formats a compact Hydra handoff for run logs and release notes", () => {
    const output = formatRetentionTuningHandoff(handoff);
    expect(output).toContain("HYDRA-TUNING hydra-p1-003");
    expect(output).toContain("Nyx/Oracle/Vex handoff:");
    expect(output).toContain("hydra-p1-003-action-fatigue owner=nyx");
    expect(output).toContain("hydra-p1-003-heat-anxiety owner=vex");
    expect(output).toContain("hydra-p1-003-low-reward owner=oracle");
  });
});
