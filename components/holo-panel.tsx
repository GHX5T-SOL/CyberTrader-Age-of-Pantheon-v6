import type { PropsWithChildren, ReactNode } from "react";
import { Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { palette } from "@/theme/colors";

const monoFamily = process.env.EXPO_OS === "ios" ? "Menlo" : "monospace";

interface HoloPanelProps extends PropsWithChildren {
  eyebrow?: string;
  title?: string;
  tone?: "cyan" | "magenta" | "violet" | "amber";
  right?: ReactNode;
}

export function HoloPanel({
  eyebrow,
  title,
  tone = "cyan",
  right,
  children,
}: HoloPanelProps) {
  const accent =
    tone === "magenta"
      ? palette.accent.magenta
      : tone === "violet"
        ? palette.accent.violet
        : tone === "amber"
          ? palette.warn.amber
          : palette.accent.cyan;

  return (
    <LinearGradient
      colors={[
        tone === "magenta" ? palette.alpha.magenta18 : palette.alpha.cyan18,
        palette.bg.card,
        palette.bg.elevated,
      ]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        gap: 12,
        borderWidth: 1,
        borderColor: accent,
        borderRadius: 24,
        padding: 16,
      }}
    >
      {title ? (
        <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
          <View style={{ flex: 1, gap: 4 }}>
            {eyebrow ? (
              <Text selectable style={{ color: accent, fontSize: 10, letterSpacing: 1.9, textTransform: "uppercase", fontFamily: monoFamily }}>
                {eyebrow}
              </Text>
            ) : null}
            <Text selectable style={{ color: palette.fg.primary, fontSize: 18, fontWeight: "900", textTransform: "uppercase", fontFamily: monoFamily }}>
              {title}
            </Text>
          </View>
          {right}
        </View>
      ) : null}
      {children}
    </LinearGradient>
  );
}
