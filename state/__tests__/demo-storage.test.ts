type MemoryStorage = {
  getItem: jest.Mock<string | null, [string]>;
  setItem: jest.Mock<void, [string, string]>;
  removeItem: jest.Mock<void, [string]>;
  values: Map<string, string>;
};

const STORAGE_KEY = "cybertrader.phase1.terminal-frontend.v4";

function createMemoryStorage(): MemoryStorage {
  const values = new Map<string, string>();

  return {
    values,
    getItem: jest.fn((key) => values.get(key) ?? null),
    setItem: jest.fn((key, value) => {
      values.set(key, value);
    }),
    removeItem: jest.fn((key) => {
      values.delete(key);
    }),
  };
}

async function loadStorageModule(storage: MemoryStorage) {
  jest.resetModules();
  jest.doMock("react-native-mmkv", () => ({
    MMKV: jest.fn(() => ({
      getString: storage.getItem,
      set: storage.setItem,
      delete: storage.removeItem,
    })),
  }));

  return require("@/state/demo-storage") as typeof import("@/state/demo-storage");
}

describe("demo storage", () => {
  afterEach(() => {
    jest.resetModules();
    jest.dontMock("react-native-mmkv");
  });

  it("round-trips a persisted session through native storage", async () => {
    const storage = createMemoryStorage();
    const { loadDemoSession, saveDemoSession } = await loadStorageModule(storage);
    const session = {
      phase: "market",
      activeView: "trade",
      handle: "QA_STORAGE",
      playerId: "player-1",
      authoritySnapshot: null,
    };

    await saveDemoSession(session as never);

    await expect(loadDemoSession()).resolves.toMatchObject(session);
    expect(storage.setItem).toHaveBeenCalledWith(STORAGE_KEY, expect.any(String));
  });

  it("clears corrupt persisted data and recovers to a fresh session", async () => {
    const storage = createMemoryStorage();
    storage.values.set(STORAGE_KEY, "{not-json");

    const { loadDemoSession } = await loadStorageModule(storage);

    await expect(loadDemoSession()).resolves.toBeNull();
    expect(storage.removeItem).toHaveBeenCalledWith(STORAGE_KEY);
    expect(storage.values.has(STORAGE_KEY)).toBe(false);
  });

  it("clears the current persisted session on reset", async () => {
    const storage = createMemoryStorage();
    storage.values.set(STORAGE_KEY, JSON.stringify({ phase: "terminal" }));

    const { clearDemoSession } = await loadStorageModule(storage);

    await clearDemoSession();

    expect(storage.removeItem).toHaveBeenCalledWith(STORAGE_KEY);
    expect(storage.values.has(STORAGE_KEY)).toBe(false);
  });
});
