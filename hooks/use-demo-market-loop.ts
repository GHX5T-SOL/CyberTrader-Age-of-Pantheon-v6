import * as React from "react";
import { useDemoStore } from "@/state/demo-store";

export function useDemoMarketLoop() {
  const phase = useDemoStore((state) => state.phase);
  const isHydrated = useDemoStore((state) => state.isHydrated);
  const advanceMarket = useDemoStore((state) => state.advanceMarket);

  React.useEffect(() => {
    if (!isHydrated || phase !== "terminal") {
      return;
    }

    const interval = setInterval(() => {
      void advanceMarket();
    }, 2600);

    return () => clearInterval(interval);
  }, [advanceMarket, isHydrated, phase]);
}
