import { LOCATIONS, getLocation, getUnlockedLocations } from "@/data/locations";
import { seededStream } from "@/engine/prng";
import type { DistrictState, DistrictStateRecord } from "@/engine/types";

const SHIFT_STATES: Exclude<DistrictState, "NORMAL">[] = ["BOOM", "LOCKDOWN", "BLACKOUT"];

export function createInitialDistrictStates(nowMs: number): Record<string, DistrictStateRecord> {
  return Object.fromEntries(
    LOCATIONS.map((location) => [
      location.id,
      {
        locationId: location.id,
        state: "NORMAL" as const,
        startTimestamp: nowMs,
        endTimestamp: Number.MAX_SAFE_INTEGER,
      },
    ]),
  );
}

export function getNextDistrictShiftDelay(seed: string, index: number): number {
  const stream = seededStream(`${seed}:district-delay:${index}`);
  return (15 + Math.floor(stream() * 11)) * 60_000;
}

export function createDistrictShift(input: {
  nowMs: number;
  seed: string;
  index: number;
}): DistrictStateRecord {
  const stream = seededStream(`${input.seed}:district:${input.index}`);
  const locations = getUnlockedLocations();
  const location = locations[Math.floor(stream() * locations.length)] ?? locations[0]!;
  const state = SHIFT_STATES[Math.floor(stream() * SHIFT_STATES.length)] ?? "BOOM";
  const minutes =
    state === "BOOM"
      ? 5 + Math.floor(stream() * 6)
      : state === "LOCKDOWN"
        ? 3 + Math.floor(stream() * 6)
        : 2 + Math.floor(stream() * 4);

  return {
    locationId: location.id,
    state,
    startTimestamp: input.nowMs,
    endTimestamp: input.nowMs + minutes * 60_000,
  };
}

export function normalizeDistrictStates(
  states: Record<string, DistrictStateRecord>,
  nowMs: number,
): Record<string, DistrictStateRecord> {
  let normalized = states;
  for (const location of LOCATIONS) {
    const current = normalized[location.id];
    if (!current || (current.state !== "NORMAL" && nowMs >= current.endTimestamp)) {
      if (normalized === states) {
        normalized = { ...states };
      }
      normalized[location.id] = {
        locationId: location.id,
        state: "NORMAL",
        startTimestamp: nowMs,
        endTimestamp: Number.MAX_SAFE_INTEGER,
      };
    }
  }

  return normalized;
}

export function getActiveDistrictState(
  states: Record<string, DistrictStateRecord>,
  locationId: string,
  nowMs: number,
): DistrictStateRecord {
  const location = getLocation(locationId);
  const state = states[location.id];
  if (!state || (state.state !== "NORMAL" && nowMs >= state.endTimestamp)) {
    return {
      locationId: location.id,
      state: "NORMAL",
      startTimestamp: nowMs,
      endTimestamp: Number.MAX_SAFE_INTEGER,
    };
  }

  return state;
}

export function getDistrictPriceMultiplier(state: DistrictState): number {
  return state === "BOOM" ? 1.15 : 1;
}

export function getDistrictCourierTimeMultiplier(state: DistrictState): number {
  if (state === "BOOM") {
    return 0.5;
  }
  if (state === "LOCKDOWN") {
    return 2;
  }
  return 1;
}

export function isDistrictTradingBlocked(state: DistrictState): boolean {
  return state === "LOCKDOWN" || state === "BLACKOUT";
}

export function districtAnnouncement(record: DistrictStateRecord): string {
  const location = getLocation(record.locationId);
  if (record.state === "BOOM") {
    return `${location.name} BOOM: prices rising and couriers moving fast.`;
  }
  if (record.state === "LOCKDOWN") {
    return `${location.name} LOCKDOWN: trading frozen, couriers delayed.`;
  }
  if (record.state === "BLACKOUT") {
    return `${location.name} BLACKOUT: actions disabled except travel away.`;
  }
  return `${location.name} returned to normal.`;
}
