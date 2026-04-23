import { Image, Pressable, Text, View } from "react-native";
import { commodityArt } from "@/assets/commodity-art";
import type { Commodity } from "@/engine/types";
import { formatDelta } from "@/engine/demo-market";
import { palette } from "@/theme/colors";

const monoFamily = process.env.EXPO_OS === "ios" ? "Menlo" : "monospace";

interface CommodityRowProps {
  commodity: Commodity;
  price: number;
  change: number;
  ownedQuantity?: number;
  selected: boolean;
  compact?: boolean;
  onPress: () => void;
}

export function CommodityRow({
  commodity,
  price,
  change,
  ownedQuantity,
  selected,
  compact = false,
  onPress,
}: CommodityRowProps) {
  const art = commodityArt[commodity.ticker];
  const changeTone =
    change > 0
      ? palette.accent.acidGreen
      : change < 0
        ? palette.danger.heat
        : palette.warn.amber;

  return (
    <Pressable
      onPress={onPress}
      style={{
        gap: 10,
        borderWidth: 1,
        borderColor: selected ? `${palette.accent.cyan}88` : `${palette.fg.muted}22`,
        borderRadius: 20,
        borderCurve: "continuous",
        backgroundColor: selected ? palette.bg.deepGreenBlack : palette.bg.terminal,
        padding: 14,
      }}
    >
      <View
        style={{
          flexDirection: compact ? "column" : "row",
          justifyContent: "space-between",
          alignItems: compact ? "flex-start" : "center",
          gap: 8,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flex: 1 }}>
          <View
            style={{
              width: 62,
              height: 62,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: `${selected ? palette.accent.cyan : palette.fg.muted}33`,
              borderRadius: 18,
              borderCurve: "continuous",
              backgroundColor: palette.bg.deepGreenBlack,
              overflow: "hidden",
            }}
          >
            {art ? (
              <Image
                source={art}
                resizeMode="contain"
                style={{ width: 54, height: 54 }}
              />
            ) : null}
          </View>
          <View style={{ gap: 4, flex: 1 }}>
            <Text
              selectable
              style={{
                color: palette.accent.cyan,
                fontSize: 17,
                fontWeight: "700",
                fontFamily: monoFamily,
              }}
            >
              {commodity.ticker}
            </Text>
            <Text selectable style={{ color: palette.fg.primary, fontSize: 15 }}>
              {commodity.name}
            </Text>
          </View>
        </View>
        <View style={{ alignItems: compact ? "flex-start" : "flex-end", gap: 4 }}>
          <Text
            selectable
            style={{
              color: palette.fg.primary,
              fontSize: 20,
              fontWeight: "700",
              fontFamily: monoFamily,
              fontVariant: ["tabular-nums"],
            }}
          >
            {price.toFixed(2)}
          </Text>
          <Text
            selectable
            style={{
              color: changeTone,
              fontSize: 12,
              fontFamily: monoFamily,
              fontVariant: ["tabular-nums"],
            }}
          >
            {formatDelta(change)}
          </Text>
        </View>
      </View>
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <Pill label={commodity.heatRisk.replace("_", " ")} tone="heat" />
        <Pill label={commodity.volatility.replace("_", " ")} tone="amber" />
        {ownedQuantity ? <Pill label={`held ${ownedQuantity}`} tone="acid" /> : null}
      </View>
    </Pressable>
  );
}

function Pill({
  label,
  tone,
}: {
  label: string;
  tone: "acid" | "amber" | "heat";
}) {
  const color =
    tone === "acid"
      ? palette.accent.acidGreen
      : tone === "heat"
        ? palette.danger.heat
        : palette.warn.amber;

  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: `${color}44`,
        borderRadius: 999,
        paddingVertical: 4,
        paddingHorizontal: 8,
      }}
    >
      <Text
        selectable
        style={{
          color,
          fontSize: 10,
          fontFamily: monoFamily,
          textTransform: "uppercase",
          letterSpacing: 1,
        }}
      >
        {label}
      </Text>
    </View>
  );
}
