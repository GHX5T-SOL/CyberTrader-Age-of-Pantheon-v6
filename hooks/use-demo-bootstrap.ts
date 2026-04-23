import * as React from "react";
import { useDemoStore } from "@/state/demo-store";

export function useDemoBootstrap() {
  const isHydrated = useDemoStore((state) => state.isHydrated);
  const hydrateDemo = useDemoStore((state) => state.hydrateDemo);

  React.useEffect(() => {
    if (isHydrated) {
      return;
    }

    void hydrateDemo();
  }, [hydrateDemo, isHydrated]);

  return isHydrated;
}
