import { getLocation, getUnlockedLocations } from "@/data/locations";
import { DEMO_COMMODITIES, roundCurrency, type PriceMap } from "@/engine/demo-market";
import { seededStream } from "@/engine/prng";
import type { FlashEvent, FlashEventType } from "@/engine/types";

const FLASH_TYPES: FlashEventType[] = [
  "volatility_spike",
  "arbitrage_window",
  "eagent_scan",
  "district_blackout",
  "flash_crash",
  "gang_takeover",
];

export const FLASH_EVENT_COOLDOWN_MS = 2 * 60_000;
const BLACKOUT_WARNING_MS = 2 * 60_000;

export function getNextFlashEventDelay(seed: string, index: number): number {
  const stream = seededStream(`${seed}:flash-delay:${index}`);
  return (3 + Math.floor(stream() * 5)) * 60_000;
}

export function createFlashEvent(input: {
  nowMs: number;
  seed: string;
  index: number;
}): FlashEvent {
  const stream = seededStream(`${input.seed}:flash-event:${input.index}`);
  const type = FLASH_TYPES[Math.floor(stream() * FLASH_TYPES.length)] ?? "volatility_spike";
  const ticker = DEMO_COMMODITIES[Math.floor(stream() * DEMO_COMMODITIES.length)]?.ticker ?? "FDST";
  const location = getUnlockedLocations()[Math.floor(stream() * getUnlockedLocations().length)] ?? getUnlockedLocations()[0]!;
  const id = `flash_${input.nowMs}_${input.index}`;

  switch (type) {
    case "volatility_spike": {
      const duration = (90 + Math.floor(stream() * 91)) * 1000;
      const amplitude = roundCurrency(0.15 + stream() * 0.2);
      return {
        id,
        type,
        headline: `${ticker} VOLATILITY SPIKE`,
        description: `${getLocation(location.id).name} ${ticker} prices swinging wildly: +/-${Math.round(amplitude * 100)}% window.`,
        ticker,
        locationId: location.id,
        startTimestamp: input.nowMs,
        endTimestamp: input.nowMs + duration,
        modifierApplied: true,
        riskLevel: "high",
        amplitude,
      };
    }
    case "arbitrage_window": {
      const duration = (120 + Math.floor(stream() * 121)) * 1000;
      const multiplier = roundCurrency(1.5 + stream());
      return {
        id,
        type,
        headline: `${location.name} ARBITRAGE WINDOW`,
        description: `${location.name} buying ${ticker} at ${multiplier.toFixed(1)}x normal price. Move fast and sell there.`,
        ticker,
        locationId: location.id,
        startTimestamp: input.nowMs,
        endTimestamp: input.nowMs + duration,
        modifierApplied: true,
        riskLevel: "medium",
        multiplier,
      };
    }
    case "eagent_scan":
      return {
        id,
        type,
        headline: "eAGENT SCAN DETECTED",
        description: "90 seconds to reduce Heat below 50 or face a guaranteed raid.",
        startTimestamp: input.nowMs,
        endTimestamp: input.nowMs + 90_000,
        modifierApplied: true,
        riskLevel: "critical",
      };
    case "district_blackout": {
      const freezeDuration = (180 + Math.floor(stream() * 121)) * 1000;
      return {
        id,
        type,
        headline: `${location.name} BLACKOUT WARNING`,
        description: `${location.name} trading freezes after 2 minutes, then stays down for ${Math.round(freezeDuration / 60_000)} minutes.`,
        locationId: location.id,
        startTimestamp: input.nowMs,
        activationTimestamp: input.nowMs + BLACKOUT_WARNING_MS,
        endTimestamp: input.nowMs + BLACKOUT_WARNING_MS + freezeDuration,
        modifierApplied: false,
        riskLevel: "high",
      };
    }
    case "flash_crash":
      return {
        id,
        type,
        headline: `${ticker} FLASH CRASH`,
        description: `${ticker} drops 35% instantly and recovers linearly over 4 minutes.`,
        ticker,
        startTimestamp: input.nowMs,
        endTimestamp: input.nowMs + 4 * 60_000,
        modifierApplied: true,
        riskLevel: "medium",
        multiplier: 0.65,
      };
    case "gang_takeover":
    default:
      return {
        id,
        type: "gang_takeover",
        headline: `${location.name} GANG TAKEOVER`,
        description: `All courier costs dispatched from ${location.name} doubled for 8 minutes.`,
        locationId: location.id,
        startTimestamp: input.nowMs,
        endTimestamp: input.nowMs + 8 * 60_000,
        modifierApplied: true,
        riskLevel: "high",
        multiplier: 2,
      };
  }
}

export function updateFlashEvent(
  event: FlashEvent | null,
  nowMs: number,
): FlashEvent | null {
  if (!event || nowMs >= event.endTimestamp) {
    return null;
  }

  if (event.type === "district_blackout") {
    return {
      ...event,
      modifierApplied: nowMs >= (event.activationTimestamp ?? event.startTimestamp),
    };
  }

  return event;
}

export function applyFlashEventPriceModifiers(input: {
  prices: PriceMap;
  event: FlashEvent | null;
  locationId: string;
  nowMs: number;
  tick: number;
}): PriceMap {
  const event = input.event;
  if (!event?.modifierApplied) {
    return input.prices;
  }

  if (event.type === "arbitrage_window" && event.locationId === input.locationId && event.ticker) {
    return {
      ...input.prices,
      [event.ticker]: roundCurrency((input.prices[event.ticker] ?? 1) * (event.multiplier ?? 1.75)),
    };
  }

  if (event.type === "volatility_spike" && event.ticker && event.locationId === input.locationId) {
    const stream = seededStream(`${event.id}:vol:${input.tick}:${Math.floor(input.nowMs / 10_000)}`);
    const amplitude = event.amplitude ?? 0.25;
    const swing = (stream() - 0.5) * 2 * amplitude;
    return {
      ...input.prices,
      [event.ticker]: roundCurrency(Math.max(1, (input.prices[event.ticker] ?? 1) * (1 + swing))),
    };
  }

  if (event.type === "flash_crash" && event.ticker) {
    const progress = Math.min(1, Math.max(0, (input.nowMs - event.startTimestamp) / Math.max(1, event.endTimestamp - event.startTimestamp)));
    const multiplier = 0.65 + progress * 0.35;
    return {
      ...input.prices,
      [event.ticker]: roundCurrency(Math.max(1, (input.prices[event.ticker] ?? 1) * multiplier)),
    };
  }

  return input.prices;
}

export function getFlashCourierCostMultiplier(
  event: FlashEvent | null,
  locationId?: string,
): number {
  if (!event || event.type !== "gang_takeover" || !event.modifierApplied) {
    return 1;
  }
  return !locationId || event.locationId === locationId ? event.multiplier ?? 2 : 1;
}

export function isTradingBlockedByFlash(
  event: FlashEvent | null,
  locationId: string,
): boolean {
  return Boolean(
    event?.type === "district_blackout" &&
      event.modifierApplied &&
      event.locationId === locationId,
  );
}
