import type { LocalAuthoritySnapshot } from "@/authority/local-authority";
import type { MarketNews, PlayerProfile, Position, RankSnapshot, Resources } from "@/engine/types";
import type { ChangeMap, PriceMap } from "@/engine/demo-market";
import type {
  DemoPhase,
  GameClockState,
  GameNotification,
  TerminalView,
  WorldState,
} from "@/state/demo-store";
import type { LocationInventoryMap, TransitShipment } from "@/data/locations";

const STORAGE_KEY = "cybertrader.phase1.terminal-frontend.v4";

interface PersistedDemoSession {
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
  progression?: RankSnapshot;
  clock?: GameClockState;
  world?: WorldState;
  notifications?: GameNotification[];
  transitShipments?: TransitShipment[];
  locationInventories?: LocationInventoryMap;
  selectedTicker: string;
  orderSize: number;
  lastRealizedPnl: number | null;
  firstTradeComplete: boolean;
  introSeen: boolean;
  tutorialCompleted: boolean;
  systemMessage: string;
  authoritySnapshot: LocalAuthoritySnapshot | null;
}

interface StorageEngine {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

let cachedEngine: StorageEngine | null = null;

function getStorageEngine(): StorageEngine | null {
  if (cachedEngine) {
    return cachedEngine;
  }

  if (process.env.EXPO_OS === "web") {
    if (typeof globalThis === "undefined" || !("localStorage" in globalThis)) {
      return null;
    }

    cachedEngine = {
      getItem: (key) => globalThis.localStorage.getItem(key),
      setItem: (key, value) => globalThis.localStorage.setItem(key, value),
      removeItem: (key) => globalThis.localStorage.removeItem(key),
    };

    return cachedEngine;
  }

  try {
    const { MMKV } = require("react-native-mmkv") as typeof import("react-native-mmkv");
    const storage = new MMKV({ id: STORAGE_KEY });

    cachedEngine = {
      getItem: (key) => storage.getString(key) ?? null,
      setItem: (key, value) => {
        storage.set(key, value);
      },
      removeItem: (key) => {
        storage.delete(key);
      },
    };

    return cachedEngine;
  } catch {
    return null;
  }
}

export async function loadDemoSession(): Promise<PersistedDemoSession | null> {
  const storage = getStorageEngine();
  if (!storage) {
    return null;
  }

  const raw = storage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as PersistedDemoSession;
  } catch {
    storage.removeItem(STORAGE_KEY);
    return null;
  }
}

export async function saveDemoSession(session: PersistedDemoSession): Promise<void> {
  const storage = getStorageEngine();
  if (!storage) {
    return;
  }

  storage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export async function clearDemoSession(): Promise<void> {
  const storage = getStorageEngine();
  storage?.removeItem(STORAGE_KEY);
}

export type { PersistedDemoSession };
