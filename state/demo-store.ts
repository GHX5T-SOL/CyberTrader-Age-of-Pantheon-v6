import { create } from "zustand";
import {
  exportAuthoritySnapshot,
  getAuthority,
  resetConfiguredAuthority,
  restoreLocalAuthority,
} from "@/authority";
import {
  DEFAULT_TRADE_QUANTITY,
  DEMO_STARTING_BALANCE,
  FIRST_TRADE_HINT_TICKER,
  createInitialChanges,
  createInitialPrices,
  formatDelta,
  getCommodity,
  roundCurrency,
  type ChangeMap,
  type PriceMap,
} from "@/engine/demo-market";
import type { MarketNews, PlayerProfile, Position, Resources } from "@/engine/types";
import {
  clearDemoSession,
  loadDemoSession,
  saveDemoSession,
  type PersistedDemoSession,
} from "@/state/demo-storage";

export type DemoPhase = "boot" | "handle" | "terminal";
export type TerminalView = "home" | "market";

const INITIAL_PLAYER_RESOURCES: Resources = {
  energySeconds: 72 * 60 * 60,
  heat: 6,
  integrity: 82,
  stealth: 64,
  influence: 3,
};

interface DemoStoreState {
  phase: DemoPhase;
  activeView: TerminalView;
  handle: string;
  profile: PlayerProfile | null;
  playerId: string | null;
  tick: number;
  prices: PriceMap;
  changes: ChangeMap;
  priceHistory: Record<string, number[]>;
  balanceObol: number;
  resources: Resources;
  positions: Record<string, Position>;
  activeNews: MarketNews[];
  selectedTicker: string;
  orderSize: number;
  lastRealizedPnl: number | null;
  firstTradeComplete: boolean;
  systemMessage: string;
  isBusy: boolean;
  isHydrated: boolean;
}

interface DemoStoreActions {
  hydrateDemo: () => Promise<void>;
  moveToHandle: () => void;
  submitHandle: (rawHandle: string) => Promise<boolean>;
  openMarket: () => void;
  goHome: () => void;
  selectTicker: (ticker: string) => void;
  setOrderSize: (quantity: number) => void;
  advanceMarket: () => Promise<void>;
  buySelected: () => Promise<void>;
  sellSelected: () => Promise<void>;
  purchaseEnergyHour: () => Promise<void>;
  resetDemo: () => Promise<void>;
}

type DemoStore = DemoStoreState & DemoStoreActions;

function buildInitialState(): DemoStoreState {
  const prices = createInitialPrices();

  return {
    phase: "boot",
    activeView: "home",
    handle: "",
    profile: null,
    playerId: null,
    tick: 0,
    prices,
    changes: createInitialChanges(),
    priceHistory: buildInitialPriceHistory(prices),
    balanceObol: DEMO_STARTING_BALANCE,
    resources: { ...INITIAL_PLAYER_RESOURCES },
    positions: {},
    activeNews: [],
    selectedTicker: FIRST_TRADE_HINT_TICKER,
    orderSize: DEFAULT_TRADE_QUANTITY,
    lastRealizedPnl: null,
    firstTradeComplete: false,
    systemMessage: "[sys] you are awake. the deck is not yours.",
    isBusy: false,
    isHydrated: false,
  };
}

function sanitizeHandle(rawHandle: string): string {
  return rawHandle.trim().replace(/\s+/g, "_").slice(0, 16);
}

function buildChangeMap(currentPrices: PriceMap, nextPrices: PriceMap): ChangeMap {
  return Object.fromEntries(
    Object.entries(nextPrices).map(([ticker, nextPrice]) => [
      ticker,
      roundCurrency(nextPrice - (currentPrices[ticker] ?? nextPrice)),
    ]),
  );
}

function buildInitialPriceHistory(prices: PriceMap): Record<string, number[]> {
  return Object.fromEntries(Object.entries(prices).map(([ticker, price]) => [ticker, [price]]));
}

function appendPriceHistory(
  history: Record<string, number[]>,
  prices: PriceMap,
): Record<string, number[]> {
  return Object.fromEntries(
    Object.entries(prices).map(([ticker, price]) => [
      ticker,
      [...(history[ticker] ?? []), price].slice(-14),
    ]),
  );
}

function toPositionMap(positions: Position[]): Record<string, Position> {
  return Object.fromEntries(positions.map((position) => [position.ticker, position]));
}

function latestBalance(balanceObol: number, deltas: { balanceAfter: number }[]): number {
  return deltas.at(-1)?.balanceAfter ?? balanceObol;
}

function toPersistedSession(state: DemoStoreState): PersistedDemoSession {
  return {
    phase: state.phase,
    activeView: state.activeView,
    handle: state.handle,
    profile: state.profile,
    playerId: state.playerId,
    tick: state.tick,
    prices: state.prices,
    changes: state.changes,
    priceHistory: state.priceHistory,
    balanceObol: state.balanceObol,
    resources: state.resources,
    positions: state.positions,
    activeNews: state.activeNews,
    selectedTicker: state.selectedTicker,
    orderSize: state.orderSize,
    lastRealizedPnl: state.lastRealizedPnl,
    firstTradeComplete: state.firstTradeComplete,
    systemMessage: state.systemMessage,
    authoritySnapshot: exportAuthoritySnapshot(),
  };
}

export const useDemoStore = create<DemoStore>((set, get) => {
  const persistCurrentState = async () => {
    const state = get();
    if (!state.isHydrated) {
      return;
    }

    await saveDemoSession(toPersistedSession(state));
  };

  const commitState = (partial: Partial<DemoStoreState>) => {
    set(partial);
    void persistCurrentState();
  };

  return {
    ...buildInitialState(),
    hydrateDemo: async () => {
      if (get().isHydrated) {
        return;
      }

      const session = await loadDemoSession();
      if (!session) {
        resetConfiguredAuthority();
        set({
          ...buildInitialState(),
          isHydrated: true,
        });
        return;
      }

      restoreLocalAuthority(session.authoritySnapshot);
      const prices = session.prices ?? createInitialPrices();
      set({
        ...session,
        prices,
        changes: session.changes ?? createInitialChanges(),
        priceHistory: session.priceHistory ?? buildInitialPriceHistory(prices),
        activeNews: session.activeNews ?? [],
        orderSize: session.orderSize ?? DEFAULT_TRADE_QUANTITY,
        lastRealizedPnl: session.lastRealizedPnl ?? null,
        isBusy: false,
        isHydrated: true,
      });
    },
    moveToHandle: () => {
      commitState({
        phase: "handle",
        systemMessage: "[sys] claim a local handle. uplink optional.",
      });
    },
    submitHandle: async (rawHandle) => {
      const handle = sanitizeHandle(rawHandle);
      if (!handle) {
        commitState({ systemMessage: "[sys] handle required." });
        return false;
      }

      set({
        isBusy: true,
        systemMessage: "[sys] provisioning local shard...",
      });

      try {
        const authority = getAuthority();
        const profile = await authority.createProfile({
          walletAddress: null,
          devIdentity: handle.toLowerCase(),
          eidolonHandle: handle,
          osTier: "PIRATE",
          rank: 1,
          faction: null,
        });

        const [prices, resources, ledger, positions, activeNews] = await Promise.all([
          authority.getTickPrices(0),
          authority.getResources(profile.id),
          authority.getLedger(profile.id),
          authority.getOpenPositions(profile.id),
          authority.getActiveNews(0),
        ]);

        set({
          phase: "terminal",
          handle: profile.eidolonHandle,
          profile,
          playerId: profile.id,
          activeView: "home",
          tick: 0,
          prices,
          changes: createInitialChanges(),
          priceHistory: buildInitialPriceHistory(prices),
          balanceObol: latestBalance(DEMO_STARTING_BALANCE, ledger),
          resources,
          positions: toPositionMap(positions),
          activeNews,
          isBusy: false,
          isHydrated: true,
          systemMessage: "[sys] market open. start small. low heat.",
        });
        await persistCurrentState();
        return true;
      } catch (error) {
        set({
          isBusy: false,
          systemMessage:
            error instanceof Error
              ? `[sys] ${error.message.toLowerCase()}`
              : "[sys] shell provisioning failed.",
        });
        await persistCurrentState();
        return false;
      }
    },
    openMarket: () => {
      commitState({ activeView: "market" });
    },
    goHome: () => {
      commitState({ activeView: "home" });
    },
    selectTicker: (ticker) => {
      const commodity = getCommodity(ticker);
      if (!commodity) {
        return;
      }

      commitState({
        activeView: "market",
        selectedTicker: ticker,
        systemMessage: `[scan] ${ticker} locked // ${commodity.name.toLowerCase()}`,
      });
    },
    setOrderSize: (quantity) => {
      commitState({
        orderSize: Math.max(1, Math.floor(quantity)),
        systemMessage: `[order] lot size set // x${Math.max(1, Math.floor(quantity))}`,
      });
    },
    advanceMarket: async () => {
      const state = get();
      if (state.phase !== "terminal" || !state.isHydrated) {
        return;
      }

      const nextTick = state.tick + 1;
      const authority = getAuthority();
      const prices = await authority.getTickPrices(nextTick);
      const [activeNews, resources, positions] = await Promise.all([
        authority.getActiveNews(nextTick),
        state.playerId && authority.advancePlayerClock
          ? authority.advancePlayerClock(state.playerId, nextTick)
          : state.playerId
            ? authority.getResources(state.playerId)
            : Promise.resolve(state.resources),
        state.playerId ? authority.getOpenPositions(state.playerId) : Promise.resolve([]),
      ]);

      set({
        tick: nextTick,
        prices,
        changes: buildChangeMap(state.prices, prices),
        priceHistory: appendPriceHistory(state.priceHistory, prices),
        activeNews,
        resources,
        positions: state.playerId ? toPositionMap(positions) : state.positions,
      });
      await persistCurrentState();
    },
    buySelected: async () => {
      const state = get();
      if (!state.playerId || state.isBusy) {
        return;
      }

      const price = state.prices[state.selectedTicker];
      if (price === undefined) {
        return;
      }

      set({ isBusy: true });

      try {
        const authority = getAuthority();
        const result = await authority.executeTrade({
          playerId: state.playerId,
          ticker: state.selectedTicker,
          side: "BUY",
          quantity: state.orderSize,
        });

        const [resources, positions, rank] = await Promise.all([
          authority.getResources(state.playerId),
          authority.getOpenPositions(state.playerId),
          authority.getRank(state.playerId),
        ]);

        set({
          positions: toPositionMap(positions),
          resources,
          balanceObol: latestBalance(state.balanceObol, result.ledger),
          profile: state.profile ? { ...state.profile, rank: rank.rank } : null,
          activeView: "market",
          isBusy: false,
          systemMessage: `[trade] buy committed // ${state.selectedTicker} x${state.orderSize} @ ${price.toFixed(2)}`,
        });
        await persistCurrentState();
      } catch (error) {
        set({
          isBusy: false,
          systemMessage:
            error instanceof Error
              ? `[sys] ${error.message.toLowerCase()}`
              : "[sys] trade rejected.",
        });
        await persistCurrentState();
      }
    },
    sellSelected: async () => {
      const state = get();
      if (!state.playerId || state.isBusy) {
        return;
      }

      const price = state.prices[state.selectedTicker];
      const position = state.positions[state.selectedTicker];
      if (price === undefined || !position) {
        return;
      }

      set({ isBusy: true });

      try {
        const authority = getAuthority();
        const result = await authority.executeTrade({
          playerId: state.playerId,
          ticker: state.selectedTicker,
          side: "SELL",
          quantity: position.quantity,
        });

        const [resources, positions, rank] = await Promise.all([
          authority.getResources(state.playerId),
          authority.getOpenPositions(state.playerId),
          authority.getRank(state.playerId),
        ]);

        set({
          positions: toPositionMap(positions),
          resources,
          balanceObol: latestBalance(state.balanceObol, result.ledger),
          profile: state.profile ? { ...state.profile, rank: rank.rank } : null,
          lastRealizedPnl: result.position.realizedPnl,
          firstTradeComplete:
            state.firstTradeComplete ||
            (result.position.quantity === 0 && result.position.realizedPnl > 0),
          activeView: "home",
          isBusy: false,
          systemMessage: `[trade] sell executed // ${state.selectedTicker} ${formatDelta(result.position.realizedPnl)} 0BOL`,
        });
        await persistCurrentState();
      } catch (error) {
        set({
          isBusy: false,
          systemMessage:
            error instanceof Error
              ? `[sys] ${error.message.toLowerCase()}`
              : "[sys] sell failed.",
        });
        await persistCurrentState();
      }
    },
    purchaseEnergyHour: async () => {
      const state = get();
      if (!state.playerId || state.isBusy) {
        return;
      }

      set({ isBusy: true });

      try {
        const authority = getAuthority();
        const resources = await authority.purchaseEnergy(state.playerId, 3600, "0BOL");
        const ledger = await authority.getLedger(state.playerId);

        set({
          resources,
          balanceObol: latestBalance(state.balanceObol, ledger),
          isBusy: false,
          systemMessage: "[energy] one hour purchased // shell stabilized",
        });
        await persistCurrentState();
      } catch (error) {
        set({
          isBusy: false,
          systemMessage:
            error instanceof Error
              ? `[sys] ${error.message.toLowerCase()}`
              : "[sys] energy purchase failed.",
        });
        await persistCurrentState();
      }
    },
    resetDemo: async () => {
      resetConfiguredAuthority();
      await clearDemoSession();
      set({
        ...buildInitialState(),
        isHydrated: true,
      });
    },
  };
});
