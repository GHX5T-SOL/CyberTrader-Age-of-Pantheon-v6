import { Text, View } from "react-native";
import { palette } from "@/theme/colors";

const monoFamily = process.env.EXPO_OS === "ios" ? "Menlo" : "monospace";

interface ResourceChipProps {
  label: string;
  value: string;
  tone?: "cyan" | "acid" | "amber" | "heat";
}

const TONES = {
  cyan: palette.accent.cyan,
  acid: palette.accent.acidGreen,
  amber: palette.warn.amber,
  heat: palette.danger.heat,
} as const;

export function ResourceChip({
  label,
  value,
  tone = "cyan",
}: ResourceChipProps) {
  const accent = TONES[tone];

  return (
    <View
      style={{
        minWidth: 108,
        gap: 6,
        borderWidth: 1,
        borderColor: `${accent}40`,
        borderRadius: 18,
        borderCurve: "continuous",
        backgroundColor: palette.bg.deepGreenBlack,
        paddingVertical: 10,
        paddingHorizontal: 12,
      }}
    >
      <Text
        selectable
        style={{
          color: palette.fg.muted,
          fontSize: 10,
          textTransform: "uppercase",
          letterSpacing: 1.6,
          fontFamily: monoFamily,
        }}
      >
        {label}
      </Text>
      <Text
        selectable
        style={{
          color: accent,
          fontSize: 18,
          fontWeight: "700",
          fontFamily: monoFamily,
          fontVariant: ["tabular-nums"],
        }}
      >
        {value}
      </Text>
    </View>
  );
}
