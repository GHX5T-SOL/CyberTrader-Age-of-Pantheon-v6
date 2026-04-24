import { seededStream } from "@/engine/prng";
import { roundCurrency } from "@/engine/demo-market";
import type { MarketNews } from "@/engine/types";

const NEWS_TEMPLATES = [
  {
    headline: "Rumor: Major club raid tonight in Neon Plaza.",
    body: "Phantom crate lanes are going quiet. Fractal Dust may dip before the sweep clears.",
    affectedTickers: ["FDST"],
    direction: "down" as const,
  },
  {
    headline: "Tech Valley data leak - Ghost Chips demand rising.",
    body: "Fabricators are buying signal-safe materials and neural routing substrate.",
    affectedTickers: ["SNPS", "MTRX"],
    direction: "up" as const,
  },
  {
    headline: "Port inspections tightening - Plutonion Gas supply shock.",
    body: "Orbital fuel brokers are hoarding tanks before launch-window audits.",
    affectedTickers: ["PGAS"],
    direction: "up" as const,
  },
  {
    headline: "The Slums courier route compromised.",
    body: "High-risk deliveries are spiking. Aether Tabs and Blacklight Serum are volatile.",
    affectedTickers: ["AETH", "BLCK"],
    direction: "up" as const,
  },
  {
    headline: "Archivist auction clears a Neon Glass vault.",
    body: "Memory-etched silica liquidity improves across the quiet lanes.",
    affectedTickers: ["NGLS"],
    direction: "down" as const,
  },
  {
    headline: "Black Market buyers want Helix Mud tonight.",
    body: "Biohack crews are paying a premium while eAgent eyes move elsewhere.",
    affectedTickers: ["HXMD"],
    direction: "up" as const,
  },
] as const;

export function generateNewsForTick(tick: number, seed = "phase1-local"): MarketNews[] {
  if (tick <= 0 || tick % 30 !== 0) {
    return [];
  }

  const stream = seededStream(`${seed}:news:${tick}`);
  const template = NEWS_TEMPLATES[Math.floor(stream() * NEWS_TEMPLATES.length)] ?? NEWS_TEMPLATES[0];
  const durationTicks = 3 + Math.floor(stream() * 6);
  const magnitude = 0.05 + stream() * 0.2;
  const priceMultiplier =
    template.direction === "up"
      ? roundCurrency(1 + magnitude)
      : roundCurrency(Math.max(0.75, 1 - magnitude));

  return [
    {
      id: `news_${seed}_${tick}_${template.affectedTickers.join("_").toLowerCase()}`,
      headline: template.headline,
      body: template.body,
      affectedTickers: [...template.affectedTickers],
      direction: template.direction,
      credibility: roundCurrency(0.5 + stream() * 0.5),
      priceMultiplier,
      tickPublished: tick,
      tickExpires: tick + durationTicks,
      durationTicks,
    },
  ];
}

export function getActiveNewsForTick(tick: number, seed = "phase1-local"): MarketNews[] {
  const start = Math.max(0, tick - 8);
  const active: MarketNews[] = [];

  for (let cursor = start; cursor <= tick; cursor += 1) {
    for (const news of generateNewsForTick(cursor, seed)) {
      if (news.tickPublished <= tick && news.tickExpires >= tick) {
        active.push(news);
      }
    }
  }

  return active.sort((left, right) => right.tickPublished - left.tickPublished);
}

export function applyNewsToPrices(
  prices: Record<string, number>,
  newsItems: MarketNews[],
): Record<string, number> {
  const nextPrices = { ...prices };

  for (const news of newsItems) {
    for (const ticker of news.affectedTickers) {
      const current = nextPrices[ticker];
      if (current !== undefined) {
        nextPrices[ticker] = roundCurrency(Math.max(1, current * news.priceMultiplier));
      }
    }
  }

  return nextPrices;
}
