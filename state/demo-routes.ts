import type { DemoPhase, TerminalView } from "@/state/demo-store";

export function getDemoHref(
  phase: DemoPhase,
  activeView: TerminalView,
): "/intro" | "/login" | "/boot" | "/handle" | "/home" | "/terminal" {
  if (phase === "intro") {
    return "/intro";
  }

  if (phase === "login") {
    return "/login";
  }

  if (phase === "boot") {
    return "/boot";
  }

  if (phase === "handle") {
    return "/handle";
  }

  if (phase === "home") {
    return "/home";
  }

  return "/terminal";
}
