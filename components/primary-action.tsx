import { Pressable, Text } from "react-native";
import { palette } from "@/theme/colors";

const monoFamily = process.env.EXPO_OS === "ios" ? "Menlo" : "monospace";

export function PrimaryAction({
  label,
  tone,
  compact = false,
  disabled = false,
  onPress,
}: {
  label: string;
  tone: "cyan" | "acid" | "heat";
  compact?: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  const color =
    tone === "acid"
      ? palette.accent.acidGreen
      : tone === "heat"
        ? palette.danger.heat
        : palette.accent.cyan;

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={{
        flex: compact ? 1 : undefined,
        alignItems: "center",
        borderWidth: 1,
        borderColor: disabled ? `${palette.fg.muted}22` : `${color}55`,
        borderRadius: 18,
        borderCurve: "continuous",
        backgroundColor: disabled ? `${palette.fg.muted}08` : `${color}12`,
        paddingVertical: 14,
        paddingHorizontal: 16,
      }}
    >
      <Text
        selectable
        style={{
          color: disabled ? palette.fg.muted : color,
          fontSize: 13,
          fontWeight: "700",
          textTransform: "uppercase",
          letterSpacing: 1.3,
          fontFamily: monoFamily,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
