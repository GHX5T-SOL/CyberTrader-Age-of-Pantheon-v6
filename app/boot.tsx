import * as React from "react";
import { router } from "expo-router";
import { Text, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useDemoBootstrap } from "@/hooks/use-demo-bootstrap";
import { useDemoStore } from "@/state/demo-store";
import { terminalColors, terminalFont } from "@/theme/terminal";

const BOOT_LINES = [
  "BIOS_0X3F...................... OK",
  "ROOTFS MOUNT /SCRATCH.......... OK",
  "KERNEL PATCH 7X9.............. LOADED",
  "SIGNAL INTEGRITY .............. 78%",
  "eAGENT CLOAK .................. ACTIVE",
  "MEMORY CHECK .................. 2.1TB / 4.0TB",
  "AG3NT_0S//pIRAT3 .............. BOOTING",
];

export default function BootRoute() {
  useDemoBootstrap();
  const completeBoot = useDemoStore((state) => state.completeBoot);
  const [visibleLines, setVisibleLines] = React.useState<string[]>([]);
  const [staticNoise, setStaticNoise] = React.useState("");
  const flash = useSharedValue(0);

  React.useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    BOOT_LINES.forEach((line, index) => {
      timers.push(setTimeout(() => setVisibleLines((current) => [...current, line]), 350 * index));
    });
    timers.push(
      setTimeout(() => {
        flash.value = withTiming(1, { duration: 50 }, () => {
          flash.value = withTiming(0, { duration: 50 });
        });
        setStaticNoise(Array.from({ length: 220 }, () => "#@!$%01"[Math.floor(Math.random() * 7)]).join(""));
      }, 350 * BOOT_LINES.length + 800),
    );
    timers.push(setTimeout(() => setStaticNoise(""), 350 * BOOT_LINES.length + 1000));
    timers.push(
      setTimeout(() => {
        void completeBoot().then(() => router.replace("/home"));
      }, 350 * BOOT_LINES.length + 1200),
    );
    return () => timers.forEach(clearTimeout);
  }, [completeBoot, flash]);

  const flashStyle = useAnimatedStyle(() => ({ opacity: flash.value }));

  return (
    <View style={{ flex: 1, justifyContent: "flex-end", padding: 20, backgroundColor: terminalColors.background }}>
      {visibleLines.map((line) => (
        <Text key={line} style={{ fontFamily: terminalFont, color: terminalColors.systemGreen, fontSize: 12, marginBottom: 8 }}>
          {line}
        </Text>
      ))}
      {staticNoise ? (
        <Text style={{ position: "absolute", top: 80, left: 18, right: 18, fontFamily: terminalFont, color: terminalColors.cyan, fontSize: 11 }}>
          {staticNoise}
        </Text>
      ) : null}
      <Animated.View pointerEvents="none" style={[{ position: "absolute", inset: 0, backgroundColor: terminalColors.text }, flashStyle]} />
    </View>
  );
}
