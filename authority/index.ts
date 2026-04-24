import type { Authority } from "@/engine/types";
import {
  LocalAuthority,
  type LocalAuthoritySnapshot,
} from "@/authority/local-authority";
import { SupabaseAuthority } from "@/authority/supabase-authority";
import { USE_SUPABASE_AUTHORITY, hasSupabaseConfig } from "@/lib/supabase";

function createConfiguredAuthority(): Authority {
  return USE_SUPABASE_AUTHORITY && hasSupabaseConfig
    ? new SupabaseAuthority()
    : new LocalAuthority();
}

let activeAuthority: Authority = createConfiguredAuthority();

export function getAuthority(): Authority {
  return activeAuthority;
}

export function resetAuthority(mode: "local" | "supabase" = "local"): Authority {
  activeAuthority = mode === "supabase" ? new SupabaseAuthority() : new LocalAuthority();

  return activeAuthority;
}

export function resetConfiguredAuthority(): Authority {
  activeAuthority = createConfiguredAuthority();
  return activeAuthority;
}

export function restoreLocalAuthority(
  snapshot: LocalAuthoritySnapshot | null,
): Authority {
  activeAuthority =
    USE_SUPABASE_AUTHORITY && hasSupabaseConfig
      ? new SupabaseAuthority()
      : snapshot
        ? LocalAuthority.fromSnapshot(snapshot)
        : new LocalAuthority();

  return activeAuthority;
}

export function exportAuthoritySnapshot(): LocalAuthoritySnapshot | null {
  return activeAuthority instanceof LocalAuthority
    ? activeAuthority.exportSnapshot()
    : null;
}

export { LocalAuthority, SupabaseAuthority };
