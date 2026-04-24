import { create } from "zustand";
import {
  exportAuthoritySnapshot,
  getAuthority,
  resetConfiguredAuthority,
  restoreLocalAuthority,
} from "@/authority";
import {
  COURIER_SERVICES,
  DEFAULT_LOCATION_ID,
  LOCATIONS,
  getCourierService,
  getLocation,
  type CourierService,
  type LocationInventoryMap,
  type TransitShipment,
} from "@/data/locations";
import {
  DEFAULT_TRADE_QUANTITY,
  DEMO_STARTING_BALANCE,
  FIRST_TRADE_HINT_TICKER,
  applyLocationPriceModifiers,
  createInitialChanges,
  createInitialPrices,
  formatDelta,
  getCommodity,
  roundCurrency,
  type ChangeMap,
  type PriceMap,
} from "@/engine/demo-market";
import { checkRaid } from "@/engine/raid-checker";
import { getRankSnapshot } from "@/engine/rank";
import { seededStream } from "@/engine/prng";
import type { MarketNews, PlayerProfile, Position, RankSnapshot, Resources } from "@/engine/types";
import {
  clearDemoSession,
  loadDemoSession,
  saveDemoSession,
  type PersistedDemoSession,
} from "@/state/demo-storage";

export type DemoPhase = "intro" | "login" | "boot" | "home" | "handle" | "terminal";
export type TerminalView = "home" | "market";

export interface GameClockState {
  nowMs: number;
  displayTime: string;
  lastTickAt: number;
  lastRaidTick: number;
}

export interface WorldState {
  currentLocationId: string;
  travelDestinationId: string | null;
  travelEndTime: number | null;
}

export interface GameNotification {
  id: string;
  createdAt: number;
  message: string;
  tone: "info" | "success" | "warning" | "danger";
}

const INITIAL_PLAYER_RESOURCES: Resources = {
  energySeconds: 72 * 60 * 60,
  heat: 6,
  integrity: 82,
  stealth: 64,
  influence: 3,
};

const GAME_TICK_MS = 30_000;
const MAX_CATCH_UP_TICKS = 100;
const BLACK_MARKET_BRIBE_COST = 50_000;

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
  progression: RankSnapshot;
  clock: GameClockState;
  world: WorldState;
  notifications: GameNotification[];
  transitShipments: TransitShipment[];
  locationInventories: LocationInventoryMap;
  selectedTicker: string;
  orderSize: number;
  lastRealizedPnl: number | null;
  firstTradeComplete: boolean;
  introSeen: boolean;
  tutorialCompleted: boolean;
  systemMessage: string;
  isBusy: boolean;
  isHydrated: boolean;
}

interface DemoStoreActions {
  hydrateDemo: () => Promise<void>;
  moveToHandle: () => void;
  setHandle: (rawHandle: string) => void;
  markIntroSeen: () => void;
  resetIntro: () => void;
  completeBoot: () => Promise<void>;
  completeTutorial: () => void;
  resetTutorial: () => void;
  submitHandle: (rawHandle: string) => Promise<boolean>;
  openMarket: () => void;
  goHome: () => void;
  selectTicker: (ticker: string) => void;
  setOrderSize: (quantity: number) => void;
  advanceMarket: () => Promise<void>;
  runGameLoop: (nowMs: number) => Promise<void>;
  buySelected: () => Promise<void>;
  sellSelected: () => Promise<void>;
  purchaseEnergyHour: () => Promise<void>;
  purchaseEnergyHours: (hours: number) => Promise<void>;
  startTravel: (destinationId: string) => void;
  reduceHeatWithBribe: () => Promise<void>;
  sendCourierShipment: (input: {
    ticker: string;
    quantity: number;
    destinationId: string;
    courierId: CourierService["id"];
  }) => Promise<void>;
  claimShipment: (shipmentId: string) => Promise<void>;
  resetDemo: () => Promise<void>;
}

type DemoStore = DemoStoreState & DemoStoreActions;

function buildInitialState(): DemoStoreState {
  const nowMs = Date.now();
  const basePrices = createInitialPrices();
  const prices = applyLocationPriceModifiers(basePrices, DEFAULT_LOCATION_ID);

  return {
    phase: "intro",
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
    progression: getRankSnapshot(0),
    clock: {
      nowMs,
      displayTime: formatClock(nowMs),
      lastTickAt: nowMs,
      lastRaidTick: 0,
    },
    world: {
      currentLocationId: DEFAULT_LOCATION_ID,
      travelDestinationId: null,
      travelEndTime: null,
    },
    notifications: [],
    transitShipments: [],
    locationInventories: {},
    selectedTicker: FIRST_TRADE_HINT_TICKER,
    orderSize: DEFAULT_TRADE_QUANTITY,
    lastRealizedPnl: null,
    firstTradeComplete: false,
    introSeen: false,
    tutorialCompleted: false,
    systemMessage: "[sys] you are awake. the deck is not yours.",
    isBusy: false,
    isHydrated: false,
  };
}

function sanitizeHandle(rawHandle: string): string {
  return rawHandle.trim().replace(/\s+/g, "_").slice(0, 16);
}

function formatClock(nowMs: number): string {
  return new Date(nowMs).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
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

function isTravelling(world: WorldState, nowMs: number): boolean {
  return Boolean(world.travelDestinationId && world.travelEndTime && world.travelEndTime > nowMs);
}

function makeNotification(message: string, tone: GameNotification["tone"]): GameNotification {
  const createdAt = Date.now();
  return {
    id: `note_${createdAt}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt,
    message,
    tone,
  };
}

function addNotification(
  notifications: GameNotification[],
  message: string,
  tone: GameNotification["tone"],
): GameNotification[] {
  return [makeNotification(message, tone), ...notifications].slice(0, 20);
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
    progression: state.progression,
    clock: state.clock,
    world: state.world,
    notifications: state.notifications,
    transitShipments: state.transitShipments,
    locationInventories: state.locationInventories,
    selectedTicker: state.selectedTicker,
    orderSize: state.orderSize,
    lastRealizedPnl: state.lastRealizedPnl,
    firstTradeComplete: state.firstTradeComplete,
    introSeen: state.introSeen,
    tutorialCompleted: state.tutorialCompleted,
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

  const refreshFromAuthority = async (playerId: string, nextTick: number, locationId: string) => {
    const authority = getAuthority();
    const current = get();
    const basePrices = await authority.getTickPrices(nextTick);
    const prices = applyLocationPriceModifiers(basePrices, locationId);
    const [activeNews, resources, positions, progression] = await Promise.all([
      authority.getActiveNews(nextTick),
      authority.advancePlayerClock
        ? authority.advancePlayerClock(playerId, nextTick)
        : authority.getResources(playerId),
      authority.getOpenPositions(playerId),
      authority.getRank(playerId),
    ]);

    return {
      tick: nextTick,
      prices,
      changes: buildChangeMap(current.prices, prices),
      priceHistory: appendPriceHistory(current.priceHistory, prices),
      activeNews,
      resources,
      positions: toPositionMap(positions),
      progression,
    };
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
      const fallback = buildInitialState();
      const prices = session.prices ?? fallback.prices;
      set({
        ...fallback,
        ...session,
        prices,
        changes: session.changes ?? createInitialChanges(),
        priceHistory: session.priceHistory ?? buildInitialPriceHistory(prices),
        activeNews: session.activeNews ?? [],
        progression: session.progression ?? getRankSnapshot(session.profile?.rank ?? 0),
        clock: {
          ...fallback.clock,
          ...(session.clock ?? {}),
          nowMs: Date.now(),
          displayTime: formatClock(Date.now()),
        },
        world: session.world ?? fallback.world,
        notifications: session.notifications ?? [],
        transitShipments: session.transitShipments ?? [],
        locationInventories: session.locationInventories ?? {},
        orderSize: session.orderSize ?? DEFAULT_TRADE_QUANTITY,
        lastRealizedPnl: session.lastRealizedPnl ?? null,
        introSeen: session.introSeen ?? false,
        tutorialCompleted: session.tutorialCompleted ?? false,
        isBusy: false,
        isHydrated: true,
      });
    },
    moveToHandle: () => {
      commitState({
        phase: "login",
        systemMessage: "[sys] claim a local handle. uplink optional.",
      });
    },
    setHandle: (rawHandle) => {
      const handle = sanitizeHandle(rawHandle);
      commitState({
        handle,
        phase: "boot",
        systemMessage: handle
          ? `[sys] handle locked // ${handle.toLowerCase()}`
          : "[sys] handle required.",
      });
    },
    markIntroSeen: () => {
      commitState({ introSeen: true, phase: "login" });
    },
    resetIntro: () => {
      commitState({ introSeen: false, phase: "intro" });
    },
    completeBoot: async () => {
      const state = get();
      if (state.profile || state.playerId) {
        commitState({
          phase: "home",
          activeView: "home",
          systemMessage: "[sys] market open. start small. low heat.",
        });
        return;
      }

      const handle = sanitizeHandle(state.handle || "ZORO");
      set({ isBusy: true, handle, systemMessage: "[sys] provisioning local shard..." });

      try {
        const authority = getAuthority();
        const profile = await authority.createProfile({
          walletAddress: null,
          devIdentity: handle.toLowerCase(),
          eidolonHandle: handle,
          osTier: "PIRATE",
          rank: 1,
          faction: null,
          currentLocationId: DEFAULT_LOCATION_ID,
          travelDestinationId: null,
          travelEndTime: null,
        });

        const nowMs = Date.now();
        const basePrices = await authority.getTickPrices(0);
        const prices = applyLocationPriceModifiers(basePrices, DEFAULT_LOCATION_ID);
        const [resources, ledger, positions, activeNews, progression] = await Promise.all([
          authority.getResources(profile.id),
          authority.getLedger(profile.id),
          authority.getOpenPositions(profile.id),
          authority.getActiveNews(0),
          authority.getRank(profile.id),
        ]);

        set({
          phase: "home",
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
          progression,
          clock: {
            nowMs,
            displayTime: formatClock(nowMs),
            lastTickAt: nowMs,
            lastRaidTick: 0,
          },
          world: {
            currentLocationId: DEFAULT_LOCATION_ID,
            travelDestinationId: null,
            travelEndTime: null,
          },
          notifications: addNotification([], "Local shard online.", "success"),
          isBusy: false,
          isHydrated: true,
          systemMessage: "[sys] market open. start small. low heat.",
        });
        await persistCurrentState();
      } catch (error) {
        set({
          isBusy: false,
          systemMessage:
            error instanceof Error
              ? `[sys] ${error.message.toLowerCase()}`
              : "[sys] shell provisioning failed.",
        });
        await persistCurrentState();
      }
    },
    completeTutorial: () => {
      commitState({ tutorialCompleted: true, systemMessage: "[sys] tutorial complete." });
    },
    resetTutorial: () => {
      commitState({ tutorialCompleted: false, systemMessage: "[sys] tutorial reset." });
    },
    submitHandle: async (rawHandle) => {
      const handle = sanitizeHandle(rawHandle);
      if (!handle) {
        commitState({ systemMessage: "[sys] handle required." });
        return false;
      }

      set({ isBusy: true, systemMessage: "[sys] provisioning local shard..." });

      try {
        const authority = getAuthority();
        const profile = await authority.createProfile({
          walletAddress: null,
          devIdentity: handle.toLowerCase(),
          eidolonHandle: handle,
          osTier: "PIRATE",
          rank: 1,
          faction: null,
          currentLocationId: DEFAULT_LOCATION_ID,
          travelDestinationId: null,
          travelEndTime: null,
        });

        const nowMs = Date.now();
        const basePrices = await authority.getTickPrices(0);
        const prices = applyLocationPriceModifiers(basePrices, DEFAULT_LOCATION_ID);
        const [resources, ledger, positions, activeNews, progression] = await Promise.all([
          authority.getResources(profile.id),
          authority.getLedger(profile.id),
          authority.getOpenPositions(profile.id),
          authority.getActiveNews(0),
          authority.getRank(profile.id),
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
          progression,
          clock: {
            nowMs,
            displayTime: formatClock(nowMs),
            lastTickAt: nowMs,
            lastRaidTick: 0,
          },
          world: {
            currentLocationId: DEFAULT_LOCATION_ID,
            travelDestinationId: null,
            travelEndTime: null,
          },
          notifications: addNotification([], "Local shard online.", "success"),
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
      commitState({ phase: "terminal", activeView: "market" });
    },
    goHome: () => {
      commitState({ phase: "home", activeView: "home" });
    },
    selectTicker: (ticker) => {
      const commodity = getCommodity(ticker);
      if (!commodity) {
        return;
      }

      commitState({
        phase: "terminal",
        activeView: "market",
        selectedTicker: ticker,
        systemMessage: `[scan] ${ticker} locked // ${commodity.name.toLowerCase()}`,
      });
    },
    setOrderSize: (quantity) => {
      const safeQuantity = Math.max(1, Math.floor(quantity));
      commitState({
        orderSize: safeQuantity,
        systemMessage: `[order] lot size set // x${safeQuantity}`,
      });
    },
    advanceMarket: async () => {
      const state = get();
      if (!state.playerId || !state.isHydrated) {
        return;
      }

      const nextTick = state.tick + 1;
      const refresh = await refreshFromAuthority(
        state.playerId,
        nextTick,
        state.world.currentLocationId,
      );
      set(refresh);
      await persistCurrentState();
    },
    runGameLoop: async (nowMs) => {
      const state = get();
      const baseClock = {
        ...state.clock,
        nowMs,
        displayTime: formatClock(nowMs),
      };
      set({ clock: baseClock });

      if (!state.isHydrated || !state.playerId) {
        return;
      }

      let nextWorld = state.world;
      let nextNotifications = state.notifications;
      let nextShipments = state.transitShipments;
      let nextLocationInventories = state.locationInventories;
      let didMutate = false;

      if (
        state.world.travelDestinationId &&
        state.world.travelEndTime &&
        state.world.travelEndTime <= nowMs
      ) {
        const location = getLocation(state.world.travelDestinationId);
        nextWorld = {
          currentLocationId: location.id,
          travelDestinationId: null,
          travelEndTime: null,
        };
        nextNotifications = addNotification(
          nextNotifications,
          `Arrived at ${location.name}.`,
          "success",
        );
        didMutate = true;
      }

      nextShipments = nextShipments.map((shipment) => {
        if (shipment.status !== "transit" || shipment.arrivalTime > nowMs) {
          return shipment;
        }

        const service = getCourierService(shipment.courierUsed);
        const stream = seededStream(`${shipment.id}:${shipment.arrivalTime}:${service.id}`);
        const lost = stream() < service.lossChance;
        didMutate = true;
        if (lost) {
          nextNotifications = addNotification(
            nextNotifications,
            `${service.name} lost ${shipment.quantity} ${shipment.ticker}.`,
            "danger",
          );
          return { ...shipment, status: "lost" };
        }

        const arrived = { ...shipment, status: "arrived" as const };
        const currentInventory = nextLocationInventories[shipment.destinationId] ?? [];
        nextLocationInventories = {
          ...nextLocationInventories,
          [shipment.destinationId]: [
            ...currentInventory,
            {
              id: shipment.id,
              ticker: shipment.ticker,
              quantity: shipment.quantity,
              avgEntry: shipment.avgEntry,
              realizedPnl: 0,
              unrealizedPnl: 0,
              openedAt: new Date(shipment.arrivalTime).toISOString(),
              closedAt: null,
            },
          ],
        };
        nextNotifications = addNotification(
          nextNotifications,
          `${shipment.quantity} ${shipment.ticker} arrived at ${getLocation(shipment.destinationId).name}.`,
          "success",
        );
        return arrived;
      });

      const lastTickAt = state.clock.lastTickAt || nowMs;
      const missedTicks = Math.min(
        MAX_CATCH_UP_TICKS,
        Math.floor(Math.max(0, nowMs - lastTickAt) / GAME_TICK_MS),
      );

      if (missedTicks > 0) {
        let cursorTick = state.tick;
        let refresh: Partial<DemoStoreState> = {};

        for (let index = 0; index < missedTicks; index += 1) {
          cursorTick += 1;
          refresh = await refreshFromAuthority(
            state.playerId,
            cursorTick,
            nextWorld.currentLocationId,
          );

          if (cursorTick % 60 === 0 && cursorTick !== state.clock.lastRaidTick) {
            const currentPositions = (refresh.positions ?? state.positions) as Record<string, Position>;
            const currentResources = (refresh.resources ?? state.resources) as Resources;
            const raid = checkRaid({
              tick: cursorTick,
              heat: currentResources.heat,
              positions: currentPositions,
            });
            if (raid.triggered) {
              const authority = getAuthority();
              const raidState = authority.applyRaidLoss
                ? await authority.applyRaidLoss(state.playerId, raid.losses)
                : { positions: Object.values(currentPositions), resources: currentResources };
              const progression = await authority.updateXp(
                state.playerId,
                raid.xpBonus,
                "raid_survived",
              );
              refresh = {
                ...refresh,
                positions: toPositionMap(raidState.positions),
                resources: raidState.resources,
                progression,
              };
              nextNotifications = addNotification(nextNotifications, raid.message, "danger");
            }
          }
        }

        set({
          ...refresh,
          world: nextWorld,
          transitShipments: nextShipments,
          locationInventories: nextLocationInventories,
          notifications: nextNotifications,
          clock: {
            nowMs,
            displayTime: formatClock(nowMs),
            lastTickAt: lastTickAt + missedTicks * GAME_TICK_MS,
            lastRaidTick: cursorTick % 60 === 0 ? cursorTick : state.clock.lastRaidTick,
          },
        });
        await persistCurrentState();
        return;
      }

      if (didMutate) {
        set({
          world: nextWorld,
          transitShipments: nextShipments,
          locationInventories: nextLocationInventories,
          notifications: nextNotifications,
          clock: baseClock,
        });
        await persistCurrentState();
      }
    },
    buySelected: async () => {
      const state = get();
      if (!state.playerId || state.isBusy) {
        return;
      }
      if (isTravelling(state.world, state.clock.nowMs)) {
        commitState({ systemMessage: "[sys] travelling. trading blocked until arrival." });
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
          locationId: state.world.currentLocationId,
        });

        set({
          positions: toPositionMap(result.positions),
          resources: result.resources,
          balanceObol: latestBalance(state.balanceObol, result.ledger),
          progression: result.rank,
          profile: state.profile ? { ...state.profile, rank: result.rank.level } : null,
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
              ? `[sys] ${error.message}`
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
      if (isTravelling(state.world, state.clock.nowMs)) {
        commitState({ systemMessage: "[sys] travelling. trading blocked until arrival." });
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
          quantity: Math.min(state.orderSize, position.quantity),
          locationId: state.world.currentLocationId,
        });

        set({
          positions: toPositionMap(result.positions),
          resources: result.resources,
          balanceObol: latestBalance(state.balanceObol, result.ledger),
          progression: result.rank,
          profile: state.profile ? { ...state.profile, rank: result.rank.level } : null,
          lastRealizedPnl: result.realizedPnl,
          firstTradeComplete: state.firstTradeComplete || result.realizedPnl > 0,
          activeView: "home",
          isBusy: false,
          notifications:
            result.xpGained > 0
              ? addNotification(state.notifications, `XP +${result.xpGained}`, "success")
              : state.notifications,
          systemMessage: `[trade] sell executed // ${state.selectedTicker} ${formatDelta(result.realizedPnl)} 0BOL`,
        });
        await persistCurrentState();
      } catch (error) {
        set({
          isBusy: false,
          systemMessage:
            error instanceof Error
              ? `[sys] ${error.message}`
              : "[sys] sell failed.",
        });
        await persistCurrentState();
      }
    },
    purchaseEnergyHour: async () => {
      await get().purchaseEnergyHours(1);
    },
    purchaseEnergyHours: async (hours) => {
      const state = get();
      if (!state.playerId || state.isBusy) {
        return;
      }

      set({ isBusy: true });

      try {
        const authority = getAuthority();
        const energySeconds = Math.max(1, Math.min(24, Math.floor(hours))) * 3600;
        const resources = await authority.purchaseEnergy(state.playerId, energySeconds, "0BOL");
        const ledger = await authority.getLedger(state.playerId);

        set({
          resources,
          balanceObol: latestBalance(state.balanceObol, ledger),
          isBusy: false,
          systemMessage: `[energy] ${Math.floor(energySeconds / 3600)}h purchased // shell stabilized`,
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
    startTravel: (destinationId) => {
      const state = get();
      const destination = LOCATIONS.find((location) => location.id === destinationId && location.unlocked);
      if (!destination || destination.id === state.world.currentLocationId) {
        return;
      }

      const nowMs = state.clock.nowMs || Date.now();
      const travelEndTime = nowMs + destination.travelTime * 60_000;
      commitState({
        world: {
          currentLocationId: state.world.currentLocationId,
          travelDestinationId: destination.id,
          travelEndTime,
        },
        notifications: addNotification(
          state.notifications,
          `Travelling to ${destination.name}.`,
          "info",
        ),
        systemMessage: `[route] travelling to ${destination.name.toUpperCase()}`,
      });
    },
    reduceHeatWithBribe: async () => {
      const state = get();
      if (!state.playerId || state.isBusy || state.world.currentLocationId !== "black_market") {
        return;
      }

      set({ isBusy: true });
      try {
        const reduction = 20 + ((state.tick * 7 + state.resources.heat) % 21);
        const authority = getAuthority();
        const result = authority.reduceHeat
          ? await authority.reduceHeat(state.playerId, BLACK_MARKET_BRIBE_COST, reduction)
          : { resources: { ...state.resources, heat: Math.max(0, state.resources.heat - reduction) }, ledger: [] };
        set({
          resources: result.resources,
          balanceObol: latestBalance(state.balanceObol, result.ledger),
          notifications: addNotification(
            state.notifications,
            `Black Market bribe reduced Heat by ${reduction}.`,
            "success",
          ),
          isBusy: false,
          systemMessage: `[heat] bribe accepted // -${reduction}`,
        });
        await persistCurrentState();
      } catch (error) {
        set({
          isBusy: false,
          systemMessage:
            error instanceof Error
              ? `[sys] ${error.message}`
              : "[sys] bribe failed.",
        });
        await persistCurrentState();
      }
    },
    sendCourierShipment: async ({ ticker, quantity, destinationId, courierId }) => {
      const state = get();
      if (!state.playerId || state.isBusy) {
        return;
      }

      const position = state.positions[ticker];
      const destination = LOCATIONS.find((location) => location.id === destinationId && location.unlocked);
      const courier = COURIER_SERVICES.find((service) => service.id === courierId);
      if (!position || !destination || !courier) {
        return;
      }

      const sendQuantity = Math.max(1, Math.min(position.quantity, Math.floor(quantity)));
      set({ isBusy: true });

      try {
        const authority = getAuthority();
        if (!authority.transferPositionToShipment) {
          throw new Error("Courier authority unavailable");
        }
        const result = await authority.transferPositionToShipment(
          state.playerId,
          ticker,
          sendQuantity,
          courier.cost,
        );
        const nowMs = state.clock.nowMs || Date.now();
        const shipment: TransitShipment = {
          id: `shipment_${nowMs}_${ticker}_${destination.id}`,
          ticker,
          quantity: sendQuantity,
          avgEntry: position.avgEntry,
          destinationId: destination.id,
          arrivalTime: nowMs + destination.travelTime * 60_000,
          courierUsed: courier.id,
          status: "transit",
        };

        set({
          positions: toPositionMap(result.positions),
          balanceObol: latestBalance(state.balanceObol, result.ledger),
          transitShipments: [shipment, ...state.transitShipments],
          notifications: addNotification(
            state.notifications,
            `${courier.name} carrying ${sendQuantity} ${ticker} to ${destination.name}.`,
            "info",
          ),
          isBusy: false,
          systemMessage: `[courier] ${ticker} dispatched via ${courier.name}`,
        });
        await persistCurrentState();
      } catch (error) {
        set({
          isBusy: false,
          systemMessage:
            error instanceof Error
              ? `[sys] ${error.message}`
              : "[sys] courier failed.",
        });
        await persistCurrentState();
      }
    },
    claimShipment: async (shipmentId) => {
      const state = get();
      if (!state.playerId || state.isBusy) {
        return;
      }
      const shipment = state.transitShipments.find((item) => item.id === shipmentId);
      if (
        !shipment ||
        shipment.status !== "arrived" ||
        shipment.destinationId !== state.world.currentLocationId
      ) {
        return;
      }

      set({ isBusy: true });
      try {
        const authority = getAuthority();
        const positions = authority.claimShipment
          ? await authority.claimShipment(
              state.playerId,
              shipment.ticker,
              shipment.quantity,
              shipment.avgEntry,
            )
          : Object.values(state.positions);

        set({
          positions: toPositionMap(positions),
          transitShipments: state.transitShipments.map((item) =>
            item.id === shipmentId ? { ...item, status: "claimed" } : item,
          ),
          notifications: addNotification(
            state.notifications,
            `${shipment.quantity} ${shipment.ticker} claimed.`,
            "success",
          ),
          isBusy: false,
          systemMessage: `[courier] ${shipment.ticker} claimed`,
        });
        await persistCurrentState();
      } catch (error) {
        set({
          isBusy: false,
          systemMessage:
            error instanceof Error
              ? `[sys] ${error.message}`
              : "[sys] claim failed.",
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
