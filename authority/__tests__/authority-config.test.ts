const SUPABASE_ENV_KEYS = [
  "EXPO_PUBLIC_USE_SUPABASE_AUTHORITY",
  "USE_SUPABASE_AUTHORITY",
  "EXPO_PUBLIC_USE_SUPABASE",
  "USE_SUPABASE",
  "EXPO_PUBLIC_SUPABASE_URL",
  "SUPABASE_URL",
  "EXPO_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_ANON_KEY",
] as const;

const ORIGINAL_ENV = process.env;

function clearSupabaseEnv() {
  for (const key of SUPABASE_ENV_KEYS) {
    delete process.env[key];
  }
}

function mockSupabaseClient() {
  jest.doMock("@supabase/supabase-js", () => ({
    createClient: jest.fn(() => ({
      auth: {
        getSession: jest.fn(async () => ({ data: { session: { user: { id: "test" } } } })),
        signInAnonymously: jest.fn(async () => ({ error: null })),
      },
      from: jest.fn(),
      functions: { invoke: jest.fn() },
      rpc: jest.fn(),
    })),
  }));
}

describe("authority configuration", () => {
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...ORIGINAL_ENV };
    clearSupabaseEnv();
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
    jest.resetModules();
    jest.dontMock("@supabase/supabase-js");
  });

  it("uses LocalAuthority by default", () => {
    const { getAuthority, LocalAuthority } = require("@/authority") as typeof import("@/authority");

    expect(getAuthority()).toBeInstanceOf(LocalAuthority);
  });

  it("keeps LocalAuthority when SupabaseAuthority is enabled without full public config", () => {
    process.env.USE_SUPABASE_AUTHORITY = "true";
    process.env.SUPABASE_URL = "https://example.supabase.co";

    const { getAuthority, LocalAuthority } = require("@/authority") as typeof import("@/authority");

    expect(getAuthority()).toBeInstanceOf(LocalAuthority);
  });

  it("selects SupabaseAuthority only when the feature flag and public config are present", () => {
    process.env.USE_SUPABASE_AUTHORITY = "true";
    process.env.SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_ANON_KEY = "test-anon-key";
    mockSupabaseClient();

    const { USE_SUPABASE_AUTHORITY, hasSupabaseConfig } =
      require("@/lib/supabase") as typeof import("@/lib/supabase");
    const { getAuthority, SupabaseAuthority } = require("@/authority") as typeof import("@/authority");

    expect(USE_SUPABASE_AUTHORITY).toBe(true);
    expect(hasSupabaseConfig).toBe(true);
    expect(getAuthority()).toBeInstanceOf(SupabaseAuthority);
  });

  it("lets the generic Supabase client flag stay separate from the authority override", () => {
    process.env.USE_SUPABASE = "true";
    process.env.USE_SUPABASE_AUTHORITY = "false";
    process.env.SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_ANON_KEY = "test-anon-key";
    mockSupabaseClient();

    const { getAuthority, LocalAuthority } = require("@/authority") as typeof import("@/authority");

    expect(getAuthority()).toBeInstanceOf(LocalAuthority);
  });
});
