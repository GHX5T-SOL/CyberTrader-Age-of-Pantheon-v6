import * as React from "react";
import { Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Scanlines from "@/components/scanlines";
import { terminalColors, terminalFont } from "@/theme/terminal";

export interface TerminalShellProps {
  children: React.ReactNode;
  showStatusBar?: boolean;
}

function formatClock(date: Date): string {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function TerminalShell({ children, showStatusBar = true }: TerminalShellProps) {
  const [clock, setClock] = React.useState(() => formatClock(new Date()));

  React.useEffect(() => {
    const interval = setInterval(() => setClock(formatClock(new Date())), 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: terminalColors.background }}>
      {showStatusBar ? (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 10,
            height: 32,
            paddingHorizontal: 12,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: terminalColors.status,
            borderBottomWidth: 1,
            borderBottomColor: terminalColors.borderDim,
          }}
        >
          <Text style={{ fontFamily: terminalFont, fontSize: 11, color: terminalColors.cyan }}>
            AG3NT_0S//pIRAT3
          </Text>
          <Text style={{ fontFamily: terminalFont, fontSize: 11, color: terminalColors.muted }}>
            {clock}
          </Text>
        </View>
      ) : null}
      <View style={{ flex: 1, paddingTop: showStatusBar ? 32 : 0 }}>
        {children}
        <Text
          style={{
            fontFamily: terminalFont,
            fontSize: 10,
            color: terminalColors.dim,
            textAlign: "center",
            paddingBottom: 8,
          }}
        >
          //PIRATE OS v0.1.3
        </Text>
      </View>
      <View pointerEvents="none" style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }}>
        {Array.from({ length: 200 }).map((_, index) => (
          <View
            key={index}
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: index * 4,
              height: 1,
              backgroundColor: terminalColors.scanline,
            }}
          />
        ))}
      </View>
      <LinearGradient
        pointerEvents="none"
        colors={["transparent", terminalColors.vignette]}
        start={{ x: 0.5, y: 0.5 }}
        end={{ x: 1, y: 1 }}
        style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }}
      />
      <Scanlines />
    </View>
  );
}

export default TerminalShell;

