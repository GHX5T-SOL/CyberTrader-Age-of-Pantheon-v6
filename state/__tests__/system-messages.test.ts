import {
  getSafeFailureMessage,
  isPlayerFacingMessageSafe,
  type SafeFailureContext,
} from "@/state/system-messages";

const CONTEXTS: SafeFailureContext[] = [
  "provision",
  "trade-buy",
  "trade-sell",
  "energy",
  "heat",
  "courier",
  "shipment",
  "challenge",
];

describe("player-facing system messages", () => {
  it("uses safe contextual copy for failed actions", () => {
    for (const context of CONTEXTS) {
      const message = getSafeFailureMessage(context);

      expect(message).toMatch(/^\[sys\]/);
      expect(isPlayerFacingMessageSafe(message)).toBe(true);
    }
  });

  it("detects raw backend or secret-like text before it reaches UI copy", () => {
    expect(isPlayerFacingMessageSafe("[sys] Supabase rpc failed with service_role token")).toBe(false);
    expect(isPlayerFacingMessageSafe("[sys] buy order rejected safely. refresh the quote and retry.")).toBe(true);
  });
});
