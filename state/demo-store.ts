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
import type { PlayerProfile, Position, Resources } from "@/engine/types";
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
  balanceObol: number;
  resources: Resources;
  positions: Record<string, Position>;
  selectedTicker: string;
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
  advanceMarket: () => Promise<void>;
  buySelected: () => Promise<void>;
  sellSelected: () => Promise<void>;
  resetDemo: () => Promise<void>;
}

type DemoStore = DemoStoreState & DemoStoreActions;

function buildInitialState(): DemoStoreState {
  return {
    phase: "boot",
    activeView: "home",
    handle: "",
    profile: null,
    playerId: null,
    tick: 0,
    prices: createInitialPrices(),
    changes: createInitialChanges(),
    balanceObol: DEMO_STARTING_BALANCE,
    resources: { ...INITIAL_PLAYER_RESOURCES },
    positions: {},
    selectedTicker: FIRST_TRADE_HINT_TICKER,
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
    balanceObol: state.balanceObol,
    resources: state.resources,
    positions: state.positions,
    selectedTicker: state.selectedTicker,
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
      set({
        ...session,
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

        const [prices, resources, ledger, positions] = await Promise.all([
          authority.getTickPrices(0),
          authority.getResources(profile.id),
          authority.getLedger(profile.id),
          authority.getOpenPositions(profile.id),
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
          balanceObol: latestBalance(DEMO_STARTING_BALANCE, ledger),
          resources,
          positions: toPositionMap(positions),
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
    advanceMarket: async () => {
      const state = get();
      if (state.phase !== "terminal" || !state.isHydrated) {
        return;
      }

      const nextTick = state.tick + 1;
      const prices = await getAuthority().getTickPrices(nextTick);

      set({
        tick: nextTick,
        prices,
        changes: buildChangeMap(state.prices, prices),
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
          quantity: DEFAULT_TRADE_QUANTITY,
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
          systemMessage: `[trade] buy committed // ${state.selectedTicker} x${DEFAULT_TRADE_QUANTITY} @ ${price.toFixed(2)}`,
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
