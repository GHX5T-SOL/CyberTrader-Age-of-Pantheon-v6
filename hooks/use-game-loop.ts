import * as React from "react";
import { AppState, type AppStateStatus } from "react-native";
import { useDemoStore } from "@/state/demo-store";

export function useGameLoop() {
  const runGameLoop = useDemoStore((state) => state.runGameLoop);
  const recordAwayReport = useDemoStore((state) => state.recordAwayReport);

  React.useEffect(() => {
    let active = true;
    let busy = false;
    let backgroundedAt: number | null = null;

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
        const awayStartedAt = backgroundedAt;
        backgroundedAt = null;
        if (awayStartedAt && Date.now() - awayStartedAt > 2 * 60_000) {
          void runGameLoop(Date.now()).then(() => recordAwayReport(Date.now(), awayStartedAt));
          return;
        }
        tick();
      } else {
        backgroundedAt = Date.now();
      }
    });

    return () => {
      active = false;
      clearInterval(interval);
      subscription.remove();
    };
  }, [recordAwayReport, runGameLoop]);
}
