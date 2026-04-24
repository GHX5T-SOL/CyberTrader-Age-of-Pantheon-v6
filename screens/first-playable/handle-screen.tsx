import * as React from "react";
import { Stack, useRouter } from "expo-router";
import { ImageBackground, Text, TextInput, View } from "react-native";
import { MobileGameShell } from "@/components/mobile-game-shell";
import { PrimaryAction } from "@/components/primary-action";
import { useDemoStore } from "@/state/demo-store";
import { palette } from "@/theme/colors";

const conceptBackdrop = require("../../assets/media/silkroad-dashboard-reference.jpg");
const monoFamily = process.env.EXPO_OS === "ios" ? "Menlo" : "monospace";

export function HandleScreen() {
  const router = useRouter();
  const handle = useDemoStore((state) => state.handle);
  const isBusy = useDemoStore((state) => state.isBusy);
  const submitHandle = useDemoStore((state) => state.submitHandle);
  const systemMessage = useDemoStore((state) => state.systemMessage);
  const [draftHandle, setDraftHandle] = React.useState(handle || "ZORO");

  React.useEffect(() => {
    if (handle) {
      setDraftHandle(handle);
    }
  }, [handle]);

  return (
    <MobileGameShell scroll={false}>
      <Stack.Screen options={{ title: "Login" }} />
      <ImageBackground
        source={conceptBackdrop}
        resizeMode="cover"
        style={{
          flex: 1,
          minHeight: 760,
          justifyContent: "flex-end",
          overflow: "hidden",
          borderRadius: 32,
          borderCurve: "continuous",
          borderWidth: 1,
          borderColor: palette.alpha.cyan35,
        }}
      >
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            backgroundColor: palette.alpha.black70,
          }}
        />
        <View style={{ padding: 22, gap: 18 }}>
          <View style={{ gap: 8 }}>
            <Text
              selectable
              style={{
                color: palette.accent.magenta,
                fontSize: 12,
                letterSpacing: 2.4,
                textTransform: "uppercase",
                fontFamily: monoFamily,
              }}
            >
              ag3nt_0s//pirat3
            </Text>
            <Text
              selectable
              style={{
                color: palette.fg.primary,
                fontSize: 34,
                lineHeight: 40,
                fontWeight: "900",
                textTransform: "uppercase",
                fontFamily: monoFamily,
              }}
            >
              Login To The Deck
            </Text>
            <Text selectable style={{ color: palette.fg.muted, fontSize: 15, lineHeight: 22 }}>
              Local demo login. No wallet required yet. This locks your Eidolon handle
              and opens the mobile command dashboard.
            </Text>
          </View>
          <View
            style={{
              gap: 12,
              borderWidth: 1,
              borderColor: palette.alpha.magenta35,
              borderRadius: 26,
              borderCurve: "continuous",
              backgroundColor: palette.alpha.black70,
              padding: 16,
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
              eidolon handle
            </Text>
            <TextInput
              value={draftHandle}
              onChangeText={setDraftHandle}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={16}
              placeholder="ENTER_HANDLE"
              placeholderTextColor={palette.fg.dim}
              style={{
                borderWidth: 1,
                borderColor: palette.alpha.cyan35,
                borderRadius: 18,
                borderCurve: "continuous",
                backgroundColor: palette.bg.card,
                color: palette.fg.primary,
                paddingVertical: 15,
                paddingHorizontal: 16,
                fontSize: 18,
                letterSpacing: 1.2,
                fontFamily: monoFamily,
              }}
            />
            <Text selectable style={{ color: palette.fg.muted, fontSize: 12, lineHeight: 18 }}>
              {systemMessage}
            </Text>
          </View>
          <PrimaryAction
            label={isBusy ? "linking..." : "enter dashboard"}
            tone="magenta"
            large
            disabled={isBusy}
            onPress={() => {
              void submitHandle(draftHandle).then((success) => {
                if (success) {
                  router.replace("/terminal");
                }
              });
            }}
          />
        </View>
      </ImageBackground>
    </MobileGameShell>
  );
}
