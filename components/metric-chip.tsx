import { Pressable, Text, View } from "react-native";
import Svg, { Rect } from "react-native-svg";
import NeonBorder from "@/components/neon-border";
import { terminalColors, terminalFont } from "@/theme/terminal";

interface MetricChipProps {
  label: string;
  value: string;
  subValue?: string;
  progressValue?: number;
  progressColor?: "green" | "amber" | "red";
  icon?: string;
  accentColor?: string;
  onPress?: () => void;
}

const PROGRESS_COLORS = {
  green: terminalColors.green,
  amber: terminalColors.amber,
  red: terminalColors.red,
};

export default function MetricChip({
  label,
  value,
  subValue,
  progressValue,
  progressColor = "green",
  icon,
  accentColor,
  onPress,
}: MetricChipProps) {
  const active = Boolean(accentColor || onPress);
  const Wrapper = onPress ? Pressable : View;
  const fillWidth = Math.max(0, Math.min(100, progressValue ?? 0));
  const fillColor = PROGRESS_COLORS[progressColor];

  return (
    <Wrapper onPress={onPress} style={{ width: "48%" }}>
      <NeonBorder active={active} style={accentColor ? { borderColor: accentColor } : undefined}>
        <View style={{ minHeight: 116, justifyContent: "space-between" }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 8 }}>
            <Text style={{ fontFamily: terminalFont, fontSize: 10, color: terminalColors.muted, letterSpacing: 1, textTransform: "uppercase" }}>
              {label}
            </Text>
            {icon ? <Text style={{ color: accentColor ?? terminalColors.cyan }}>{icon}</Text> : null}
          </View>
          <Text numberOfLines={2} style={{ fontFamily: terminalFont, fontSize: 28, color: terminalColors.text, fontWeight: "600" }}>
            {value}
          </Text>
          {subValue ? (
            <Text numberOfLines={1} style={{ fontFamily: terminalFont, fontSize: 10, color: terminalColors.muted }}>
              {subValue}
            </Text>
          ) : null}
          {progressValue !== undefined ? (
            <View style={{ marginTop: 8, shadowColor: fillColor, shadowOpacity: 0.5, shadowRadius: 4 }}>
              <Svg width="100%" height={6} viewBox="0 0 100 6" preserveAspectRatio="none">
                <Rect x="0" y="0" width="100" height="6" fill={terminalColors.borderDim} />
                <Rect x="0" y="0" width={fillWidth} height="6" fill={fillColor} />
              </Svg>
            </View>
          ) : null}
        </View>
      </NeonBorder>
    </Wrapper>
  );
}

export { MetricChip };

