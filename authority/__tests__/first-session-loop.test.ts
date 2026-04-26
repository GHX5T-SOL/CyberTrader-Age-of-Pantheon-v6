import { LocalAuthority } from "@/authority/local-authority";
import {
  DEFAULT_TRADE_QUANTITY,
  FIRST_TRADE_HINT_TICKER,
} from "@/engine/demo-market";

const STARTED_AT = "2077-04-01T00:00:00.000Z";

describe("first-session profitable loop", () => {
  it("can close the starter VBLM position for profit within the guided tick window", async () => {
    const authority = new LocalAuthority({ seed: "nyx-first-session", startedAt: STARTED_AT });
    const profile = await authority.createProfile({
      walletAddress: null,
      devIdentity: "nyx_first_session",
      eidolonHandle: "NYX_FIRST",
      osTier: "PIRATE",
      rank: 1,
      faction: null,
    });

    await authority.executeTrade({
      playerId: profile.id,
      ticker: FIRST_TRADE_HINT_TICKER,
      side: "BUY",
      quantity: DEFAULT_TRADE_QUANTITY,
    });

    let profitableTick = 0;
    for (let tick = 1; tick <= 6; tick += 1) {
      await authority.getTickPrices(tick);
      const [openPosition] = await authority.getOpenPositions(profile.id);
      if ((openPosition?.unrealizedPnl ?? 0) > 0) {
        profitableTick = tick;
        break;
      }
    }

    expect(profitableTick).toBeGreaterThan(0);
    expect(profitableTick).toBeLessThanOrEqual(6);

    const sell = await authority.executeTrade({
      playerId: profile.id,
      ticker: FIRST_TRADE_HINT_TICKER,
      side: "SELL",
      quantity: DEFAULT_TRADE_QUANTITY,
    });
    const positions = await authority.getOpenPositions(profile.id);

    expect(sell.realizedPnl).toBeGreaterThan(0);
    expect(sell.xpGained).toBeGreaterThan(0);
    expect(positions).toHaveLength(0);
  });
});
