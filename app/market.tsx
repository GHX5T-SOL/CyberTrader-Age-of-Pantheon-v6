import { Redirect } from "expo-router";
import { HydrationScreen } from "@/screens/first-playable/hydration-screen";
import { MarketScreen } from "@/screens/first-playable/market-screen";
import { useDemoBootstrap } from "@/hooks/use-demo-bootstrap";
import { useDemoStore } from "@/state/demo-store";
import { getDemoHref } from "@/state/demo-routes";

export default function MarketRoute() {
  const isHydrated = useDemoBootstrap();
  const phase = useDemoStore((state) => state.phase);
  const activeView = useDemoStore((state) => state.activeView);

  if (!isHydrated) {
    return <HydrationScreen />;
  }

  if (phase !== "terminal" || activeView !== "market") {
    return <Redirect href={getDemoHref(phase, activeView)} />;
  }

  return <MarketScreen />;
}
