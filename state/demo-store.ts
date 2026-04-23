import { create } from "zustand";
import {
  FIRST_TRADE_HINT_TICKER,
  INITIAL_RESOURCES,
  advancePrices,
  applyAssistSignal,
  buyCommodity,
  createInitialChanges,
  createInitialPrices,
  formatDelta,
  getCommodity,
  sellCommodity,
  type ChangeMap,
  type DemoHolding,
  type DemoResources,
  type PriceMap,
} from "@/engine/demo-market";

export type DemoPhase = "boot" | "handle" | "terminal";
export type TerminalView = "home" | "market";

interface AssistSignal {
  ticker: string;
  remaining: number;
}

interface DemoStoreState {
  phase: DemoPhase;
  activeView: TerminalView;
  handle: string;
  tick: number;
  prices: PriceMap;
  changes: ChangeMap;
  resources: DemoResources;
  holdings: Record<string, DemoHolding>;
  selectedTicker: string;
  firstTradeComplete: boolean;
  systemMessage: string;
  assistSignal: AssistSignal | null;
}

interface DemoStoreActions {
  moveToHandle: () => void;
  submitHandle: (rawHandle: string) => boolean;
  openMarket: () => void;
  goHome: () => void;
  selectTicker: (ticker: string) => void;
  advanceMarket: () => void;
  buySelected: () => void;
  sellSelected: () => void;
  resetDemo: () => void;
}

type DemoStore = DemoStoreState & DemoStoreActions;

function buildInitialState(): DemoStoreState {
  return {
    phase: "boot",
    activeView: "home",
    handle: "",
    tick: 0,
    prices: createInitialPrices(),
    changes: createInitialChanges(),
    resources: { ...INITIAL_RESOURCES },
    holdings: {},
    selectedTicker: FIRST_TRADE_HINT_TICKER,
    firstTradeComplete: false,
    systemMessage: "[sys] you are awake. the deck is not yours.",
    assistSignal: null,
  };
}

function sanitizeHandle(rawHandle: string): string {
  return rawHandle.trim().replace(/\s+/g, "_").slice(0, 16);
}

export const useDemoStore = create<DemoStore>((set, get) => ({
  ...buildInitialState(),
  moveToHandle: () => {
    set({
      phase: "handle",
      systemMessage: "[sys] claim a local handle. uplink optional.",
    });
  },
  submitHandle: (rawHandle) => {
    const handle = sanitizeHandle(rawHandle);
    if (!handle) {
      set({ systemMessage: "[sys] handle required." });
      return false;
    }

    set({
      phase: "terminal",
      handle,
      activeView: "home",
      systemMessage: "[sys] market open. start small. low heat.",
    });
    return true;
  },
  openMarket: () => set({ activeView: "market" }),
  goHome: () => set({ activeView: "home" }),
  selectTicker: (ticker) => {
    const commodity = getCommodity(ticker);
    if (!commodity) return;

    set({
      activeView: "market",
      selectedTicker: ticker,
      systemMessage: `[scan] ${ticker} locked // ${commodity.name.toLowerCase()}`,
    });
  },
  advanceMarket: () => {
    const state = get();
    if (state.phase !== "terminal") {
      return;
    }

    const nextTick = state.tick + 1;
    let { prices, changes } = advancePrices(state.prices, nextTick);
    let assistSignal = state.assistSignal;

    if (assistSignal) {
      const boosted = applyAssistSignal(prices, changes, assistSignal.ticker);
      prices = boosted.prices;
      changes = boosted.changes;
      assistSignal =
        assistSignal.remaining <= 1
          ? null
          : { ...assistSignal, remaining: assistSignal.remaining - 1 };
    }

    set({
      tick: nextTick,
      prices,
      changes,
      assistSignal,
    });
  },
  buySelected: () => {
    const state = get();
    const selectedTicker = state.selectedTicker;
    const price = state.prices[selectedTicker];
    if (price === undefined) return;

    try {
      const result = buyCommodity({
        ticker: selectedTicker,
        quantity: 10,
        price,
        resources: state.resources,
        holding: state.holdings[selectedTicker],
      });

      const selectedCommodity = getCommodity(selectedTicker);
      const shouldAssist =
        !state.firstTradeComplete &&
        (selectedTicker === FIRST_TRADE_HINT_TICKER ||
          selectedCommodity?.heatRisk === "very_low" ||
          selectedCommodity?.heatRisk === "low");

      set({
        holdings: {
          ...state.holdings,
          [selectedTicker]: result.holding,
        },
        resources: result.resources,
        activeView: "market",
        assistSignal: shouldAssist ? { ticker: selectedTicker, remaining: 3 } : state.assistSignal,
        systemMessage: `[trade] buy committed // ${selectedTicker} x10 @ ${price.toFixed(2)}`,
      });
    } catch (error) {
      set({
        systemMessage:
          error instanceof Error ? `[sys] ${error.message.toLowerCase()}` : "[sys] trade rejected.",
      });
    }
  },
  sellSelected: () => {
    const state = get();
    const selectedTicker = state.selectedTicker;
    const price = state.prices[selectedTicker];
    const holding = state.holdings[selectedTicker];
    if (price === undefined || !holding) return;

    try {
      const result = sellCommodity({
        ticker: selectedTicker,
        price,
        resources: state.resources,
        holding,
      });

      const nextHoldings = { ...state.holdings };
      delete nextHoldings[selectedTicker];

      set({
        holdings: nextHoldings,
        resources: result.resources,
        firstTradeComplete: state.firstTradeComplete || result.realizedPnl > 0,
        activeView: "home",
        systemMessage: `[trade] sell executed // ${selectedTicker} ${formatDelta(result.realizedPnl)} 0BOL`,
      });
    } catch (error) {
      set({
        systemMessage:
          error instanceof Error ? `[sys] ${error.message.toLowerCase()}` : "[sys] sell failed.",
      });
    }
  },
  resetDemo: () => set(buildInitialState()),
}));
