import type { DemoPhase, TerminalView } from "@/state/demo-store";

export type DemoHref = "/video-intro" | "/intro" | "/login" | "/boot" | "/home" | "/terminal";

export interface DemoRouteSnapshot {
  isHydrated: boolean;
  phase: DemoPhase;
  activeView: TerminalView;
  introSeen: boolean;
  playerId: string | null;
}

export function getDemoHref(
  phase: DemoPhase,
  activeView: TerminalView,
  introSeen = false,
): DemoHref {
  if (phase === "intro") {
    return introSeen ? "/login" : "/video-intro";
  }

  if (phase === "login") {
    return "/login";
  }

  if (phase === "boot") {
    return "/boot";
  }

  if (phase === "handle") {
    return "/login";
  }

  if (phase === "home") {
    return "/home";
  }

  return "/terminal";
}

export function getPlayableRouteRedirect(snapshot: DemoRouteSnapshot): DemoHref | null {
  if (!snapshot.isHydrated) {
    return null;
  }

  if (snapshot.phase === "boot") {
    return "/boot";
  }

  if (snapshot.playerId) {
    return null;
  }

  if (snapshot.phase === "home" || snapshot.phase === "terminal") {
    return "/login";
  }

  return getDemoHref(snapshot.phase, snapshot.activeView, snapshot.introSeen);
}

export function getMenuBackFallbackHref(snapshot: Pick<DemoRouteSnapshot, "phase" | "playerId">): DemoHref {
  if (snapshot.playerId) {
    return "/home";
  }

  if (snapshot.phase === "boot") {
    return "/boot";
  }

  return "/login";
}
