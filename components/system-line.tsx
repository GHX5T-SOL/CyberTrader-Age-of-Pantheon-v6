import type { ReactNode } from "react";
import { Text } from "react-native";
import { palette } from "@/theme/colors";

const monoFamily = process.env.EXPO_OS === "ios" ? "Menlo" : "monospace";

interface SystemLineProps {
  children: ReactNode;
  tone?: "cyan" | "acid" | "amber" | "heat" | "muted";
}

const TONES = {
  cyan: palette.accent.cyan,
  acid: palette.accent.acidGreen,
  amber: palette.warn.amber,
  heat: palette.danger.heat,
  muted: palette.fg.muted,
} as const;

export function SystemLine({ children, tone = "cyan" }: SystemLineProps) {
  return (
    <Text
      selectable
      style={{
        color: TONES[tone],
        fontFamily: monoFamily,
        fontSize: 14,
        lineHeight: 21,
      }}
    >
      {children}
    </Text>
  );
}
