import * as React from "react";
import { router } from "expo-router";
import { Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useDemoBootstrap } from "@/hooks/use-demo-bootstrap";
import { useDemoStore } from "@/state/demo-store";
import { terminalColors, terminalFont } from "@/theme/terminal";

export default function IndexRoute() {
  const isHydrated = useDemoBootstrap();
  const phase = useDemoStore((state) => state.phase);
  const opacity = useSharedValue(1);

  React.useEffect(() => {
    opacity.value = withRepeat(
      withSequence(withTiming(0.5, { duration: 500 }), withTiming(1, { duration: 500 })),
      -1,
    );
  }, [opacity]);

  React.useEffect(() => {
    if (!isHydrated) {
      return;
    }

    const timeout = setTimeout(() => {
      if (phase === "boot") {
        router.replace("/boot");
      } else if (phase === "home") {
        router.replace("/home");
      } else if (phase === "handle" || phase === "login") {
        router.replace("/login");
      } else if (phase === "terminal") {
        router.replace("/terminal");
      } else {
        router.replace("/intro");
      }
    }, 250);

    return () => clearTimeout(timeout);
  }, [isHydrated, phase]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Animated.View style={animatedStyle}>
        <Text style={{ fontFamily: terminalFont, color: terminalColors.muted, fontSize: 12 }}>
          INITIALIZING...
        </Text>
      </Animated.View>
    </View>
  );
}
