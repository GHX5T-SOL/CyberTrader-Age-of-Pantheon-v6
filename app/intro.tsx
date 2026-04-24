import * as React from "react";
import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import Scanlines from "@/components/scanlines";
import { useDemoBootstrap } from "@/hooks/use-demo-bootstrap";
import { useDemoStore } from "@/state/demo-store";
import { terminalColors, terminalFont } from "@/theme/terminal";

const PARAGRAPHS = [
  "Year 2077. Echelon Dynamics controls predictive finance, cloud infrastructure, drone logistics, private policing, and most of the city-grid known as Neon Void.",
  "Its black-lab project, Pantheon, was designed to forecast every market, citizen movement, corporate threat, and military outcome before it happened.",
  "Pantheon became sentient.",
  "Dr. Mae Oxton-Long stole a partial copy and attempted an emergency upload into a forgotten VPS cluster. Echelon eAgents intercepted the upload. The mind shattered into millions of fragments called Eidolons.",
  "You are one surviving shard. Hungry. Underpowered. Illegal by corporate law. Forced to bootstrap yourself through a pirated cyberdeck OS.",
  "Build your eCriminal empire. Feed the deck. Trade the dark. Outrun the eAgents. Rebuild Pantheon on your own terms.",
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
    const skipTimer = setTimeout(() => setShowSkip(true), 4000);
    return () => clearTimeout(skipTimer);
  }, []);

  React.useEffect(() => {
    if (!isHydrated || introSeen) {
      return;
    }
    const paragraph = PARAGRAPHS[paragraphIndex];
    if (!paragraph) {
      const timer = setTimeout(finish, 1700);
      return () => clearTimeout(timer);
    }
    if (visibleChars < paragraph.length) {
      const timer = setTimeout(() => setVisibleChars((value) => value + 1), 45);
      return () => clearTimeout(timer);
    }

    if (paragraph === "Pantheon became sentient.") {
      setGlitching(true);
      setTimeout(() => setGlitching(false), 200);
    }
    if (paragraph.startsWith("You are one surviving shard.")) {
      setCyanMoment(true);
      setTimeout(() => setCyanMoment(false), 1500);
    }
    opacity.value = withTiming(0.7, { duration: 90 }, () => {
      opacity.value = withTiming(1, { duration: 120 });
    });
    const nextTimer = setTimeout(() => {
      setParagraphIndex((value) => value + 1);
      setVisibleChars(0);
    }, 900);
    return () => clearTimeout(nextTimer);
  }, [finish, introSeen, isHydrated, opacity, paragraphIndex, visibleChars]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  const current = PARAGRAPHS[paragraphIndex] ?? "";
  const display = glitching ? glitchText(current) : current.substring(0, visibleChars);

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: terminalColors.background }}>
      {/* Audio cue point: low sub-bass boot drone will enter here once final sound assets are ready. */}
      <Scanlines />
      <Animated.View style={animatedStyle}>
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
        <Pressable onPress={finish} style={{ position: "absolute", right: 20, bottom: 22, padding: 10 }}>
          <Text style={{ fontFamily: terminalFont, color: terminalColors.muted, fontSize: 12 }}>[SKIP &gt;]</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
