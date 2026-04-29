import { create } from "zustand";
import {
  exportAuthoritySnapshot,
  getAuthority,
  resetConfiguredAuthority,
  restoreLocalAuthority,
} from "@/authority";
import {
  HANDLE_VALIDATION_COPY,
  createLaunchPlayerProfileInput,
  isValidEidolonHandle,
  normalizeEidolonHandle,
} from "@/authority/launch-identity";
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
import {
  createDailyChallenges,
  advanceDailyChallengeProgress,
  claimDailyChallenge as claimDailyChallengeEngine,
  getDailyChallengeDayKey,
} from "@/engine/daily-challenges";
import {
  getBountyByHeat,
  getBountyFlashFrequencyMultiplier,
  getBountyRaidIntervalTicks,
  getBountyRiskLabel,
} from "@/engine/bounty";
import {
  createDistrictShift,
  createInitialDistrictStates,
  districtAnnouncement,
  getActiveDistrictState,
  getDistrictCourierRiskBonus,
  getDistrictCourierRiskMultiplier,
  getDistrictCourierTimeMultiplier,
  getNextDistrictShiftDelay,
  isDistrictBuyRestricted,
  isDistrictSellRestricted,
  normalizeDistrictStates,
} from "@/engine/district-state";
import {
  FLASH_EVENT_COOLDOWN_MS,
  applyFlashEventPriceModifiers,
  createFlashEvent,
  getFlashCourierCostMultiplier,
  getNextFlashEventDelay,
  isTradingBlockedByFlash,
  updateFlashEvent,
} from "@/engine/flash-events";
import { applyTerminalFactionPressureToPrices } from "@/engine/terminal-pressure";
import {
  getAgentOsFactionGate,
  getFactionDefinition,
  getNextFactionChoice,
} from "@/engine/factions";
import {
  createMission,
  getMissionProgress,
  getNextMissionDelay,
} from "@/engine/mission-generator";
import { checkRaid } from "@/engine/raid-checker";
import { getRankSnapshot } from "@/engine/rank";
import { seededStream } from "@/engine/prng";
import {
  applySellToStreak,
  createInitialStreak,
  expireStreakIfNeeded,
} from "@/engine/streak";
import type {
  DailyChallenge,
  AwayReport,
  BountySnapshot,
  DistrictStateRecord,
  Faction,
  FactionChoice,
  FlashEvent,
  MarketNews,
  Mission,
  PlayerProfile,
  Position,
  RankCelebration,
  RankSnapshot,
  Resources,
  TradeJuice,
  TradeStreak,
} from "@/engine/types";
import {
  clearDemoSession,
  loadDemoSession,
  saveDemoSession,
  type PersistedDemoSession,
} from "@/state/demo-storage";
import { getSafeFailureMessage } from "@/state/system-messages";

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
const ENGAGEMENT_SEED = "v6-engagement";
const BASE_COURIER_LIMIT = 3;
const HEAT_WARNING_THRESHOLDS = [30, 50, 70, 90] as const;

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
  activeFlashEvent: FlashEvent | null;
  flashEventCount: number;
  nextFlashEventAt: number;
  flashCooldownUntil: number;
  pendingMission: Mission | null;
  activeMission: Mission | null;
  missionHistory: Mission[];
  npcReputation: Record<string, number>;
  missionCount: number;
  nextMissionAt: number;
  streak: TradeStreak;
  dailyChallenges: DailyChallenge[];
  dailyChallengeDayKey: string;
  districtStates: Record<string, DistrictStateRecord>;
  districtStateCount: number;
  nextDistrictStateAt: number;
  bounty: BountySnapshot;
  awayReport: AwayReport | null;
  tradeJuice: TradeJuice | null;
  heatWarning: { threshold: number; createdAt: number } | null;
  rankCelebration: RankCelebration | null;
  factionChoice: FactionChoice | null;
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
  acceptMission: () => void;
  declineMission: () => void;
  chooseFaction: (faction: Faction) => Promise<void>;
  claimDailyChallenge: (challengeId: string) => Promise<void>;
  recordAwayReport: (nowMs: number, awayStartedAt: number) => void;
  dismissAwayReport: () => void;
  resetDemo: () => Promise<void>;
}

type DemoStore = DemoStoreState & DemoStoreActions;

function buildInitialState(): DemoStoreState {
  const nowMs = Date.now();
  const basePrices = createInitialPrices();
  const prices = applyLocationPriceModifiers(basePrices, DEFAULT_LOCATION_ID);
  const dailyChallengeDayKey = getDailyChallengeDayKey(nowMs);

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
    activeFlashEvent: null,
    flashEventCount: 0,
    nextFlashEventAt: nowMs + getNextFlashEventDelay(ENGAGEMENT_SEED, 0),
    flashCooldownUntil: 0,
    pendingMission: null,
    activeMission: null,
    missionHistory: [],
    npcReputation: {},
    missionCount: 0,
    nextMissionAt: nowMs + getNextMissionDelay(ENGAGEMENT_SEED, 0),
    streak: createInitialStreak(),
    dailyChallenges: createDailyChallenges(nowMs, 1),
    dailyChallengeDayKey,
    districtStates: createInitialDistrictStates(nowMs),
    districtStateCount: 0,
    nextDistrictStateAt: nowMs + getNextDistrictShiftDelay(ENGAGEMENT_SEED, 0),
    bounty: getBountyByHeat(INITIAL_PLAYER_RESOURCES.heat),
    awayReport: null,
    tradeJuice: null,
    heatWarning: null,
    rankCelebration: null,
    factionChoice: null,
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
  return normalizeEidolonHandle(rawHandle);
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

function getCourierLimit(rankLevel: number): number {
  return rankLevel >= 10 ? 5 : BASE_COURIER_LIMIT;
}

function applyAllPriceModifiers(input: {
  basePrices: PriceMap;
  locationId: string;
  districtStates: Record<string, DistrictStateRecord>;
  activeFlashEvent: FlashEvent | null;
  nowMs: number;
  tick: number;
  faction: Faction | null;
  npcReputation: Record<string, number>;
}): PriceMap {
  const district = getActiveDistrictState(
    input.districtStates,
    input.locationId,
    input.nowMs,
  );
  const locationPrices = applyLocationPriceModifiers(
    input.basePrices,
    input.locationId,
    district,
  );
  const flashPrices = applyFlashEventPriceModifiers({
    prices: locationPrices,
    event: input.activeFlashEvent,
    locationId: input.locationId,
    nowMs: input.nowMs,
    tick: input.tick,
  });
  return applyTerminalFactionPressureToPrices({
    prices: flashPrices,
    faction: input.faction,
    npcReputation: input.npcReputation,
    tick: input.tick,
  }).prices;
}

function getTradeBlockReason(state: DemoStoreState, side: "BUY" | "SELL"): string | null {
  const district = getActiveDistrictState(
    state.districtStates,
    state.world.currentLocationId,
    state.clock.nowMs,
  );
  if (isTravelling(state.world, state.clock.nowMs)) {
    return "[sys] travelling. trading blocked until arrival.";
  }
  if (side === "BUY" && isDistrictBuyRestricted(district.state)) {
    return `[sys] ${district.state.toLowerCase()} in this district. buys restricted.`;
  }
  if (side === "SELL" && isDistrictSellRestricted(district.state)) {
    return `[sys] ${district.state.toLowerCase()} in this district. sells restricted.`;
  }
  if (isTradingBlockedByFlash(state.activeFlashEvent, state.world.currentLocationId)) {
    return "[sys] district blackout. trading frozen.";
  }
  return null;
}

function updateHeatWarning(
  previousHeat: number,
  nextResources: Resources,
  notifications: GameNotification[],
): {
  resources: Resources;
  notifications: GameNotification[];
  heatWarning: DemoStoreState["heatWarning"];
} {
  const threshold = HEAT_WARNING_THRESHOLDS.find(
    (value) => previousHeat < value && nextResources.heat >= value,
  );

  if (!threshold) {
    return { resources: nextResources, notifications, heatWarning: null };
  }

  return {
    resources: nextResources,
    notifications: addNotification(
      notifications,
      `Heat crossed ${threshold}. eAgent attention rising.`,
      "warning",
    ),
    heatWarning: { threshold, createdAt: Date.now() },
  };
}

function updateBountyFeedback(
  previousHeat: number,
  nextResources: Resources,
  notifications: GameNotification[],
): { bounty: BountySnapshot; notifications: GameNotification[] } {
  const previousBounty = getBountyByHeat(previousHeat);
  const bounty = getBountyByHeat(nextResources.heat);
  if (bounty.level <= previousBounty.level) {
    return { bounty, notifications };
  }

  return {
    bounty,
    notifications: addNotification(
      notifications,
      `eAGENT WATCHLIST: You are now ${bounty.status}.`,
      "danger",
    ),
  };
}

function maybeRankCelebration(
  previous: RankSnapshot,
  next: RankSnapshot,
): RankCelebration | null {
  if (next.level <= previous.level) {
    return null;
  }
  // AUDIO: rank_up.wav on rank change
  return {
    level: next.level,
    title: next.title,
    createdAt: Date.now(),
  };
}

function markMissionStatus(
  mission: Mission,
  status: Mission["status"],
  nowMs: number,
): Mission {
  return {
    ...mission,
    status,
    accepted: status === "active" || mission.accepted,
    completed: status === "completed",
    failed: status === "failed" || status === "declined",
    completedAt: status === "completed" || status === "failed" || status === "declined"
      ? nowMs
      : mission.completedAt,
  };
}

function getLegacyFactionChoice(profile: PlayerProfile | null | undefined): FactionChoice | null {
  if (!profile?.faction) {
    return null;
  }

  return {
    faction: profile.faction,
    chosenAt: profile.createdAt,
    freeSwitchUsed: false,
    previousFaction: null,
  };
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
    activeFlashEvent: state.activeFlashEvent,
    flashEventCount: state.flashEventCount,
    nextFlashEventAt: state.nextFlashEventAt,
    flashCooldownUntil: state.flashCooldownUntil,
    pendingMission: state.pendingMission,
    activeMission: state.activeMission,
    missionHistory: state.missionHistory,
    npcReputation: state.npcReputation,
    missionCount: state.missionCount,
    nextMissionAt: state.nextMissionAt,
    streak: state.streak,
    dailyChallenges: state.dailyChallenges,
    dailyChallengeDayKey: state.dailyChallengeDayKey,
    districtStates: state.districtStates,
    districtStateCount: state.districtStateCount,
    nextDistrictStateAt: state.nextDistrictStateAt,
    bounty: state.bounty,
    awayReport: state.awayReport,
    tradeJuice: state.tradeJuice,
    heatWarning: state.heatWarning,
    rankCelebration: state.rankCelebration,
    factionChoice: state.factionChoice,
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

  const refreshFromAuthority = async (
    playerId: string,
    nextTick: number,
    locationId: string,
    nowMs: number,
    activeFlashEvent: FlashEvent | null = get().activeFlashEvent,
    districtStates: Record<string, DistrictStateRecord> = get().districtStates,
  ) => {
    const authority = getAuthority();
    const current = get();
    const basePrices = await authority.getTickPrices(nextTick);
    const prices = applyAllPriceModifiers({
      basePrices,
      locationId,
      districtStates,
      activeFlashEvent,
      nowMs,
      tick: nextTick,
      faction: current.profile?.faction ?? null,
      npcReputation: current.npcReputation,
    });
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
        activeFlashEvent: session.activeFlashEvent ?? null,
        flashEventCount: session.flashEventCount ?? 0,
        nextFlashEventAt: session.nextFlashEventAt ?? fallback.nextFlashEventAt,
        flashCooldownUntil: session.flashCooldownUntil ?? 0,
        pendingMission: session.pendingMission ?? null,
        activeMission: session.activeMission ?? null,
        missionHistory: session.missionHistory ?? [],
        npcReputation: session.npcReputation ?? {},
        missionCount: session.missionCount ?? 0,
        nextMissionAt: session.nextMissionAt ?? fallback.nextMissionAt,
        streak: session.streak ?? fallback.streak,
        dailyChallenges: session.dailyChallenges ?? fallback.dailyChallenges,
        dailyChallengeDayKey: session.dailyChallengeDayKey ?? fallback.dailyChallengeDayKey,
        districtStates: session.districtStates ?? fallback.districtStates,
        districtStateCount: session.districtStateCount ?? 0,
        nextDistrictStateAt: session.nextDistrictStateAt ?? fallback.nextDistrictStateAt,
        bounty: session.bounty ?? getBountyByHeat((session.resources ?? fallback.resources).heat),
        awayReport: session.awayReport ?? null,
        tradeJuice: session.tradeJuice ?? null,
        heatWarning: session.heatWarning ?? null,
        rankCelebration: session.rankCelebration ?? null,
        factionChoice: session.factionChoice ?? getLegacyFactionChoice(session.profile),
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
        const profile = await authority.createProfile(createLaunchPlayerProfileInput(handle));

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
          activeFlashEvent: null,
          flashEventCount: 0,
          nextFlashEventAt: nowMs + getNextFlashEventDelay(ENGAGEMENT_SEED, 0),
          flashCooldownUntil: 0,
          pendingMission: null,
          activeMission: null,
          missionHistory: [],
          npcReputation: {},
          missionCount: 0,
          nextMissionAt: nowMs + getNextMissionDelay(ENGAGEMENT_SEED, 0),
          streak: createInitialStreak(),
          dailyChallenges: createDailyChallenges(nowMs, progression.level),
          dailyChallengeDayKey: getDailyChallengeDayKey(nowMs),
          districtStates: createInitialDistrictStates(nowMs),
          districtStateCount: 0,
          nextDistrictStateAt: nowMs + getNextDistrictShiftDelay(ENGAGEMENT_SEED, 0),
          tradeJuice: null,
          heatWarning: null,
          rankCelebration: null,
          factionChoice: null,
          isBusy: false,
          isHydrated: true,
          systemMessage: "[sys] market open. start small. low heat.",
        });
        await persistCurrentState();
      } catch {
        set({
          isBusy: false,
          systemMessage: getSafeFailureMessage("provision"),
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
      if (!isValidEidolonHandle(rawHandle)) {
        commitState({
          systemMessage: handle ? `[sys] ${HANDLE_VALIDATION_COPY.toLowerCase()}` : "[sys] handle required.",
        });
        return false;
      }

      set({ isBusy: true, systemMessage: "[sys] provisioning local shard..." });

      try {
        const authority = getAuthority();
        const profile = await authority.createProfile(createLaunchPlayerProfileInput(handle));

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
          activeFlashEvent: null,
          flashEventCount: 0,
          nextFlashEventAt: nowMs + getNextFlashEventDelay(ENGAGEMENT_SEED, 0),
          flashCooldownUntil: 0,
          pendingMission: null,
          activeMission: null,
          missionHistory: [],
          npcReputation: {},
          missionCount: 0,
          nextMissionAt: nowMs + getNextMissionDelay(ENGAGEMENT_SEED, 0),
          streak: createInitialStreak(),
          dailyChallenges: createDailyChallenges(nowMs, progression.level),
          dailyChallengeDayKey: getDailyChallengeDayKey(nowMs),
          districtStates: createInitialDistrictStates(nowMs),
          districtStateCount: 0,
          nextDistrictStateAt: nowMs + getNextDistrictShiftDelay(ENGAGEMENT_SEED, 0),
          tradeJuice: null,
          heatWarning: null,
          rankCelebration: null,
          factionChoice: null,
          isBusy: false,
          isHydrated: true,
          systemMessage: "[sys] market open. start small. low heat.",
        });
        await persistCurrentState();
        return true;
      } catch {
        set({
          isBusy: false,
          systemMessage: getSafeFailureMessage("provision"),
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
      const nowMs = state.clock.nowMs || Date.now();
      const refresh = await refreshFromAuthority(
        state.playerId,
        nextTick,
        state.world.currentLocationId,
        nowMs,
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

      const authority = getAuthority();
      let nextWorld = state.world;
      let nextNotifications = state.notifications;
      let nextShipments = state.transitShipments;
      let nextLocationInventories = state.locationInventories;
      let nextActiveFlashEvent = updateFlashEvent(state.activeFlashEvent, nowMs);
      let nextFlashEventCount = state.flashEventCount;
      let nextFlashEventAt = state.nextFlashEventAt;
      let nextFlashCooldownUntil = state.flashCooldownUntil;
      let nextPendingMission = state.pendingMission;
      let nextActiveMission = state.activeMission;
      let nextMissionHistory = state.missionHistory;
      let nextNpcReputation = state.npcReputation;
      let nextMissionCount = state.missionCount;
      let nextMissionAt = state.nextMissionAt;
      let nextStreak = expireStreakIfNeeded(state.streak, nowMs);
      let nextDailyChallenges = state.dailyChallenges;
      let nextDailyChallengeDayKey = state.dailyChallengeDayKey;
      let nextDistrictStates = normalizeDistrictStates(state.districtStates, nowMs);
      let nextDistrictStateCount = state.districtStateCount;
      let nextDistrictStateAt = state.nextDistrictStateAt;
      let nextResources = state.resources;
      let nextPositions = state.positions;
      let nextProgression = state.progression;
      let nextBalanceObol = state.balanceObol;
      let nextHeatWarning = state.heatWarning;
      let nextRankCelebration = state.rankCelebration;
      let nextTradeJuice = state.tradeJuice;
      let nextBounty = getBountyByHeat(nextResources.heat);
      let nextAwayReport = state.awayReport;
      let didMutate = nextActiveFlashEvent !== state.activeFlashEvent || nextStreak !== state.streak || nextDistrictStates !== state.districtStates;

      const expiredFlash = state.activeFlashEvent && !nextActiveFlashEvent ? state.activeFlashEvent : null;
      if (expiredFlash) {
        nextFlashCooldownUntil = nowMs + FLASH_EVENT_COOLDOWN_MS;
        nextFlashEventAt = nextFlashCooldownUntil + getNextFlashEventDelay(ENGAGEMENT_SEED, nextFlashEventCount) * getBountyFlashFrequencyMultiplier(nextBounty.level);
        nextNotifications = addNotification(nextNotifications, `EVENT EXPIRED: ${expiredFlash.headline}.`, "info");
        if (expiredFlash.type === "eagent_scan" && nextResources.heat > 50) {
          const stream = seededStream(`${expiredFlash.id}:forced-raid`);
          const losses: Record<string, number> = {};
          for (const [ticker, position] of Object.entries(nextPositions)) {
            losses[ticker] = Math.max(1, Math.floor(position.quantity * (0.25 + stream() * 0.35)));
          }
          if (Object.keys(losses).length > 0 && authority.applyRaidLoss) {
            const raidState = await authority.applyRaidLoss(state.playerId, losses);
            nextPositions = toPositionMap(raidState.positions);
            nextResources = raidState.resources;
          }
          const raidRank = await authority.updateXp(state.playerId, 100, "eagent_scan_raid");
          nextRankCelebration = maybeRankCelebration(nextProgression, raidRank) ?? nextRankCelebration;
          nextProgression = raidRank;
          nextNotifications = addNotification(nextNotifications, "ALERT: eAgent RAID! Scanner lock resolved the hard way.", "danger");
          // AUDIO: raid_warning.wav on eAgent proximity
          didMutate = true;
        }
      }

      if (!nextActiveFlashEvent && nowMs >= nextFlashEventAt && nowMs >= nextFlashCooldownUntil) {
        nextActiveFlashEvent = createFlashEvent({
          nowMs,
          seed: ENGAGEMENT_SEED,
          index: nextFlashEventCount,
        });
        nextFlashEventCount += 1;
        nextNotifications = addNotification(nextNotifications, nextActiveFlashEvent.headline, "warning");
        // AUDIO: event_spawn.wav on flash event
        if (nextActiveFlashEvent.type === "eagent_scan") {
          // AUDIO: raid_warning.wav on eAgent proximity
        }
        didMutate = true;
      }

      const dayKey = getDailyChallengeDayKey(nowMs);
      if (dayKey !== nextDailyChallengeDayKey) {
        nextDailyChallengeDayKey = dayKey;
        nextDailyChallenges = createDailyChallenges(nowMs, nextProgression.level);
        nextNotifications = addNotification(nextNotifications, "Daily challenges refreshed.", "info");
        didMutate = true;
      }

      if (nowMs >= nextDistrictStateAt) {
        const district = createDistrictShift({
          nowMs,
          seed: ENGAGEMENT_SEED,
          index: nextDistrictStateCount,
        });
        nextDistrictStates = {
          ...nextDistrictStates,
          [district.locationId]: district,
        };
        nextDistrictStateCount += 1;
        nextDistrictStateAt = district.endTimestamp + getNextDistrictShiftDelay(ENGAGEMENT_SEED, nextDistrictStateCount);
        nextNotifications = addNotification(nextNotifications, districtAnnouncement(district), district.state === "BOOM" ? "success" : "warning");
        didMutate = true;
      }

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
        nextNotifications = addNotification(nextNotifications, `Arrived at ${location.name}.`, "success");
        didMutate = true;
      }

      nextShipments = nextShipments.map((shipment) => {
        if (shipment.status !== "transit" || shipment.arrivalTime > nowMs) {
          return shipment;
        }

        const service = getCourierService(shipment.courierUsed);
        const stream = seededStream(`${shipment.id}:${shipment.arrivalTime}:${service.id}`);
        const lossChance = shipment.lossChance ?? service.lossChance;
        const lost = stream() < lossChance;
        didMutate = true;
        if (lost) {
          nextNotifications = addNotification(nextNotifications, `Courier intercepted! Lost ${shipment.quantity} ${shipment.ticker}. Risk: ${shipment.riskLevel ?? getBountyRiskLabel(lossChance)}.`, "danger");
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
        nextDailyChallenges = advanceDailyChallengeProgress(nextDailyChallenges, { courier_success: 1 });
        nextNotifications = addNotification(
          nextNotifications,
          `Shipment of ${shipment.quantity} ${shipment.ticker} arrived at ${getLocation(shipment.destinationId).name}. Claim it when you travel there.`,
          "success",
        );
        return arrived;
      });

      if (!nextPendingMission && !nextActiveMission && nowMs >= nextMissionAt) {
        nextPendingMission = createMission({
          nowMs,
          seed: ENGAGEMENT_SEED,
          index: nextMissionCount,
          rankLevel: nextProgression.level,
          prices: state.prices,
          rewardMultiplier: nextBounty.missionRewardMultiplier,
          faction: state.profile?.faction ?? null,
          npcReputation: nextNpcReputation,
        });
        nextMissionCount += 1;
        nextMissionAt = nowMs + getNextMissionDelay(ENGAGEMENT_SEED, nextMissionCount);
        nextNotifications = addNotification(nextNotifications, `${nextPendingMission.title}: ${nextPendingMission.description}`, "info");
        didMutate = true;
      }

      if (nextPendingMission && !nextPendingMission.accepted && nowMs >= nextPendingMission.startTimestamp + 3 * 60_000) {
        const expired = markMissionStatus(nextPendingMission, "failed", nowMs);
        nextPendingMission = null;
        nextMissionHistory = [expired, ...nextMissionHistory].slice(0, 20);
        nextNpcReputation = {
          ...nextNpcReputation,
          [expired.npcId]: (nextNpcReputation[expired.npcId] ?? 0) + expired.reputationChangeOnFail,
        };
        nextNotifications = addNotification(nextNotifications, `Mission from ${expired.npcName} expired.`, "warning");
        didMutate = true;
      }

      if (nextActiveMission) {
        const progress = getMissionProgress({
          mission: nextActiveMission,
          positions: nextPositions,
          currentLocationId: nextWorld.currentLocationId,
          nowMs,
        });
        if (progress.complete || progress.failed) {
          const completed = progress.complete;
          const finishedMission = markMissionStatus(nextActiveMission, completed ? "completed" : "failed", nowMs);
          nextMissionHistory = [finishedMission, ...nextMissionHistory].slice(0, 20);
          nextNpcReputation = {
            ...nextNpcReputation,
            [finishedMission.npcId]: (nextNpcReputation[finishedMission.npcId] ?? 0) + (completed ? finishedMission.reputationChangeOnSuccess : finishedMission.reputationChangeOnFail),
          };
          nextActiveMission = null;
          nextMissionAt = nowMs + getNextMissionDelay(ENGAGEMENT_SEED, nextMissionCount);
          if (completed) {
            const ledger = authority.grantReward
              ? await authority.grantReward(state.playerId, finishedMission.reward0Bol, `mission_${finishedMission.type}`)
              : [];
            const rank = await authority.updateXp(state.playerId, finishedMission.rewardXp, "mission_complete");
            nextBalanceObol = latestBalance(nextBalanceObol, ledger);
            nextRankCelebration = maybeRankCelebration(nextProgression, rank) ?? nextRankCelebration;
            nextProgression = rank;
            nextNotifications = addNotification(nextNotifications, `Mission complete: ${finishedMission.title}.`, "success");
            // AUDIO: mission_complete.wav on mission finish
          } else {
            nextNotifications = addNotification(nextNotifications, `Mission failed: ${finishedMission.title}. Contact disappointed.`, "warning");
          }
          didMutate = true;
        }
      }

      const lastTickAt = state.clock.lastTickAt || nowMs;
      const missedTicks = Math.min(
        MAX_CATCH_UP_TICKS,
        Math.floor(Math.max(0, nowMs - lastTickAt) / GAME_TICK_MS),
      );
      let nextTick = state.tick;
      let refresh: Partial<DemoStoreState> = {};

      if (missedTicks > 0) {
        for (let index = 0; index < missedTicks; index += 1) {
          nextTick += 1;
          refresh = await refreshFromAuthority(
            state.playerId,
            nextTick,
            nextWorld.currentLocationId,
            nowMs,
            nextActiveFlashEvent,
            nextDistrictStates,
          );
          nextResources = (refresh.resources ?? nextResources) as Resources;
          nextPositions = (refresh.positions ?? nextPositions) as Record<string, Position>;
          nextProgression = (refresh.progression ?? nextProgression) as RankSnapshot;
          if (getActiveDistrictState(nextDistrictStates, nextWorld.currentLocationId, nowMs).state === "BLACKOUT") {
            nextResources = {
              ...nextResources,
              heat: Math.max(0, nextResources.heat - 2),
            };
            refresh = {
              ...refresh,
              resources: nextResources,
            };
          }

          const raidIntervalTicks = getBountyRaidIntervalTicks(nextBounty.level);
          if (nextTick % raidIntervalTicks === 0 && nextTick !== state.clock.lastRaidTick) {
            const raid = checkRaid({
              tick: nextTick,
              heat: nextResources.heat,
              positions: nextPositions,
              raidIntervalTicks,
              probabilityDivisor: nextBounty.raidProbabilityDivisor,
            });
            if (raid.triggered) {
              const raidState = authority.applyRaidLoss
                ? await authority.applyRaidLoss(state.playerId, raid.losses)
                : { positions: Object.values(nextPositions), resources: nextResources };
              const progression = await authority.updateXp(state.playerId, raid.xpBonus, "raid_survived");
              nextPositions = toPositionMap(raidState.positions);
              nextResources = raidState.resources;
              nextProgression = progression;
              refresh = {
                ...refresh,
                positions: nextPositions,
                resources: nextResources,
                progression,
              };
              nextNotifications = addNotification(nextNotifications, raid.message, "danger");
            }
          }
        }
      }

      const shouldReprice = didMutate || missedTicks > 0;
      if (shouldReprice && missedTicks === 0) {
        const basePrices = await authority.getTickPrices(nextTick);
        const prices = applyAllPriceModifiers({
          basePrices,
          locationId: nextWorld.currentLocationId,
          districtStates: nextDistrictStates,
          activeFlashEvent: nextActiveFlashEvent,
          nowMs,
          tick: nextTick,
          faction: state.profile?.faction ?? null,
          npcReputation: nextNpcReputation,
        });
        refresh = {
          ...refresh,
          prices,
          changes: buildChangeMap(state.prices, prices),
          priceHistory: appendPriceHistory(state.priceHistory, prices),
        };
      }

      const heatUpdate = updateHeatWarning(state.resources.heat, nextResources, nextNotifications);
      nextNotifications = heatUpdate.notifications;
      nextHeatWarning = heatUpdate.heatWarning ?? nextHeatWarning;
      nextResources = heatUpdate.resources;
      const bountyUpdate = updateBountyFeedback(state.resources.heat, nextResources, nextNotifications);
      nextBounty = bountyUpdate.bounty;
      nextNotifications = bountyUpdate.notifications;

      if (shouldReprice || didMutate || nextStreak !== state.streak || nextBounty.level !== state.bounty.level || nextAwayReport !== state.awayReport) {
        set({
          ...refresh,
          tick: nextTick,
          world: nextWorld,
          resources: nextResources,
          positions: nextPositions,
          progression: nextProgression,
          balanceObol: nextBalanceObol,
          activeFlashEvent: nextActiveFlashEvent,
          flashEventCount: nextFlashEventCount,
          nextFlashEventAt,
          flashCooldownUntil: nextFlashCooldownUntil,
          pendingMission: nextPendingMission,
          activeMission: nextActiveMission,
          missionHistory: nextMissionHistory,
          npcReputation: nextNpcReputation,
          missionCount: nextMissionCount,
          nextMissionAt,
          streak: nextStreak,
          dailyChallenges: nextDailyChallenges,
          dailyChallengeDayKey: nextDailyChallengeDayKey,
          districtStates: nextDistrictStates,
          districtStateCount: nextDistrictStateCount,
          nextDistrictStateAt,
          bounty: nextBounty,
          awayReport: nextAwayReport,
          tradeJuice: nextTradeJuice,
          heatWarning: nextHeatWarning,
          rankCelebration: nextRankCelebration,
          transitShipments: nextShipments,
          locationInventories: nextLocationInventories,
          notifications: nextNotifications,
          clock: {
            nowMs,
            displayTime: formatClock(nowMs),
            lastTickAt: lastTickAt + missedTicks * GAME_TICK_MS,
            lastRaidTick: nextTick % getBountyRaidIntervalTicks(nextBounty.level) === 0 ? nextTick : state.clock.lastRaidTick,
          },
        });
        await persistCurrentState();
      }
    },
    buySelected: async () => {
      const state = get();
      if (!state.playerId || state.isBusy) {
        return;
      }
      const tradeBlockReason = getTradeBlockReason(state, "BUY");
      if (tradeBlockReason) {
        commitState({ systemMessage: tradeBlockReason });
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
          priceOverride: price,
        });
        const heatUpdate = updateHeatWarning(
          state.resources.heat,
          result.resources,
          state.notifications,
        );
        const bountyUpdate = updateBountyFeedback(
          state.resources.heat,
          heatUpdate.resources,
          heatUpdate.notifications,
        );

        set({
          positions: toPositionMap(result.positions),
          resources: heatUpdate.resources,
          balanceObol: latestBalance(state.balanceObol, result.ledger),
          progression: result.rank,
          bounty: bountyUpdate.bounty,
          profile: state.profile ? { ...state.profile, rank: result.rank.level } : null,
          dailyChallenges: advanceDailyChallengeProgress(state.dailyChallenges, {
            location_trades: state.world.currentLocationId === "neon_plaza" ? 1 : 0,
          }),
          notifications: bountyUpdate.notifications,
          heatWarning: heatUpdate.heatWarning ?? state.heatWarning,
          rankCelebration: maybeRankCelebration(state.progression, result.rank),
          activeView: "market",
          isBusy: false,
          systemMessage: `[trade] buy committed // ${state.selectedTicker} x${state.orderSize} @ ${price.toFixed(2)}`,
        });
        await persistCurrentState();
      } catch {
        set({
          isBusy: false,
          systemMessage: getSafeFailureMessage("trade-buy"),
        });
        await persistCurrentState();
      }
    },
    sellSelected: async () => {
      const state = get();
      if (!state.playerId || state.isBusy) {
        return;
      }
      const tradeBlockReason = getTradeBlockReason(state, "SELL");
      if (tradeBlockReason) {
        commitState({ systemMessage: tradeBlockReason });
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
          priceOverride: price,
        });
        const nextStreak = applySellToStreak({
          streak: state.streak,
          realizedPnl: result.realizedPnl,
          nowMs: state.clock.nowMs || Date.now(),
        });
        const streakBonusXp = result.realizedPnl > 0
          ? Math.floor(result.xpGained * (nextStreak.multiplier - 1))
          : 0;
        let nextRank = result.rank;
        if (streakBonusXp > 0) {
          nextRank = await authority.updateXp(
            state.playerId,
            streakBonusXp,
            `streak_${nextStreak.count}`,
          );
        }
        const heatUpdate = updateHeatWarning(
          state.resources.heat,
          result.resources,
          state.notifications,
        );
        const bountyUpdate = updateBountyFeedback(
          state.resources.heat,
          heatUpdate.resources,
          heatUpdate.notifications,
        );
        let nextNotifications = bountyUpdate.notifications;
        const totalXp = result.xpGained + streakBonusXp;
        if (totalXp > 0) {
          nextNotifications = addNotification(nextNotifications, `XP +${totalXp}`, "success");
        }
        if (result.realizedPnl > 0) {
          // AUDIO: trade_success.wav on profit
        } else if (result.realizedPnl < 0) {
          // AUDIO: trade_loss.wav on loss
        }

        set({
          positions: toPositionMap(result.positions),
          resources: heatUpdate.resources,
          balanceObol: latestBalance(state.balanceObol, result.ledger),
          progression: nextRank,
          bounty: bountyUpdate.bounty,
          profile: state.profile ? { ...state.profile, rank: nextRank.level } : null,
          lastRealizedPnl: result.realizedPnl,
          firstTradeComplete: state.firstTradeComplete || result.realizedPnl > 0,
          streak: nextStreak,
          dailyChallenges: advanceDailyChallengeProgress(state.dailyChallenges, {
            daily_profit: Math.max(0, result.realizedPnl),
            location_trades: state.world.currentLocationId === "neon_plaza" ? 1 : 0,
          }),
          tradeJuice: {
            kind: result.realizedPnl > 0 ? "profit" : result.realizedPnl < 0 ? "loss" : "breakeven",
            pnl: result.realizedPnl,
            bigWin: result.realizedPnl > 50_000,
            createdAt: Date.now(),
          },
          heatWarning: heatUpdate.heatWarning ?? state.heatWarning,
          rankCelebration: maybeRankCelebration(state.progression, nextRank),
          activeView: "home",
          isBusy: false,
          notifications: nextNotifications,
          systemMessage: `[trade] sell executed // ${state.selectedTicker} ${formatDelta(result.realizedPnl)} 0BOL`,
        });
        await persistCurrentState();
      } catch {
        set({
          isBusy: false,
          systemMessage: getSafeFailureMessage("trade-sell"),
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
      } catch {
        set({
          isBusy: false,
          systemMessage: getSafeFailureMessage("energy"),
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
      const district = getActiveDistrictState(
        state.districtStates,
        state.world.currentLocationId,
        state.clock.nowMs,
      );
      if (district.state === "BLACKOUT") {
        commitState({ systemMessage: "[sys] blackout. bribe channel offline." });
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
          bounty: getBountyByHeat(result.resources.heat),
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
      } catch {
        set({
          isBusy: false,
          systemMessage: getSafeFailureMessage("heat"),
        });
        await persistCurrentState();
      }
    },
    sendCourierShipment: async ({ ticker, quantity, destinationId, courierId }) => {
      const state = get();
      if (!state.playerId || state.isBusy) {
        return;
      }
      const currentDistrict = getActiveDistrictState(
        state.districtStates,
        state.world.currentLocationId,
        state.clock.nowMs,
      );
      if (currentDistrict.state === "BLACKOUT") {
        commitState({ systemMessage: "[sys] blackout. courier dispatch disabled." });
        return;
      }
      const activeCourierCount = state.transitShipments.filter((shipment) => shipment.status === "transit").length;
      if (activeCourierCount >= getCourierLimit(state.progression.level)) {
        commitState({ systemMessage: "[sys] courier grid full. wait for a run to finish." });
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
        const destinationDistrict = getActiveDistrictState(
          state.districtStates,
          destination.id,
          state.clock.nowMs,
        );
        const riskChance = Math.min(
          0.95,
          courier.lossChance * getDistrictCourierRiskMultiplier(currentDistrict.state) +
            getDistrictCourierRiskBonus(currentDistrict.state) +
            state.bounty.courierRiskBonus,
        );
        const effectiveCost = roundCurrency(
          courier.cost * getFlashCourierCostMultiplier(state.activeFlashEvent, state.world.currentLocationId),
        );
        const result = await authority.transferPositionToShipment(
          state.playerId,
          ticker,
          sendQuantity,
          effectiveCost,
        );
        const nowMs = state.clock.nowMs || Date.now();
        const timeMultiplier = getDistrictCourierTimeMultiplier(destinationDistrict.state);
        const shipment: TransitShipment = {
          id: `shipment_${nowMs}_${ticker}_${destination.id}`,
          ticker,
          quantity: sendQuantity,
          avgEntry: position.avgEntry,
          destinationId: destination.id,
          arrivalTime: nowMs + destination.travelTime * 60_000 * timeMultiplier,
          courierUsed: courier.id,
          status: "transit",
          lossChance: riskChance,
          riskLevel: getBountyRiskLabel(riskChance),
          costPaid: effectiveCost,
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
      } catch {
        set({
          isBusy: false,
          systemMessage: getSafeFailureMessage("courier"),
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
      } catch {
        set({
          isBusy: false,
          systemMessage: getSafeFailureMessage("shipment"),
        });
        await persistCurrentState();
      }
    },
    acceptMission: () => {
      const state = get();
      if (!state.pendingMission) {
        return;
      }

      const mission: Mission = {
        ...state.pendingMission,
        status: "active",
        accepted: true,
        acceptedAt: state.clock.nowMs || Date.now(),
      };
      commitState({
        pendingMission: null,
        activeMission: mission,
        notifications: addNotification(
          state.notifications,
          `Mission accepted: ${mission.title}.`,
          "success",
        ),
        systemMessage: `[mission] accepted // ${mission.title}`,
      });
    },
    declineMission: () => {
      const state = get();
      if (!state.pendingMission) {
        return;
      }

      const nowMs = state.clock.nowMs || Date.now();
      const declined = markMissionStatus(state.pendingMission, "declined", nowMs);
      commitState({
        pendingMission: null,
        missionHistory: [declined, ...state.missionHistory].slice(0, 20),
        npcReputation: {
          ...state.npcReputation,
          [declined.npcId]: (state.npcReputation[declined.npcId] ?? 0) - 1,
        },
        nextMissionAt: nowMs + getNextMissionDelay(ENGAGEMENT_SEED, state.missionCount),
        notifications: addNotification(
          state.notifications,
          `Mission declined: ${declined.title}.`,
          "warning",
        ),
        systemMessage: `[mission] declined // ${declined.title}`,
      });
    },
    chooseFaction: async (faction) => {
      const state = get();
      if (!state.playerId || !state.profile || state.isBusy) {
        return;
      }

      const gate = getAgentOsFactionGate({
        rank: state.progression.level,
        firstTradeComplete: state.firstTradeComplete,
        heat: state.resources.heat,
        faction: state.profile.faction,
      });

      if (!gate.unlocked) {
        commitState({
          systemMessage: "[agentos] locked // finish rank, profit, and heat checks",
        });
        return;
      }

      const currentChoice = state.factionChoice ?? getLegacyFactionChoice(state.profile);
      const nextChoice = getNextFactionChoice({
        currentChoice,
        nextFaction: faction,
        chosenAt: new Date(state.clock.nowMs || Date.now()).toISOString(),
      });

      if (!nextChoice.ok) {
        commitState({
          systemMessage: `[agentos] ${nextChoice.reason.toLowerCase()}`,
        });
        return;
      }

      set({ isBusy: true });
      try {
        const authority = getAuthority();
        const profile = authority.chooseFaction
          ? await authority.chooseFaction(state.playerId, faction)
          : {
              ...state.profile,
              faction,
              osTier: "AGENT" as const,
            };
        const definition = getFactionDefinition(faction);
        set({
          profile,
          factionChoice: nextChoice.choice,
          isBusy: false,
          notifications: addNotification(
            state.notifications,
            `AgentOS alignment bound: ${definition.name}.`,
            "success",
          ),
          systemMessage: `[agentos] alignment bound // ${definition.name.toLowerCase()}`,
        });
        await persistCurrentState();
      } catch {
        set({
          isBusy: false,
          systemMessage: getSafeFailureMessage("faction"),
        });
        await persistCurrentState();
      }
    },
    claimDailyChallenge: async (challengeId) => {
      const state = get();
      if (!state.playerId || state.isBusy) {
        return;
      }

      const { challenges, claimed } = claimDailyChallengeEngine(
        state.dailyChallenges,
        challengeId,
      );
      if (!claimed) {
        return;
      }

      set({ isBusy: true });
      try {
        const authority = getAuthority();
        const ledger = authority.grantReward
          ? await authority.grantReward(
              state.playerId,
              claimed.rewardObol,
              `daily_${claimed.type}`,
            )
          : [];
        const rank = await authority.updateXp(
          state.playerId,
          claimed.rewardXp,
          `daily_${claimed.type}`,
        );
        set({
          dailyChallenges: challenges,
          balanceObol: latestBalance(state.balanceObol, ledger),
          progression: rank,
          profile: state.profile ? { ...state.profile, rank: rank.level } : null,
          rankCelebration: maybeRankCelebration(state.progression, rank),
          notifications: addNotification(
            state.notifications,
            `Challenge claimed: ${claimed.title}`,
            "success",
          ),
          isBusy: false,
          systemMessage: `[challenge] claimed // ${claimed.rewardObol} 0BOL`,
        });
        await persistCurrentState();
      } catch {
        set({
          isBusy: false,
          systemMessage: getSafeFailureMessage("challenge"),
        });
        await persistCurrentState();
      }
    },
    recordAwayReport: (nowMs, awayStartedAt) => {
      const state = get();
      const awayMs = Math.max(0, nowMs - awayStartedAt);
      if (awayMs < 2 * 60_000) {
        return;
      }

      const items = [
        ...state.transitShipments
          .filter((shipment) => shipment.arrivalTime >= awayStartedAt && shipment.arrivalTime <= nowMs)
          .slice(0, 4)
          .map((shipment) => ({
            id: `away_${shipment.id}`,
            tone: shipment.status === "lost" ? "danger" as const : "success" as const,
            message: shipment.status === "lost"
              ? `x Courier: ${shipment.quantity} ${shipment.ticker} lost in transit`
              : `+ Courier: ${shipment.quantity} ${shipment.ticker} arrived at ${getLocation(shipment.destinationId).name}`,
            action: "inventory" as const,
          })),
        ...(state.pendingMission && state.pendingMission.startTimestamp >= awayStartedAt
          ? [{
              id: `away_${state.pendingMission.id}`,
              tone: "warning" as const,
              message: `! Mission from ${state.pendingMission.npcName} waiting`,
              action: "missions" as const,
            }]
          : []),
        ...(state.activeFlashEvent
          ? [{
              id: `away_${state.activeFlashEvent.id}`,
              tone: state.activeFlashEvent.riskLevel === "critical" ? "danger" as const : "warning" as const,
              message: `! Flash Event: ${state.activeFlashEvent.headline}`,
              action: "terminal" as const,
            }]
          : []),
        ...Object.values(state.districtStates)
          .filter((district) => district.startTimestamp >= awayStartedAt && district.state !== "NORMAL")
          .slice(0, 3)
          .map((district) => ({
            id: `away_${district.locationId}_${district.startTimestamp}`,
            tone: district.state === "BOOM" || district.state === "FESTIVAL" ? "success" as const : "warning" as const,
            message: `! ${getLocation(district.locationId).name} entered ${district.state}`,
            action: "travel" as const,
          })),
      ].slice(0, 8);

      commitState({
        awayReport: {
          id: `away_${nowMs}`,
          createdAt: nowMs,
          minutesAway: Math.max(2, Math.round(awayMs / 60_000)),
          items: items.length
            ? items
            : [{ id: `away_quiet_${nowMs}`, tone: "info", message: "No major events. The grid kept humming." }],
          dismissed: false,
        },
      });
    },
    dismissAwayReport: () => {
      const state = get();
      if (!state.awayReport) {
        return;
      }
      commitState({
        awayReport: {
          ...state.awayReport,
          dismissed: true,
        },
      });
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
