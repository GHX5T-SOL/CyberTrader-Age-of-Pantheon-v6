import { Redirect } from "expo-router";
import { HandleScreen } from "@/screens/first-playable/handle-screen";
import { HydrationScreen } from "@/screens/first-playable/hydration-screen";
import { useDemoBootstrap } from "@/hooks/use-demo-bootstrap";
import { useDemoStore } from "@/state/demo-store";
import { getDemoHref } from "@/state/demo-routes";

export default function HandleRoute() {
  const isHydrated = useDemoBootstrap();
  const phase = useDemoStore((state) => state.phase);
  const activeView = useDemoStore((state) => state.activeView);

  if (!isHydrated) {
    return <HydrationScreen />;
  }

  if (phase !== "handle") {
    return <Redirect href={getDemoHref(phase, activeView)} />;
  }

  return <HandleScreen />;
}
