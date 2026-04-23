import type { Authority } from "@/engine/types";
import {
  LocalAuthority,
  type LocalAuthoritySnapshot,
} from "@/authority/local-authority";
import { SupabaseAuthority } from "@/authority/supabase-authority";

let activeAuthority: Authority = new LocalAuthority();

export function getAuthority(): Authority {
  return activeAuthority;
}

export function resetAuthority(mode: "local" | "supabase" = "local"): Authority {
  activeAuthority =
    mode === "supabase" ? new SupabaseAuthority() : new LocalAuthority();

  return activeAuthority;
}

export function restoreLocalAuthority(
  snapshot: LocalAuthoritySnapshot | null,
): Authority {
  activeAuthority = snapshot
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
