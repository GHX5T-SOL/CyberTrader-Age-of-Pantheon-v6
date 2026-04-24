import {
  applyFlashEventPriceModifiers,
  createFlashEvent,
  getFlashCourierCostMultiplier,
  updateFlashEvent,
} from "../flash-events";

describe("flash events", () => {
  it("creates deterministic timed events and expires them", () => {
    const event = createFlashEvent({ nowMs: 1000, seed: "test", index: 1 });

    expect(event.endTimestamp).toBeGreaterThan(event.startTimestamp);
    expect(updateFlashEvent(event, event.endTimestamp + 1)).toBeNull();
  });

  it("applies flash crash price recovery", () => {
    const event = {
      id: "whale",
      type: "flash_crash" as const,
      headline: "dump",
      description: "dump",
      ticker: "FDST",
      startTimestamp: 0,
      endTimestamp: 240000,
      modifierApplied: true,
      riskLevel: "medium" as const,
    };

    const early = applyFlashEventPriceModifiers({
      prices: { FDST: 100 },
      event,
      locationId: "neon_plaza",
      nowMs: 0,
      tick: 1,
    });
    const late = applyFlashEventPriceModifiers({
      prices: { FDST: 100 },
      event,
      locationId: "neon_plaza",
      nowMs: 240000,
      tick: 1,
    });

    expect(early.FDST).toBe(65);
    expect(late.FDST).toBe(100);
  });

  it("doubles courier cost during gang takeover", () => {
    expect(
      getFlashCourierCostMultiplier({
        id: "gang",
        type: "gang_takeover",
        headline: "gang",
        description: "gang",
        startTimestamp: 0,
        endTimestamp: 100,
        modifierApplied: true,
        riskLevel: "high",
      }),
    ).toBe(2);
  });
});
