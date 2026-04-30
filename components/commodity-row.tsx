import * as React from "react";
import { Image, Pressable, Text, View } from "react-native";
import { terminalColors, terminalFont } from "@/theme/terminal";

export const COMMODITY_ICON_MAP: Record<string, any> = {
  FDST: require("../assets/optimized/commodities/fractal_dust.png"),
  PGAS: require("../assets/optimized/commodities/plutonion_gas.png"),
  NGLS: require("../assets/optimized/commodities/neon_glass.png"),
  HXMD: require("../assets/optimized/commodities/helix_mud.png"),
  VBLM: require("../assets/optimized/commodities/void_bloom.png"),
  ORRS: require("../assets/optimized/commodities/oracle_resin.png"),
  SNPS: require("../assets/optimized/commodities/synapse_silk.png"),
  MTRX: require("../assets/optimized/commodities/matrix_salt.png"),
  AETH: require("../assets/optimized/commodities/aether_tabs.png"),
  BLCK: require("../assets/optimized/commodities/blacklight_serum.png"),
  GLCH: require("../assets/optimized/commodities/glitch_echo.png"),
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
      hitSlop={4}
      style={{
        minHeight: 52,
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: pressed
          ? terminalColors.cyanPress
          : index % 2 === 0
            ? terminalColors.panelEven
            : terminalColors.panelAlt,
        borderBottomWidth: 1,
        borderBottomColor: terminalColors.borderDim,
        borderLeftWidth: isSelected ? 1 : 0,
        backgroundColor: isSelected ? terminalColors.cyanPress : (pressed ? terminalColors.cyanPress : index % 2 === 0 ? terminalColors.panelEven : terminalColors.panelAlt),
        borderLeftColor: terminalColors.cyan,
        paddingHorizontal: 8,
      }}
    >
      <Image
        source={iconSource ?? COMMODITY_ICON_MAP[ticker]}
        resizeMode="contain"
        style={{ width: 28, height: 28, marginRight: 8 }}
      />
      <Text numberOfLines={1} style={{ width: 52, fontFamily: terminalFont, fontSize: 13, fontWeight: "700", color: terminalColors.cyan }}>
        {ticker}
      </Text>
      <Text numberOfLines={1} style={{ flex: 1, fontFamily: terminalFont, fontSize: 12, color: terminalColors.muted }}>
        {name}
      </Text>
      <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.72} style={{ width: 86, textAlign: "right", fontFamily: terminalFont, fontSize: 15, color: terminalColors.text }}>
        {price.toFixed(2)}
      </Text>
      <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.72} style={{ width: 62, textAlign: "right", fontFamily: terminalFont, fontSize: 12, color }}>
        {prefix} {Math.abs(changePercent).toFixed(1)}%
      </Text>
    </Pressable>
  );
}

export { CommodityRow };
