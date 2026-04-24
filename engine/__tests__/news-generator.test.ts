import { applyNewsToPrices, generateNewsForTick, getActiveNewsForTick } from "../news-generator";

describe("news generator", () => {
  it("fires on the 15-minute cadence", () => {
    expect(generateNewsForTick(29, "news-test")).toHaveLength(0);
    expect(generateNewsForTick(30, "news-test")).toHaveLength(1);
  });

  it("keeps active news available during its duration", () => {
    const [news] = generateNewsForTick(30, "duration-test");
    expect(news).toBeDefined();
    expect(getActiveNewsForTick(news!.tickPublished + 1, "duration-test")[0]?.id).toBe(news!.id);
  });

  it("applies temporary price multipliers", () => {
    const news = generateNewsForTick(30, "price-test");
    const prices: Record<string, number> = { FDST: 100, PGAS: 100, SNPS: 100, MTRX: 100, AETH: 100, BLCK: 100, NGLS: 100, HXMD: 100 };
    const next = applyNewsToPrices(prices, news);
    const changed = news[0]?.affectedTickers.some((ticker) => next[ticker] !== prices[ticker]);

    expect(changed).toBe(true);
  });
});
