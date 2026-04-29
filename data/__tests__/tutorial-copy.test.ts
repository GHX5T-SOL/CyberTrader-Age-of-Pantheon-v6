import { STORE_RISK_COPY_BLOCKLIST, TUTORIAL_STEPS } from "@/data/tutorial-copy";

describe("tutorial copy", () => {
  it("keeps the tutorial short and action oriented", () => {
    expect(TUTORIAL_STEPS).toHaveLength(8);
    expect(TUTORIAL_STEPS.join(" ")).toContain("BUY VBLM x15");
    expect(TUTORIAL_STEPS.join(" ")).toContain("WAIT FOR GREEN TAPE");
    expect(TUTORIAL_STEPS.join(" ")).toContain("SELL THE SAME LOT");
  });

  it("keeps first-session language store safe", () => {
    const joined = TUTORIAL_STEPS.join(" ").toLowerCase();

    for (const phrase of STORE_RISK_COPY_BLOCKLIST) {
      expect(joined).not.toContain(phrase);
    }
  });
});
