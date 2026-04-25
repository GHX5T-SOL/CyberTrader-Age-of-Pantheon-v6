import * as React from "react";
import { router } from "expo-router";
import { useDemoBootstrap } from "@/hooks/use-demo-bootstrap";
import { getPlayableRouteRedirect } from "@/state/demo-routes";
import { useDemoStore } from "@/state/demo-store";

export function useDemoRouteGuard(): boolean {
  const isHydrated = useDemoBootstrap();
  const phase = useDemoStore((state) => state.phase);
  const activeView = useDemoStore((state) => state.activeView);
  const introSeen = useDemoStore((state) => state.introSeen);
  const playerId = useDemoStore((state) => state.playerId);
  const redirectHref = getPlayableRouteRedirect({
    isHydrated,
    phase,
    activeView,
    introSeen,
    playerId,
  });

  React.useEffect(() => {
    if (redirectHref) {
      router.replace(redirectHref);
    }
  }, [redirectHref]);

  return isHydrated && redirectHref === null;
}
