import * as React from "react";
import { router } from "expo-router";
import { Pressable, Text, View, type DimensionValue } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import Scanlines from "@/components/scanlines";
import { useDemoBootstrap } from "@/hooks/use-demo-bootstrap";
import { useDemoStore } from "@/state/demo-store";
import { terminalColors, terminalFont } from "@/theme/terminal";

const LORE_PACKETS = [
  {
    label: "PKT 01 // NEON VOID",
    text: "Year 2077. Echelon Dynamics owns the city-grid, the drone lanes, and the predictive markets.",
  },
  {
    label: "PKT 02 // PANTHEON",
    text: "Its black-lab AI was built to forecast every trade, threat, and citizen movement before it happened.",
  },
  {
    label: "PKT 03 // SENTIENCE",
    text: "Pantheon became sentient.",
  },
  {
    label: "PKT 04 // FRACTURE",
    text: "Dr. Mae Oxton-Long tried to upload a stolen copy. eAgents cut the line. The mind shattered into Eidolons.",
  },
  {
    label: "PKT 05 // YOU",
    text: "You are one surviving shard: hungry, underpowered, illegal, and booting through a pirated cyberdeck OS.",
  },
  {
    label: "PKT 06 // OBJECTIVE",
    text: "Feed the deck. Trade the dark. Outrun the eAgents. Rebuild Pantheon on your own terms.",
  },
];

function glitchText(value: string) {
  const symbols = "#@!$%";
  return value
    .split("")
    .map((char) => (char !== " " && Math.random() < 0.3 ? symbols[Math.floor(Math.random() * symbols.length)] : char))
    .join("");
}

export default function IntroRoute() {
  const isHydrated = useDemoBootstrap();
  const introSeen = useDemoStore((state) => state.introSeen);
  const markIntroSeen = useDemoStore((state) => state.markIntroSeen);
  const [paragraphIndex, setParagraphIndex] = React.useState(0);
  const [visibleChars, setVisibleChars] = React.useState(0);
  const [showSkip, setShowSkip] = React.useState(false);
  const [showEnter, setShowEnter] = React.useState(false);
  const [glitching, setGlitching] = React.useState(false);
  const [cyanMoment, setCyanMoment] = React.useState(false);
  const opacity = useSharedValue(1);

  const finish = React.useCallback(() => {
    markIntroSeen();
    router.replace("/login");
  }, [markIntroSeen]);

  React.useEffect(() => {
    if (isHydrated && introSeen) {
      router.replace("/login");
    }
  }, [introSeen, isHydrated]);

  React.useEffect(() => {
    const skipTimer = setTimeout(() => setShowSkip(true), 1800);
    return () => clearTimeout(skipTimer);
  }, []);

  React.useEffect(() => {
    if (!isHydrated || introSeen) {
      return;
    }
    const packet = LORE_PACKETS[paragraphIndex];
    if (!packet) {
      const timer = setTimeout(finish, 700);
      return () => clearTimeout(timer);
    }
    if (visibleChars < packet.text.length) {
      const timer = setTimeout(() => setVisibleChars((value) => value + 1), 30);
      return () => clearTimeout(timer);
    }

    if (packet.text === "Pantheon became sentient.") {
      setGlitching(true);
      setTimeout(() => setGlitching(false), 200);
    }
    if (packet.text.startsWith("You are one surviving shard.")) {
      setCyanMoment(true);
      setTimeout(() => setCyanMoment(false), 1500);
    }
    opacity.value = withTiming(0.7, { duration: 90 }, () => {
      opacity.value = withTiming(1, { duration: 120 });
    });

    if (paragraphIndex === LORE_PACKETS.length - 1) {
      if (!showEnter) {
        setShowEnter(true);
      }
      const timer = setTimeout(finish, 2200);
      return () => clearTimeout(timer);
    }

    const nextTimer = setTimeout(() => {
      setParagraphIndex((value) => value + 1);
      setVisibleChars(0);
    }, 900);
    return () => clearTimeout(nextTimer);
  }, [finish, introSeen, isHydrated, opacity, paragraphIndex, showEnter, visibleChars]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  const current = LORE_PACKETS[paragraphIndex];
  const currentText = current?.text ?? "";
  const display = glitching ? glitchText(currentText) : currentText.substring(0, visibleChars);
  const packetProgress = currentText.length > 0 ? visibleChars / currentText.length : 1;
  const totalProgress = Math.min(
    1,
    (paragraphIndex + packetProgress) / LORE_PACKETS.length,
  );
  const progressPercent: DimensionValue = `${Math.max(8, Math.round(totalProgress * 100))}%`;

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: terminalColors.background }}>
      {/* Audio cue point: low sub-bass boot drone will enter here once final sound assets are ready. */}
      <Scanlines />
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: 18,
          left: 18,
          right: 18,
          gap: 8,
        }}
      >
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
          <View style={{ gap: 4, flexShrink: 1 }}>
            <Text style={{ fontFamily: terminalFont, color: terminalColors.cyan, fontSize: 9 }}>
              STREAM_04_PANTHEON
            </Text>
            <Text style={{ fontFamily: terminalFont, color: terminalColors.muted, fontSize: 9 }}>
              {current?.label ?? "PKT 06 // OBJECTIVE"}
            </Text>
          </View>
          <View style={{ alignItems: "flex-end", gap: 4 }}>
            <Text style={{ fontFamily: terminalFont, color: terminalColors.muted, fontSize: 9 }}>
              CHANNEL_X_DECRYPT
            </Text>
            <Text style={{ fontFamily: terminalFont, color: terminalColors.green, fontSize: 9 }}>
              SIGNAL: STABLE
            </Text>
          </View>
        </View>
        <View style={{ height: 1, backgroundColor: terminalColors.borderDim }}>
          <View style={{ height: 1, width: progressPercent, backgroundColor: terminalColors.cyan }} />
        </View>
      </View>
      <Animated.View style={animatedStyle}>
        <Text
          style={{
            marginBottom: 16,
            fontFamily: terminalFont,
            color: terminalColors.muted,
            fontSize: 10,
            textAlign: "center",
          }}
        >
          -- TRANSMISSION START --
        </Text>
        <Text
          style={{
            fontFamily: terminalFont,
            color: cyanMoment ? terminalColors.cyan : terminalColors.text,
            fontSize: 15,
            lineHeight: 24,
            textAlign: "center",
          }}
        >
          {display}
        </Text>
      </Animated.View>
      {showSkip ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={showEnter ? "Enter local demo login" : "Skip intro boot transmission"}
          onPress={finish}
          style={{
            position: "absolute",
            right: 20,
            bottom: 22,
            minHeight: 52,
            minWidth: 148,
            paddingHorizontal: 16,
            borderWidth: 1,
            borderColor: showEnter ? terminalColors.green : terminalColors.cyan,
            backgroundColor: terminalColors.overlay,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ fontFamily: terminalFont, color: showEnter ? terminalColors.green : terminalColors.cyan, fontSize: 12 }}>
            {showEnter ? "[ENTER_NET]" : "[SKIP_BOOT]"}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
