import * as React from "react";
import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { ResizeMode, Video } from "expo-av";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import NeonBorder from "@/components/neon-border";
import { useDemoBootstrap } from "@/hooks/use-demo-bootstrap";
import { useDemoStore } from "@/state/demo-store";
import { terminalColors, terminalFont } from "@/theme/terminal";

const INTRO_VIDEO = require("../assets/media/intro-cinematic.mp4");

export default function VideoIntroRoute() {
  const isHydrated = useDemoBootstrap();
  const introSeen = useDemoStore((state) => state.introSeen);
  const [canSkip, setCanSkip] = React.useState(false);
  const [videoReady, setVideoReady] = React.useState(false);
  const [videoFailed, setVideoFailed] = React.useState(false);
  const pulse = useSharedValue(0.35);

  React.useEffect(() => {
    if (isHydrated && introSeen) {
      router.replace("/login");
    }
  }, [introSeen, isHydrated]);

  React.useEffect(() => {
    const timer = setTimeout(() => setCanSkip(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  React.useEffect(() => {
    pulse.value = withRepeat(
      withSequence(withTiming(1, { duration: 900 }), withTiming(0.35, { duration: 900 })),
      -1,
    );
  }, [pulse]);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (!videoReady) {
        setVideoFailed(true);
      }
    }, 3500);
    return () => clearTimeout(timer);
  }, [videoReady]);

  const finish = React.useCallback(() => {
    router.replace("/intro");
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: pulse.value }));

  return (
    <View style={{ flex: 1, backgroundColor: terminalColors.background }}>
      {!videoFailed ? (
        <Video
          source={INTRO_VIDEO}
          resizeMode={ResizeMode.COVER}
          shouldPlay
          isMuted
          volume={0}
          rate={1}
          useNativeControls={false}
          isLooping={false}
          style={{ flex: 1, opacity: videoReady ? 1 : 0.35 }}
          onReadyForDisplay={() => setVideoReady(true)}
          onError={() => setVideoFailed(true)}
          onPlaybackStatusUpdate={(status) => {
            if (status.isLoaded) {
              setVideoReady(true);
              if (status.didJustFinish) {
                finish();
              }
            }
          }}
        />
      ) : (
        <View style={{ flex: 1, justifyContent: "center", padding: 24 }}>
          <NeonBorder active style={{ borderColor: terminalColors.cyan, padding: 18 }}>
            <Text style={{ fontFamily: terminalFont, color: terminalColors.red, fontSize: 12 }}>
              SYSTEM FAILURE // PANTHEON COMPROMISED
            </Text>
            <Animated.Text style={[{ marginTop: 18, fontFamily: terminalFont, color: terminalColors.cyan, fontSize: 28 }, animatedStyle]}>
              YOU ARE ONLINE
            </Animated.Text>
            <Text style={{ marginTop: 12, fontFamily: terminalFont, color: terminalColors.text, fontSize: 18 }}>
              SURVIVE. TRADE. ASCEND.
            </Text>
            <View style={{ marginTop: 20, height: 5, backgroundColor: terminalColors.borderDim }}>
              <Animated.View style={[{ height: 5, width: "72%", backgroundColor: terminalColors.cyan }, animatedStyle]} />
            </View>
            <Text style={{ marginTop: 14, fontFamily: terminalFont, color: terminalColors.muted, fontSize: 10 }}>
              CINEMATIC LINK DEGRADED // FALLBACK TERMINAL HANDSHAKE ACTIVE
            </Text>
          </NeonBorder>
        </View>
      )}
      {!videoReady && !videoFailed ? (
        <Text style={{ position: "absolute", left: 18, bottom: 24, fontFamily: terminalFont, color: terminalColors.muted, fontSize: 10 }}>
          BUFFERING CINEMATIC FEED...
        </Text>
      ) : null}
      {canSkip ? (
        <Pressable onPress={finish} style={{ position: "absolute", right: 20, bottom: 22, padding: 10 }}>
          <Text style={{ fontFamily: terminalFont, color: terminalColors.muted, fontSize: 12 }}>[SKIP &gt;]</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
