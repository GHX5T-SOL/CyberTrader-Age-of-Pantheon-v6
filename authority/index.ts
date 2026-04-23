import type { Authority } from "@/engine/types";
import { LocalAuthority } from "@/authority/local-authority";
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

export { LocalAuthority, SupabaseAuthority };
