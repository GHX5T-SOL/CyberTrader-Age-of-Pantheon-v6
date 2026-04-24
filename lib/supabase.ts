import { Platform } from "react-native";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { MMKV } from "react-native-mmkv";

const rawUseSupabase =
  process.env.EXPO_PUBLIC_USE_SUPABASE_AUTHORITY ?? process.env.USE_SUPABASE;

export const USE_SUPABASE_AUTHORITY = rawUseSupabase === "true";

const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() ??
  process.env.SUPABASE_URL?.trim() ??
  "";

const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() ??
  process.env.SUPABASE_ANON_KEY?.trim() ??
  "";

const nativeStorage = (() => {
  if (Platform.OS === "web") {
    return undefined;
  }

  const storage = new MMKV({ id: "cybertrader.supabase-session" });

  return {
    getItem: (key: string) => Promise.resolve(storage.getString(key) ?? null),
    setItem: (key: string, value: string) => {
      storage.set(key, value);
      return Promise.resolve();
    },
    removeItem: (key: string) => {
      storage.delete(key);
      return Promise.resolve();
    },
  };
})();

export const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase: SupabaseClient | null =
  USE_SUPABASE_AUTHORITY && hasSupabaseConfig
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          autoRefreshToken: true,
          detectSessionInUrl: Platform.OS === "web",
          persistSession: true,
          storage: nativeStorage,
        },
      })
    : null;

export async function requireSupabase(): Promise<SupabaseClient> {
  if (!supabase) {
    throw new Error(
      "Supabase is not configured. Set EXPO_PUBLIC_USE_SUPABASE_AUTHORITY=true, EXPO_PUBLIC_SUPABASE_URL, and EXPO_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    const { error } = await supabase.auth.signInAnonymously();
    if (error) {
      throw new Error(`Supabase anonymous auth failed: ${error.message}`);
    }
  }

  return supabase;
}
