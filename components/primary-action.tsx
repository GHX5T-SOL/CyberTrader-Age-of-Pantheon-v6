import { Pressable, Text } from "react-native";
import { palette } from "@/theme/colors";

const monoFamily = process.env.EXPO_OS === "ios" ? "Menlo" : "monospace";

export function PrimaryAction({
  label,
  tone,
  compact = false,
  large = false,
  disabled = false,
  onPress,
}: {
  label: string;
  tone: "cyan" | "acid" | "heat" | "magenta";
  compact?: boolean;
  large?: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  const color =
    tone === "acid"
      ? palette.accent.acidGreen
      : tone === "magenta"
        ? palette.accent.magenta
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
        borderColor: disabled ? palette.alpha.white10 : color,
        borderRadius: 18,
        borderCurve: "continuous",
        backgroundColor: disabled
          ? palette.alpha.white06
          : tone === "magenta"
            ? palette.alpha.magenta35
            : tone === "cyan"
              ? palette.alpha.cyan18
              : palette.alpha.white06,
        paddingVertical: large ? 18 : 14,
        paddingHorizontal: 16,
      }}
    >
      <Text
        selectable
        style={{
          color: disabled ? palette.fg.muted : color,
          fontSize: large ? 15 : 13,
          fontWeight: "700",
          textTransform: "uppercase",
          letterSpacing: large ? 1.8 : 1.3,
          fontFamily: monoFamily,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
