import * as React from "react";
import { AppState, type AppStateStatus } from "react-native";
import { useDemoStore } from "@/state/demo-store";

export function useGameLoop() {
  const runGameLoop = useDemoStore((state) => state.runGameLoop);

  React.useEffect(() => {
    let active = true;
    let busy = false;

    const tick = () => {
      if (!active || busy) {
        return;
      }

      busy = true;
      void runGameLoop(Date.now()).finally(() => {
        busy = false;
      });
    };

    tick();
    const interval = setInterval(tick, 1000);
    const subscription = AppState.addEventListener("change", (status: AppStateStatus) => {
      if (status === "active") {
        tick();
      }
    });

    return () => {
      active = false;
      clearInterval(interval);
      subscription.remove();
    };
  }, [runGameLoop]);
}
