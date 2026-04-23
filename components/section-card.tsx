import type { PropsWithChildren, ReactNode } from "react";
import { Text, View } from "react-native";
import { palette } from "@/theme/colors";

const TONES = {
  cyan: palette.accent.cyan,
  acid: palette.accent.acidGreen,
  heat: palette.danger.heat,
  amber: palette.warn.amber,
} as const;

const monoFamily = process.env.EXPO_OS === "ios" ? "Menlo" : "monospace";

interface SectionCardProps extends PropsWithChildren {
  eyebrow: string;
  title: string;
  tone?: keyof typeof TONES;
  right?: ReactNode;
}

export function SectionCard({
  eyebrow,
  title,
  tone = "cyan",
  right,
  children,
}: SectionCardProps) {
  const accent = TONES[tone];

  return (
    <View
      style={{
        gap: 12,
        borderWidth: 1,
        borderColor: `${accent}55`,
        borderRadius: 24,
        borderCurve: "continuous",
        backgroundColor: palette.bg.terminal,
        padding: 18,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <View style={{ flex: 1, gap: 4 }}>
          <Text
            selectable
            style={{
              color: accent,
              fontSize: 11,
              letterSpacing: 2,
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
              fontSize: 22,
              fontWeight: "700",
            }}
          >
            {title}
          </Text>
        </View>
        {right}
      </View>
      {children}
    </View>
  );
}
