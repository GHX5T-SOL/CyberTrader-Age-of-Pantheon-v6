import { LocalAuthority } from "@/authority/local-authority";

const STARTED_AT = "2077-04-01T00:00:00.000Z";

async function createReplaySnapshot(seed: string) {
  const authority = new LocalAuthority({ seed, startedAt: STARTED_AT });
  const profile = await authority.createProfile({
    walletAddress: null,
    devIdentity: `${seed}_dev`,
    eidolonHandle: seed.toUpperCase().slice(0, 16),
    osTier: "PIRATE",
    rank: 1,
    faction: null,
  });

  await authority.getTickPrices(0);
  await authority.executeTrade({
    playerId: profile.id,
    ticker: "VBLM",
    side: "BUY",
    quantity: 10,
  });
  await authority.getTickPrices(1);
  await authority.getTickPrices(2);

  const [openPosition] = await authority.getOpenPositions(profile.id);
  if (!openPosition) {
    throw new Error("Expected an open position after buy");
  }

  await authority.executeTrade({
    playerId: profile.id,
    ticker: "VBLM",
    side: "SELL",
    quantity: openPosition.quantity,
  });

  const [ledger, resources, positions, rank, news, finalPrices] = await Promise.all([
    authority.getLedger(profile.id),
    authority.getResources(profile.id),
    authority.getOpenPositions(profile.id),
    authority.getRank(profile.id),
    authority.getActiveNews(2),
    authority.getTickPrices(3),
  ]);

  return {
    profile,
    ledger,
    resources,
    positions,
    rank,
    news,
    finalPrices,
  };
}

describe("LocalAuthority", () => {
  it("round-trips the first trade loop through authority state", async () => {
    const authority = new LocalAuthority({ seed: "trade-loop", startedAt: STARTED_AT });
    const profile = await authority.createProfile({
      walletAddress: null,
      devIdentity: "trade_loop_dev",
      eidolonHandle: "TRADE_LOOP",
      osTier: "PIRATE",
      rank: 1,
      faction: null,
    });

    const initialPrices = await authority.getTickPrices(0);
    expect(initialPrices.VBLM).toBe(24);

    const buy = await authority.executeTrade({
      playerId: profile.id,
      ticker: "VBLM",
      side: "BUY",
      quantity: 10,
    });

    const resourcesAfterBuy = await authority.getResources(profile.id);
    const positionsAfterBuy = await authority.getOpenPositions(profile.id);
    const ledgerAfterBuy = await authority.getLedger(profile.id);

    expect(buy.ledger).toHaveLength(1);
    expect(buy.resources.heat).toBeGreaterThan(6);
    expect(buy.rank.level).toBe(1);
    expect(buy.xpGained).toBe(0);
    expect(ledgerAfterBuy).toHaveLength(2);
    expect(resourcesAfterBuy.energySeconds).toBe(72 * 60 * 60 - 90);
    expect(positionsAfterBuy[0]?.ticker).toBe("VBLM");
    expect(positionsAfterBuy[0]?.quantity).toBe(10);

    await authority.getTickPrices(2);
    const sell = await authority.executeTrade({
      playerId: profile.id,
      ticker: "VBLM",
      side: "SELL",
      quantity: 10,
    });

    const resourcesAfterSell = await authority.getResources(profile.id);
    const positionsAfterSell = await authority.getOpenPositions(profile.id);
    const ledgerAfterSell = await authority.getLedger(profile.id);

    expect(sell.position.quantity).toBe(0);
    expect(sell.xpGained).toBeGreaterThanOrEqual(5);
    expect(positionsAfterSell).toHaveLength(0);
    expect(ledgerAfterSell).toHaveLength(3);
    expect(resourcesAfterSell.energySeconds).toBe(72 * 60 * 60 - 165);
    expect(ledgerAfterSell.at(-1)?.balanceAfter).toBeGreaterThan(ledgerAfterBuy.at(-1)?.balanceAfter ?? 0);
  });

  it("enforces inventory slots for new tickers", async () => {
    const authority = new LocalAuthority({ seed: "slot-limit", startedAt: STARTED_AT });
    const profile = await authority.createProfile({
      walletAddress: null,
      devIdentity: "slot_dev",
      eidolonHandle: "SLOTS",
      osTier: "PIRATE",
      rank: 1,
      faction: null,
    });

    for (const ticker of ["FDST", "PGAS", "NGLS", "HXMD", "VBLM"]) {
      await authority.executeTrade({ playerId: profile.id, ticker, side: "BUY", quantity: 1 });
    }

    await expect(
      authority.executeTrade({ playerId: profile.id, ticker: "ORRS", side: "BUY", quantity: 1 }),
    ).rejects.toThrow("INVENTORY FULL");
  });

  it("replays the same outcome for 1000 seeds", async () => {
    for (let index = 0; index < 1000; index += 1) {
      const seed = `seed-${index}`;
      const firstRun = await createReplaySnapshot(seed);
      const secondRun = await createReplaySnapshot(seed);

      expect(firstRun).toEqual(secondRun);
    }
  });

  it("restores from snapshot and keeps the loop intact", async () => {
    const original = new LocalAuthority({ seed: "snapshot-loop", startedAt: STARTED_AT });
    const profile = await original.createProfile({
      walletAddress: null,
      devIdentity: "snapshot_dev",
      eidolonHandle: "SNAPSHOT",
      osTier: "PIRATE",
      rank: 1,
      faction: null,
    });

    await original.getTickPrices(0);
    await original.executeTrade({
      playerId: profile.id,
      ticker: "VBLM",
      side: "BUY",
      quantity: 10,
    });
    await original.getTickPrices(3);

    const restored = LocalAuthority.fromSnapshot(original.exportSnapshot());

    await expect(restored.getLedger(profile.id)).resolves.toEqual(
      await original.getLedger(profile.id),
    );
    await expect(restored.getOpenPositions(profile.id)).resolves.toEqual(
      await original.getOpenPositions(profile.id),
    );
    await expect(restored.getResources(profile.id)).resolves.toEqual(
      await original.getResources(profile.id),
    );
    await expect(restored.getTickPrices(4)).resolves.toEqual(
      await original.getTickPrices(4),
    );
  });

  it("persists a rank-5 AgentOS faction choice into authority snapshots", async () => {
    const authority = new LocalAuthority({ seed: "faction-choice", startedAt: STARTED_AT });
    const profile = await authority.createProfile({
      walletAddress: null,
      devIdentity: "faction_dev",
      eidolonHandle: "FACTION",
      osTier: "PIRATE",
      rank: 1,
      faction: null,
    });

    await expect(authority.chooseFaction(profile.id, "BLACKWAKE")).rejects.toThrow("AGENTOS LOCKED");

    await authority.updateXp(profile.id, 2000, "test_rank_5");
    const updated = await authority.chooseFaction(profile.id, "BLACKWAKE");

    expect(updated).toMatchObject({
      osTier: "AGENT",
      faction: "BLACKWAKE",
      rank: 5,
    });

    const restored = LocalAuthority.fromSnapshot(authority.exportSnapshot());
    await expect(restored.getProfile(profile.id)).resolves.toMatchObject({
      osTier: "AGENT",
      faction: "BLACKWAKE",
    });
  });
});
