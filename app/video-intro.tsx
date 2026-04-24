import * as React from "react";
import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { ResizeMode, Video } from "expo-av";
import { useDemoBootstrap } from "@/hooks/use-demo-bootstrap";
import { useDemoStore } from "@/state/demo-store";
import { terminalColors, terminalFont } from "@/theme/terminal";

const INTRO_VIDEO = require("../assets/media/intro-cinematic.mp4");

export default function VideoIntroRoute() {
  const isHydrated = useDemoBootstrap();
  const introSeen = useDemoStore((state) => state.introSeen);
  const [canSkip, setCanSkip] = React.useState(false);

  React.useEffect(() => {
    if (isHydrated && introSeen) {
      router.replace("/login");
    }
  }, [introSeen, isHydrated]);

  React.useEffect(() => {
    const timer = setTimeout(() => setCanSkip(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  const finish = React.useCallback(() => {
    router.replace("/intro");
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: terminalColors.background }}>
      <Video
        source={INTRO_VIDEO}
        resizeMode={ResizeMode.COVER}
        shouldPlay
        isLooping={false}
        style={{ flex: 1 }}
        onPlaybackStatusUpdate={(status) => {
          if (status.isLoaded && status.didJustFinish) {
            finish();
          }
        }}
      />
      {canSkip ? (
        <Pressable onPress={finish} style={{ position: "absolute", right: 20, bottom: 22, padding: 10 }}>
          <Text style={{ fontFamily: terminalFont, color: terminalColors.muted, fontSize: 12 }}>[SKIP &gt;]</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
