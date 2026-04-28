import * as React from "react";
import { Stack, usePathname } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { BurgerMenu } from "@/components/burger-menu";
import { TerminalShell } from "@/components/terminal-shell";
import { MenuContext } from "@/context/menu-context";
import { useDemoBootstrap } from "@/hooks/use-demo-bootstrap";
import { useGameLoop } from "@/hooks/use-game-loop";
import {
  installRuntimeDiagnostics,
  type RuntimeDiagnosticContext,
} from "@/state/runtime-diagnostics";
import { useDemoStore } from "@/state/demo-store";
import { terminalColors } from "@/theme/terminal";

function balanceBand(balanceObol: number): string {
  if (balanceObol >= 1_000_000) {
    return ">=1m";
  }
  if (balanceObol >= 100_000) {
    return "100k-999k";
  }
  if (balanceObol >= 10_000) {
    return "10k-99k";
  }
  return "<10k";
}

export default function RootLayout() {
  const [menuVisible, setMenuVisible] = React.useState(false);
  const pathname = usePathname();
  const phase = useDemoStore((state) => state.phase);
  const activeView = useDemoStore((state) => state.activeView);
  const tick = useDemoStore((state) => state.tick);
  const heat = useDemoStore((state) => state.resources.heat);
  const balanceObol = useDemoStore((state) => state.balanceObol);
  const selectedTicker = useDemoStore((state) => state.selectedTicker);
  const handlePresent = useDemoStore((state) => Boolean(state.handle));
  const playerIdPresent = useDemoStore((state) => Boolean(state.playerId));
  const hydrated = useDemoStore((state) => state.isHydrated);
  const diagnosticsContextRef = React.useRef<RuntimeDiagnosticContext>({
    route: pathname,
    platform: Platform.OS,
    phase,
    activeView,
    tick,
    heat,
    balanceBand: balanceBand(balanceObol),
    selectedTicker,
    handlePresent,
    playerIdPresent,
    hydrated,
  });

  diagnosticsContextRef.current = {
    route: pathname,
    platform: Platform.OS,
    phase,
    activeView,
    tick,
    heat,
    balanceBand: balanceBand(balanceObol),
    selectedTicker,
    handlePresent,
    playerIdPresent,
    hydrated,
  };

  useDemoBootstrap();
  useGameLoop();

  React.useEffect(() => installRuntimeDiagnostics(() => diagnosticsContextRef.current), []);

  React.useEffect(() => {
    if (Platform.OS !== "web" || typeof document === "undefined") {
      return undefined;
    }

    const root = document.getElementById("root");
    const previousHtmlBackground = document.documentElement.style.backgroundColor;
    const previousBodyBackground = document.body.style.backgroundColor;
    const previousBodyMargin = document.body.style.margin;
    const previousRootBackground = root?.style.backgroundColor;
    const previousRootMinHeight = root?.style.minHeight;

    document.documentElement.style.backgroundColor = terminalColors.background;
    document.body.style.backgroundColor = terminalColors.background;
    document.body.style.margin = "0";
    if (root) {
      root.style.backgroundColor = terminalColors.background;
      root.style.minHeight = "100%";
    }

    return () => {
      document.documentElement.style.backgroundColor = previousHtmlBackground;
      document.body.style.backgroundColor = previousBodyBackground;
      document.body.style.margin = previousBodyMargin;
      if (root) {
        root.style.backgroundColor = previousRootBackground ?? "";
        root.style.minHeight = previousRootMinHeight ?? "";
      }
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: terminalColors.background }}>
      <StatusBar style="light" />
      <MenuContext.Provider
        value={{
          openMenu: () => setMenuVisible(true),
          closeMenu: () => setMenuVisible(false),
        }}
      >
        <TerminalShell>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: terminalColors.background },
              animation: "fade",
            }}
          />
          <BurgerMenu visible={menuVisible} onClose={() => setMenuVisible(false)} />
        </TerminalShell>
      </MenuContext.Provider>
    </GestureHandlerRootView>
  );
}
