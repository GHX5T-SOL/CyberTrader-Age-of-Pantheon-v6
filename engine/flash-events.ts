import { getUnlockedLocations } from "@/data/locations";
import { DEMO_COMMODITIES, roundCurrency, type PriceMap } from "@/engine/demo-market";
import { seededStream } from "@/engine/prng";
import type { FlashEvent, FlashEventType } from "@/engine/types";

const FLASH_TYPES: FlashEventType[] = [
  "volatility_spike",
  "arbitrage_window",
  "eagent_proximity",
  "district_blackout",
  "whale_dump",
  "gang_takeover",
];

export const FLASH_EVENT_COOLDOWN_MS = 2 * 60_000;

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
  const duration = type === "arbitrage_window"
    ? 180_000
    : type === "eagent_proximity"
      ? 90_000
      : type === "district_blackout"
        ? 7 * 60_000
        : type === "whale_dump"
          ? 4 * 60_000
          : type === "gang_takeover"
            ? 8 * 60_000
            : (90 + Math.floor(stream() * 91)) * 1000;

  switch (type) {
    case "volatility_spike":
      return {
        id: `flash_${input.nowMs}_${input.index}`,
        type,
        headline: `${ticker} prices swinging wildly!`,
        description: `${ticker} random-walk amplitude tripled for ${Math.round(duration / 1000)} seconds.`,
        ticker,
        startTimestamp: input.nowMs,
        endTimestamp: input.nowMs + duration,
        modifierActive: true,
      };
    case "arbitrage_window":
      return {
        id: `flash_${input.nowMs}_${input.index}`,
        type,
        headline: `${location.name} prices crashed!`,
        description: "3 minutes to move goods before the window closes.",
        locationId: location.id,
        startTimestamp: input.nowMs,
        endTimestamp: input.nowMs + duration,
        modifierActive: true,
      };
    case "eagent_proximity":
      return {
        id: `flash_${input.nowMs}_${input.index}`,
        type,
        headline: "Scanner detected!",
        description: "90 seconds to reduce Heat below 50 or face a guaranteed raid.",
        startTimestamp: input.nowMs,
        endTimestamp: input.nowMs + duration,
        modifierActive: true,
      };
    case "district_blackout":
      return {
        id: `flash_${input.nowMs}_${input.index}`,
        type,
        headline: `${location.name} going dark.`,
        description: "Trading freezes after 2 minutes, then stays frozen for 5 minutes.",
        locationId: location.id,
        startTimestamp: input.nowMs,
        activationTimestamp: input.nowMs + 2 * 60_000,
        endTimestamp: input.nowMs + duration,
        modifierActive: false,
      };
    case "whale_dump":
      return {
        id: `flash_${input.nowMs}_${input.index}`,
        type,
        headline: `Someone's liquidating 50,000 ${ticker}.`,
        description: `${ticker} drops 35% instantly and recovers over 4 minutes.`,
        ticker,
        startTimestamp: input.nowMs,
        endTimestamp: input.nowMs + duration,
        modifierActive: true,
      };
    case "gang_takeover":
    default:
      return {
        id: `flash_${input.nowMs}_${input.index}`,
        type: "gang_takeover",
        headline: "Blackwake seized The Port route.",
        description: "All courier costs doubled for 8 minutes.",
        locationId: "the_port",
        startTimestamp: input.nowMs,
        endTimestamp: input.nowMs + duration,
        modifierActive: true,
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
      modifierActive: nowMs >= (event.activationTimestamp ?? event.startTimestamp),
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
  if (!event?.modifierActive) {
    return input.prices;
  }

  if (event.type === "arbitrage_window" && event.locationId === input.locationId) {
    return mapPrices(input.prices, (price) => price * 0.8);
  }

  if (event.type === "volatility_spike" && event.ticker) {
    const stream = seededStream(`${event.id}:vol:${input.tick}:${Math.floor(input.nowMs / 10_000)}`);
    const swing = (stream() - 0.5) * 0.6;
    return {
      ...input.prices,
      [event.ticker]: roundCurrency(Math.max(1, (input.prices[event.ticker] ?? 1) * (1 + swing))),
    };
  }

  if (event.type === "whale_dump" && event.ticker) {
    const progress = Math.min(1, Math.max(0, (input.nowMs - event.startTimestamp) / Math.max(1, event.endTimestamp - event.startTimestamp)));
    const multiplier = 0.65 + progress * 0.35;
    return {
      ...input.prices,
      [event.ticker]: roundCurrency(Math.max(1, (input.prices[event.ticker] ?? 1) * multiplier)),
    };
  }

  return input.prices;
}

export function getFlashCourierCostMultiplier(event: FlashEvent | null): number {
  return event?.type === "gang_takeover" && event.modifierActive ? 2 : 1;
}

export function isTradingBlockedByFlash(
  event: FlashEvent | null,
  locationId: string,
): boolean {
  return Boolean(
    event?.type === "district_blackout" &&
      event.modifierActive &&
      event.locationId === locationId,
  );
}

function mapPrices(prices: PriceMap, mapper: (price: number) => number): PriceMap {
  return Object.fromEntries(
    Object.entries(prices).map(([ticker, price]) => [ticker, roundCurrency(Math.max(1, mapper(price)))]),
  );
}
