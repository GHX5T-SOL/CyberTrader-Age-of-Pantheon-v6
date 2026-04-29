import type { ViewStyle } from "react-native";
import { Text, View } from "react-native";
import { terminalColors, terminalFont } from "@/theme/terminal";

type DeckAccent = "cyan" | "amber" | "green" | "red" | "muted";

interface DeckSectionHeaderProps {
  label: string;
  detail?: string;
  accent?: DeckAccent;
  style?: ViewStyle;
}

const ACCENT_COLORS: Record<DeckAccent, string> = {
  cyan: terminalColors.cyan,
  amber: terminalColors.amber,
  green: terminalColors.green,
  red: terminalColors.red,
  muted: terminalColors.muted,
};

export default function DeckSectionHeader({
  label,
  detail,
  accent = "cyan",
  style,
}: DeckSectionHeaderProps) {
  const accentColor = ACCENT_COLORS[accent];

  return (
    <View
      style={[
        {
          borderTopWidth: 1,
          borderBottomWidth: 1,
          borderColor: terminalColors.borderDim,
          backgroundColor: terminalColors.panelEven,
          paddingHorizontal: 12,
          paddingVertical: 6,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
        },
        style,
      ]}
    >
      <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 8 }}>
        <View
          style={{
            width: 6,
            height: 6,
            borderWidth: 1,
            borderColor: accentColor,
            backgroundColor: accent === "muted" ? "transparent" : `${accentColor}22`,
          }}
        />
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.76}
          style={{
            flex: 1,
            fontFamily: terminalFont,
            color: accentColor,
            fontSize: 10,
            fontWeight: "700",
            letterSpacing: 1.4,
          }}
        >
          {label}
        </Text>
      </View>
      {detail ? (
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.72}
          style={{
            maxWidth: "48%",
            fontFamily: terminalFont,
            color: terminalColors.muted,
            fontSize: 9,
            letterSpacing: 0.6,
            textAlign: "right",
          }}
        >
          {detail}
        </Text>
      ) : null}
    </View>
  );
}

export { DeckSectionHeader };
