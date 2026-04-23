import type { DemoPhase, TerminalView } from "@/state/demo-store";

export function getDemoHref(
  phase: DemoPhase,
  activeView: TerminalView,
): "/boot" | "/handle" | "/terminal" | "/market" {
  if (phase === "boot") {
    return "/boot";
  }

  if (phase === "handle") {
    return "/handle";
  }

  return activeView === "market" ? "/market" : "/terminal";
}
