import * as React from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { BurgerMenu } from "@/components/burger-menu";
import { TerminalShell } from "@/components/terminal-shell";
import { MenuContext } from "@/context/menu-context";
import { useDemoBootstrap } from "@/hooks/use-demo-bootstrap";
import { useGameLoop } from "@/hooks/use-game-loop";
import { terminalColors } from "@/theme/terminal";

export default function RootLayout() {
  const [menuVisible, setMenuVisible] = React.useState(false);
  useDemoBootstrap();
  useGameLoop();

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
