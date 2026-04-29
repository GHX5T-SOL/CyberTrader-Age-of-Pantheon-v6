import * as React from "react";
import { router } from "expo-router";
import { Pressable, Text, View, type DimensionValue } from "react-native";
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
  const [videoProgress, setVideoProgress] = React.useState(0);
  const pulse = useSharedValue(0.35);

  React.useEffect(() => {
    if (isHydrated && introSeen) {
      router.replace("/login");
    }
  }, [introSeen, isHydrated]);

  React.useEffect(() => {
    const timer = setTimeout(() => setCanSkip(true), 1200);
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
  const progressPercent = Math.max(8, Math.min(100, Math.round(videoProgress * 100)));
  const progressWidth: DimensionValue = `${videoFailed ? 72 : progressPercent}%`;

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
              const duration = status.durationMillis ?? 0;
              if (duration > 0) {
                setVideoProgress(Math.min(1, status.positionMillis / duration));
              }
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
            <View style={{ marginTop: 16 }}>
              <Text style={{ fontFamily: terminalFont, color: terminalColors.green, fontSize: 10 }}>
                [OK] EIDOLON_SIG_MATCH
              </Text>
              <Text style={{ marginTop: 5, fontFamily: terminalFont, color: terminalColors.muted, fontSize: 10 }}>
                [OK] PACKET_STITCH_COMPLETE
              </Text>
            </View>
          </NeonBorder>
        </View>
      )}
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: 14,
          left: 16,
          right: 16,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <View style={{ gap: 4 }}>
          <Text style={{ fontFamily: terminalFont, color: terminalColors.cyan, fontSize: 9 }}>
            STREAM_04_PANTHEON
          </Text>
          <Text style={{ fontFamily: terminalFont, color: terminalColors.muted, fontSize: 9 }}>
            PKT: CINEMATIC_HANDSHAKE
          </Text>
        </View>
        <View style={{ alignItems: "flex-end", gap: 4 }}>
          <Text style={{ fontFamily: terminalFont, color: terminalColors.muted, fontSize: 9 }}>
            CHANNEL_X_DECRYPT
          </Text>
          <Text style={{ fontFamily: terminalFont, color: videoFailed ? terminalColors.amber : terminalColors.green, fontSize: 9 }}>
            SIGNAL: {videoFailed ? "DEGRADED" : videoReady ? "STABLE" : "BUFFERING"}
          </Text>
        </View>
      </View>
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          left: 24,
          right: 24,
          bottom: 92,
          alignItems: "center",
          gap: 6,
        }}
      >
        <Text style={{ fontFamily: terminalFont, color: terminalColors.dim, fontSize: 8 }}>
          {videoFailed ? "FALLBACK HANDSHAKE ACTIVE" : "LATENCY RECOVERY 0.04s"}
        </Text>
        <View style={{ width: 132, height: 1, backgroundColor: terminalColors.border }}>
          <View
            style={{
              height: 1,
              width: progressWidth,
              backgroundColor: videoFailed ? terminalColors.amber : terminalColors.cyan,
            }}
          />
        </View>
      </View>
      {!videoReady && !videoFailed ? (
        <Text style={{ position: "absolute", left: 18, bottom: 24, fontFamily: terminalFont, color: terminalColors.muted, fontSize: 10 }}>
          BUFFERING CINEMATIC FEED...
        </Text>
      ) : null}
      {canSkip ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={videoFailed ? "Enter lore transmission" : "Skip cinematic intro"}
          onPress={finish}
          style={{
            position: "absolute",
            right: 20,
            bottom: 22,
            minHeight: 52,
            minWidth: 148,
            paddingHorizontal: 16,
            borderWidth: 1,
            borderColor: videoFailed ? terminalColors.amber : terminalColors.cyan,
            backgroundColor: terminalColors.overlay,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ fontFamily: terminalFont, color: videoFailed ? terminalColors.amber : terminalColors.cyan, fontSize: 12 }}>
            {videoFailed ? "[ENTER_LORE]" : "[SKIP_BOOT]"}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
