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
import { getDemoHref } from "@/state/demo-routes";
import { useDemoStore } from "@/state/demo-store";
import { terminalColors, terminalFont } from "@/theme/terminal";

export default function IndexRoute() {
  const isHydrated = useDemoBootstrap();
  const phase = useDemoStore((state) => state.phase);
  const activeView = useDemoStore((state) => state.activeView);
  const introSeen = useDemoStore((state) => state.introSeen);
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
      router.replace(getDemoHref(phase, activeView, introSeen));
    }, 250);

    return () => clearTimeout(timeout);
  }, [activeView, introSeen, isHydrated, phase]);

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
