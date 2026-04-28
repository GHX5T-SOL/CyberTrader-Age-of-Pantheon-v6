import { LOCATIONS, getLocation, getUnlockedLocations } from "@/data/locations";
import { seededStream } from "@/engine/prng";
import type { Commodity, DistrictState, DistrictStateRecord } from "@/engine/types";

const SHIFT_STATES: Exclude<DistrictState, "NORMAL">[] = [
  "BOOM",
  "LOCKDOWN",
  "BLACKOUT",
  "FESTIVAL",
  "GANG_CONTROL",
  "MARKET_CRASH",
];
const FESTIVAL_TICKERS = ["FDST", "PGAS", "NGLS", "HXMD", "VBLM", "ORRS", "SNPS", "MTRX", "AETH", "BLCK", "GLCH"] as const;

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
  const minutes = getDistrictDurationMinutes(state, stream);
  const festivalTicker = state === "FESTIVAL"
    ? FESTIVAL_TICKERS[Math.floor(stream() * FESTIVAL_TICKERS.length)] ?? "FDST"
    : undefined;

  return {
    locationId: location.id,
    state,
    startTimestamp: input.nowMs,
    endTimestamp: input.nowMs + minutes * 60_000,
    festivalTicker,
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

export function getDistrictPriceMultiplier(
  stateOrRecord: DistrictState | DistrictStateRecord,
  commodity?: Commodity,
  locationId?: string,
): number {
  const state = typeof stateOrRecord === "string" ? stateOrRecord : stateOrRecord.state;
  const festivalTicker = typeof stateOrRecord === "string" ? undefined : stateOrRecord.festivalTicker;

  if (state === "BOOM") {
    return 1.15;
  }
  if (state === "MARKET_CRASH") {
    return 0.8;
  }
  if (state === "FESTIVAL" && commodity?.ticker === festivalTicker) {
    return 1.25;
  }
  if (state === "GANG_CONTROL" && locationId === "black_market") {
    return 0.7;
  }
  return 1;
}

export function getDistrictCourierTimeMultiplier(state: DistrictState): number {
  return state === "BOOM" ? 0.5 : 1;
}

export function getDistrictCourierRiskBonus(state: DistrictState): number {
  if (state === "LOCKDOWN") {
    return 0.2;
  }
  return 0;
}

export function getDistrictCourierRiskMultiplier(state: DistrictState): number {
  return state === "GANG_CONTROL" ? 2 : 1;
}

export function isDistrictBuyRestricted(state: DistrictState): boolean {
  return state === "LOCKDOWN" || state === "BLACKOUT";
}

export function isDistrictSellRestricted(state: DistrictState): boolean {
  return state === "BLACKOUT";
}

export function isDistrictTradingBlocked(state: DistrictState): boolean {
  return state === "BLACKOUT";
}

export function districtAnnouncement(record: DistrictStateRecord): string {
  const location = getLocation(record.locationId);
  if (record.state === "BOOM") {
    return `${location.name} BOOM: sell prices rising and couriers moving fast.`;
  }
  if (record.state === "LOCKDOWN") {
    return `${location.name} LOCKDOWN: buys restricted, sells still open, courier risk up.`;
  }
  if (record.state === "BLACKOUT") {
    return `${location.name} BLACKOUT: actions disabled except travel away.`;
  }
  if (record.state === "FESTIVAL") {
    return `${location.name} FESTIVAL: ${record.festivalTicker ?? "select"} demand surging.`;
  }
  if (record.state === "GANG_CONTROL") {
    return `${location.name} GANG CONTROL: couriers are dangerous, black market deals improve.`;
  }
  if (record.state === "MARKET_CRASH") {
    return `${location.name} MARKET CRASH: prices down, NPC panic-buying.`;
  }
  return `${location.name} returned to normal.`;
}

function getDistrictDurationMinutes(
  state: Exclude<DistrictState, "NORMAL">,
  stream: () => number,
): number {
  if (state === "BOOM") {
    return 5 + Math.floor(stream() * 6);
  }
  if (state === "LOCKDOWN") {
    return 3 + Math.floor(stream() * 6);
  }
  if (state === "BLACKOUT") {
    return 2 + Math.floor(stream() * 4);
  }
  if (state === "FESTIVAL") {
    return 8 + Math.floor(stream() * 5);
  }
  if (state === "GANG_CONTROL") {
    return 6 + Math.floor(stream() * 5);
  }
  return 4 + Math.floor(stream() * 5);
}
