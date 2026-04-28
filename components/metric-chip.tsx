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
      <NeonBorder
        active={active}
        style={{
          borderColor: accentColor ?? (active ? terminalColors.cyan : terminalColors.border),
          backgroundColor: active ? terminalColors.panelAlt : terminalColors.panel,
          padding: 0,
          overflow: "hidden",
        }}
      >
        <View style={{ minHeight: 116, justifyContent: "space-between", gap: 8, padding: 12 }}>
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: 0,
              width: 2,
              backgroundColor: accentColor ?? terminalColors.cyan,
              opacity: active ? 0.85 : 0.25,
            }}
          />
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.75}
              style={{ flex: 1, fontFamily: terminalFont, fontSize: 10, color: terminalColors.muted, letterSpacing: 1, textTransform: "uppercase" }}
            >
              {label}
            </Text>
            {icon ? <Text style={{ color: accentColor ?? terminalColors.cyan, fontFamily: terminalFont, fontSize: 10, fontWeight: "700" }}>{icon}</Text> : null}
          </View>
          <Text
            numberOfLines={2}
            adjustsFontSizeToFit
            minimumFontScale={0.58}
            style={{ fontFamily: terminalFont, fontSize: 28, lineHeight: 30, color: terminalColors.text, fontWeight: "600" }}
          >
            {value}
          </Text>
          {subValue ? (
            <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75} style={{ fontFamily: terminalFont, fontSize: 10, color: terminalColors.muted }}>
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
