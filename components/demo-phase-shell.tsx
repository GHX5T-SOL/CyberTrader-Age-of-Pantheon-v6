import type { PropsWithChildren } from "react";
import { ScrollView, Text, View } from "react-native";
import { palette } from "@/theme/colors";

const monoFamily = process.env.EXPO_OS === "ios" ? "Menlo" : "monospace";

interface DemoPhaseShellProps extends PropsWithChildren {
  eyebrow: string;
  title: string;
  description: string;
}

export function DemoPhaseShell({
  eyebrow,
  title,
  description,
  children,
}: DemoPhaseShellProps) {
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ flex: 1, backgroundColor: palette.bg.void }}
      contentContainerStyle={{
        paddingHorizontal: 20,
        paddingTop: 28,
        paddingBottom: 40,
        gap: 18,
      }}
    >
      <View style={{ gap: 18 }}>
        <View style={{ gap: 8 }}>
          <Text
            selectable
            style={{
              color: palette.accent.cyan,
              fontSize: 12,
              letterSpacing: 2.4,
              textTransform: "uppercase",
              fontFamily: monoFamily,
            }}
          >
            {eyebrow}
          </Text>
          <Text
            selectable
            style={{
              color: palette.fg.primary,
              fontSize: 30,
              fontWeight: "700",
            }}
          >
            {title}
          </Text>
          <Text
            selectable
            style={{ color: palette.fg.muted, fontSize: 15, lineHeight: 22 }}
          >
            {description}
          </Text>
        </View>
        {children}
      </View>
    </ScrollView>
  );
}
