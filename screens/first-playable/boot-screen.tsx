import * as React from "react";
import { ResizeMode, Video } from "expo-av";
import { Stack, useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { MobileGameShell } from "@/components/mobile-game-shell";
import { PrimaryAction } from "@/components/primary-action";
import { useDemoStore } from "@/state/demo-store";
import { palette } from "@/theme/colors";

const introVideo = require("../../assets/media/intro-cinematic.mp4");
const monoFamily = process.env.EXPO_OS === "ios" ? "Menlo" : "monospace";

export function BootScreen() {
  const router = useRouter();
  const isBusy = useDemoStore((state) => state.isBusy);
  const moveToHandle = useDemoStore((state) => state.moveToHandle);
  const [hasStarted, setHasStarted] = React.useState(false);
  const [videoDone, setVideoDone] = React.useState(false);
  const hasContinuedRef = React.useRef(false);

  const continueToLogin = () => {
    if (hasContinuedRef.current) {
      return;
    }
    hasContinuedRef.current = true;
    moveToHandle();
    router.replace("/handle");
  };

  return (
    <MobileGameShell scroll={false}>
      <Stack.Screen options={{ title: "Intro" }} />
      <View style={{ flex: 1, minHeight: 760, justifyContent: "space-between", gap: 18 }}>
        <View
          style={{
            flex: 1,
            minHeight: 560,
            overflow: "hidden",
            borderWidth: 1,
            borderColor: palette.alpha.magenta35,
            borderRadius: 32,
            borderCurve: "continuous",
            backgroundColor: palette.bg.card,
          }}
        >
          <Video
            source={introVideo}
            shouldPlay={hasStarted}
            isLooping={false}
            isMuted={false}
            resizeMode={ResizeMode.COVER}
            useNativeControls={false}
            onPlaybackStatusUpdate={(status) => {
              if (status.isLoaded && status.didJustFinish) {
                setVideoDone(true);
                continueToLogin();
              }
            }}
            style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }}
          />
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              bottom: 0,
              left: 0,
              backgroundColor: palette.alpha.black50,
            }}
          />
          <View
            style={{
              position: "absolute",
              top: 22,
              left: 20,
              right: 20,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <View style={{ gap: 4, flex: 1 }}>
              <Text
                selectable
                style={{
                  color: palette.accent.magenta,
                  fontSize: 12,
                  letterSpacing: 2,
                  textTransform: "uppercase",
                  fontFamily: monoFamily,
                }}
              >
                cybertrader
              </Text>
              <Text
                selectable
                style={{
                  color: palette.fg.primary,
                  fontSize: 24,
                  fontWeight: "900",
                  letterSpacing: 1.2,
                  textTransform: "uppercase",
                  fontFamily: monoFamily,
                }}
              >
                Age of Pantheon
              </Text>
            </View>
            <Pressable
              onPress={continueToLogin}
              style={{
                borderWidth: 1,
                borderColor: palette.alpha.white16,
                borderRadius: 999,
                paddingHorizontal: 12,
                paddingVertical: 8,
                backgroundColor: palette.alpha.black50,
              }}
            >
              <Text
                selectable
                style={{
                  color: palette.fg.primary,
                  fontSize: 11,
                  letterSpacing: 1.4,
                  textTransform: "uppercase",
                  fontFamily: monoFamily,
                }}
              >
                Skip
              </Text>
            </Pressable>
          </View>
          <View
            style={{
              position: "absolute",
              left: 20,
              right: 20,
              bottom: 22,
              gap: 12,
            }}
          >
            <View
              style={{
                borderWidth: 1,
                borderColor: palette.alpha.cyan35,
                borderRadius: 22,
                borderCurve: "continuous",
                backgroundColor: palette.alpha.black70,
                padding: 16,
                gap: 8,
              }}
            >
              <Text
                selectable
                style={{
                  color: palette.accent.cyan,
                  fontSize: 11,
                  letterSpacing: 2,
                  textTransform: "uppercase",
                  fontFamily: monoFamily,
                }}
              >
                opening transmission
              </Text>
              <Text
                selectable
                style={{
                  color: palette.fg.primary,
                  fontSize: 18,
                  lineHeight: 25,
                  fontWeight: "700",
                }}
              >
                You wake as a rogue Eidolon inside a stolen cyberdeck. The city is
                watching. The market is alive.
              </Text>
            </View>
            <PrimaryAction
              label={!hasStarted ? "play opening" : videoDone ? "enter login" : "skip to login"}
              tone="magenta"
              large
              disabled={isBusy}
              onPress={() => {
                if (!hasStarted) {
                  setHasStarted(true);
                  return;
                }

                continueToLogin();
              }}
            />
          </View>
        </View>
      </View>
    </MobileGameShell>
  );
}
