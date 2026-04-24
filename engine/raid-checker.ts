import { seededStream } from "@/engine/prng";
import type { Position } from "@/engine/types";

export interface RaidResult {
  triggered: boolean;
  losses: Record<string, number>;
  lossPercent: number;
  xpBonus: number;
  message: string;
}

export function checkRaid(input: {
  seed?: string;
  tick: number;
  heat: number;
  positions: Record<string, Position>;
}): RaidResult {
  if (input.tick <= 0 || input.tick % 60 !== 0 || input.heat <= 0) {
    return emptyRaid();
  }

  const stream = seededStream(`${input.seed ?? "phase1-local"}:raid:${input.tick}:${input.heat}`);
  const probability = Math.min(0.5, Math.max(0, input.heat / 200));
  if (stream() > probability) {
    return emptyRaid();
  }

  const lossPercent = 0.2 + stream() * 0.4;
  const losses: Record<string, number> = {};
  for (const [ticker, position] of Object.entries(input.positions)) {
    const quantity = Math.max(1, Math.floor(position.quantity * lossPercent));
    if (quantity > 0) {
      losses[ticker] = quantity;
    }
  }

  return {
    triggered: Object.keys(losses).length > 0,
    losses,
    lossPercent,
    xpBonus: 100,
    message: "ALERT: eAgent RAID! Lost some stock.",
  };
}

function emptyRaid(): RaidResult {
  return {
    triggered: false,
    losses: {},
    lossPercent: 0,
    xpBonus: 0,
    message: "",
  };
}
