import { Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { palette } from "@/theme/colors";

const monoFamily = process.env.EXPO_OS === "ios" ? "Menlo" : "monospace";

interface MetricRingProps {
  label: string;
  value: number;
  suffix?: string;
  max?: number;
  tone: "cyan" | "magenta";
}

export function MetricRing({ label, value, suffix = "", max = 100, tone }: MetricRingProps) {
  const color = tone === "magenta" ? palette.accent.magenta : palette.accent.cyan;
  const radius = 43;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(1, value / max));

  return (
    <View style={{ width: 118, height: 118, alignItems: "center", justifyContent: "center" }}>
      <Svg width={118} height={118} viewBox="0 0 118 118" style={{ position: "absolute" }}>
        <Circle
          cx="59"
          cy="59"
          r={radius}
          stroke={palette.alpha.white10}
          strokeWidth="6"
          fill={palette.alpha.clear}
        />
        <Circle
          cx="59"
          cy="59"
          r={radius}
          stroke={color}
          strokeWidth="6"
          fill={palette.alpha.clear}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={circumference - progress * circumference}
          rotation="-90"
          origin="59, 59"
        />
      </Svg>
      <Text
        selectable
        style={{
          color: palette.fg.primary,
          fontSize: 24,
          fontWeight: "800",
          fontFamily: monoFamily,
          fontVariant: ["tabular-nums"],
        }}
      >
        {Math.round(value)}
        {suffix}
      </Text>
      <Text
        selectable
        style={{
          color,
          fontSize: 11,
          letterSpacing: 1.4,
          textTransform: "uppercase",
          fontFamily: monoFamily,
        }}
      >
        {label}
      </Text>
    </View>
  );
}
