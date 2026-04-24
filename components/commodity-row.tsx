import * as React from "react";
import { Image, Pressable, Text, View } from "react-native";
import { terminalColors, terminalFont } from "@/theme/terminal";

export const COMMODITY_ICON_MAP: Record<string, any> = {
  FDST: require("../assets/commodities/fractal_dust.png"),
  PGAS: require("../assets/commodities/plutonion_gas.png"),
  NGLS: require("../assets/commodities/neon_glass.png"),
  HXMD: require("../assets/commodities/helix_mud.png"),
  VBLM: require("../assets/commodities/void_bloom.png"),
  ORRS: require("../assets/commodities/oracle_resin.png"),
  SNPS: require("../assets/commodities/synapse_silk.png"),
  MTRX: require("../assets/commodities/matrix_salt.png"),
  AETH: require("../assets/commodities/aether_tabs.png"),
  BLCK: require("../assets/commodities/blacklight_serum.png"),
};

interface CommodityRowProps {
  ticker: string;
  name: string;
  price: number;
  changePercent: number;
  iconSource?: any;
  onPress: () => void;
  isSelected?: boolean;
  index?: number;
}

export default function CommodityRow({
  ticker,
  name,
  price,
  changePercent,
  iconSource,
  onPress,
  isSelected = false,
  index = 0,
}: CommodityRowProps) {
  const [pressed, setPressed] = React.useState(false);
  const isPositive = changePercent > 0;
  const isNegative = changePercent < 0;
  const prefix = isPositive ? "▲" : isNegative ? "▼" : "─";
  const color = isPositive
    ? terminalColors.green
    : isNegative
      ? terminalColors.red
      : terminalColors.muted;

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setTimeout(() => setPressed(false), 100)}
      style={{
        height: 48,
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: pressed
          ? "rgba(0,240,255,0.2)"
          : index % 2 === 0
            ? terminalColors.panelEven
            : terminalColors.panelAlt,
        borderBottomWidth: 1,
        borderBottomColor: terminalColors.borderDim,
        borderLeftWidth: isSelected ? 1 : 0,
        borderLeftColor: terminalColors.cyan,
        paddingHorizontal: 8,
      }}
    >
      <Image
        source={iconSource ?? COMMODITY_ICON_MAP[ticker]}
        resizeMode="contain"
        style={{ width: 28, height: 28, marginRight: 8 }}
      />
      <Text style={{ width: 60, fontFamily: terminalFont, fontSize: 14, fontWeight: "700", color: terminalColors.cyan }}>
        {ticker}
      </Text>
      <Text numberOfLines={1} style={{ flex: 1, fontFamily: terminalFont, fontSize: 12, color: terminalColors.muted }}>
        {name}
      </Text>
      <Text style={{ width: 100, textAlign: "right", fontFamily: terminalFont, fontSize: 16, color: terminalColors.text }}>
        {price.toFixed(2)}
      </Text>
      <Text style={{ width: 80, textAlign: "right", fontFamily: terminalFont, fontSize: 13, color }}>
        {prefix} {Math.abs(changePercent).toFixed(1)}%
      </Text>
    </Pressable>
  );
}

export { CommodityRow };

