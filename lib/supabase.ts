import { Platform } from "react-native";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { MMKV } from "react-native-mmkv";

const rawUseSupabaseAuthority =
  process.env.EXPO_PUBLIC_USE_SUPABASE_AUTHORITY ??
  process.env.USE_SUPABASE_AUTHORITY;
const rawUseSupabase =
  process.env.EXPO_PUBLIC_USE_SUPABASE ??
  process.env.USE_SUPABASE;

export const USE_SUPABASE =
  rawUseSupabase === "true" || rawUseSupabaseAuthority === "true";
export const USE_SUPABASE_AUTHORITY =
  rawUseSupabaseAuthority === "true" ||
  (rawUseSupabaseAuthority === undefined && USE_SUPABASE);

const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() ??
  process.env.SUPABASE_URL?.trim() ??
  "";

const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() ??
  process.env.SUPABASE_ANON_KEY?.trim() ??
  "";

export const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey);

const nativeStorage = (() => {
  if (Platform.OS === "web") {
    return undefined;
  }

  const storage = new MMKV({ id: "supabase-session" });

  return {
    getItem: (key: string) => {
      try {
        return Promise.resolve(storage.getString(key) ?? null);
      } catch {
        return Promise.resolve(null);
      }
    },
    setItem: (key: string, value: string) => {
      try {
        storage.set(key, value);
      } catch {
        return Promise.resolve();
      }

      return Promise.resolve();
    },
    removeItem: (key: string) => {
      try {
        storage.delete(key);
      } catch {
        return Promise.resolve();
      }

      return Promise.resolve();
    },
  };
})();

export const supabase: SupabaseClient | null =
  USE_SUPABASE && hasSupabaseConfig
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
      "Supabase is not configured. Set USE_SUPABASE=true, EXPO_PUBLIC_SUPABASE_URL, and EXPO_PUBLIC_SUPABASE_ANON_KEY.",
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
