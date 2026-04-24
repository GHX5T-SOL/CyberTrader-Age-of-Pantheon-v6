import type { PropsWithChildren, ReactNode } from "react";
import { ScrollView, Text, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { palette } from "@/theme/colors";

const monoFamily = process.env.EXPO_OS === "ios" ? "Menlo" : "monospace";

interface MobileGameShellProps extends PropsWithChildren {
  eyebrow?: string;
  title?: string;
  right?: ReactNode;
  scroll?: boolean;
}

export function MobileGameShell({
  eyebrow,
  title,
  right,
  scroll = true,
  children,
}: MobileGameShellProps) {
  const { width } = useWindowDimensions();
  const frameWidth = Math.min(width, 430);
  const content = (
    <View style={{ gap: 18, paddingHorizontal: 18, paddingTop: 18, paddingBottom: 34 }}>
      {title ? (
        <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
          <View style={{ flex: 1, gap: 4 }}>
            {eyebrow ? (
              <Text
                selectable
                style={{
                  color: palette.accent.magenta,
                  fontSize: 11,
                  letterSpacing: 2.2,
                  textTransform: "uppercase",
                  fontFamily: monoFamily,
                }}
              >
                {eyebrow}
              </Text>
            ) : null}
            <Text
              selectable
              style={{
                color: palette.fg.primary,
                fontSize: 22,
                fontWeight: "800",
                letterSpacing: 1.2,
                textTransform: "uppercase",
                fontFamily: monoFamily,
              }}
            >
              {title}
            </Text>
          </View>
          {right}
        </View>
      ) : null}
      {children}
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, alignItems: "center", backgroundColor: palette.bg.void }}>
      <LinearGradient
        pointerEvents="none"
        colors={[palette.bg.void, palette.bg.elevated, palette.bg.void]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }}
      />
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          width: 280,
          height: 280,
          top: -80,
          right: -110,
          borderRadius: 999,
          backgroundColor: palette.alpha.magenta18,
        }}
      />
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          width: 260,
          height: 260,
          bottom: -80,
          left: -120,
          borderRadius: 999,
          backgroundColor: palette.alpha.cyan18,
        }}
      />
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          opacity: 0.22,
        }}
      >
        {Array.from({ length: 18 }).map((_, index) => (
          <View
            key={index}
            style={{
              height: 1,
              marginTop: 22,
              backgroundColor: index % 2 === 0 ? palette.alpha.cyan35 : palette.alpha.magenta35,
            }}
          />
        ))}
      </View>
      <View style={{ flex: 1, width: frameWidth, backgroundColor: palette.bg.void }}>
        {scroll ? (
          <ScrollView
            contentInsetAdjustmentBehavior="automatic"
            style={{ flex: 1 }}
            contentContainerStyle={{ minHeight: "100%" }}
          >
            {content}
          </ScrollView>
        ) : (
          content
        )}
      </View>
    </SafeAreaView>
  );
}
