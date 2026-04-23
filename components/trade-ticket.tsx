import { Image, Pressable, Text, View } from "react-native";
import { commodityArt } from "@/assets/commodity-art";
import { FIRST_TRADE_HINT_TICKER, formatObol } from "@/engine/demo-market";
import type { Commodity } from "@/engine/types";
import { SectionCard } from "@/components/section-card";
import { palette } from "@/theme/colors";

const monoFamily = process.env.EXPO_OS === "ios" ? "Menlo" : "monospace";

interface TradeTicketProps {
  commodity?: Commodity;
  price?: number;
  holding?: {
    ticker: string;
    quantity: number;
    avgEntry: number;
  };
  canSell: boolean;
  onBuy: () => void;
  onSell: () => void;
}

export function TradeTicket({
  commodity,
  price,
  holding,
  canSell,
  onBuy,
  onSell,
}: TradeTicketProps) {
  if (!commodity || price === undefined) {
    return (
      <SectionCard eyebrow="ticket" title="Select a commodity" tone="amber">
        <Text selectable style={{ color: palette.fg.muted, lineHeight: 22 }}>
          Lock a ticker to see the trade ticket. Start with {FIRST_TRADE_HINT_TICKER} if you want a lower-heat first move.
        </Text>
      </SectionCard>
    );
  }

  const art = commodityArt[commodity.ticker];
  const totalBuy = price * 10;
  const estimatedSell = holding ? holding.quantity * price : 0;
  const projectedPnl = holding ? estimatedSell - holding.avgEntry * holding.quantity : 0;

  return (
    <SectionCard eyebrow="trade_ticket" title={`${commodity.ticker} // ${commodity.name}`} tone="acid">
      <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
        <View
          style={{
            width: 112,
            height: 112,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1,
            borderColor: `${palette.accent.acidGreen}35`,
            borderRadius: 24,
            borderCurve: "continuous",
            backgroundColor: palette.bg.deepGreenBlack,
            overflow: "hidden",
          }}
        >
          {art ? (
            <Image
              source={art}
              resizeMode="contain"
              style={{ width: 98, height: 98 }}
            />
          ) : null}
        </View>
        <View style={{ flex: 1, gap: 8 }}>
          <MetricRow label="price" value={`${price.toFixed(2)} 0BOL`} />
          <MetricRow label="default lot" value={`10 units // ${formatObol(totalBuy)} 0BOL`} />
          <MetricRow label="heat impact" value={commodity.heatRisk.replace("_", " ")} tone="heat" />
        </View>
      </View>

      <View style={{ gap: 10 }}>
        {holding ? (
          <>
            <MetricRow label="held" value={`${holding.quantity} units`} />
            <MetricRow label="avg entry" value={`${holding.avgEntry.toFixed(2)} 0BOL`} />
            <MetricRow
              label="projected pnl"
              value={`${projectedPnl >= 0 ? "+" : ""}${projectedPnl.toFixed(2)} 0BOL`}
              tone={projectedPnl >= 0 ? "acid" : "heat"}
            />
          </>
        ) : null}
      </View>

      <View style={{ flexDirection: "row", gap: 10 }}>
        <TicketButton label="execute buy" tone="cyan" onPress={onBuy} />
        <TicketButton label="sell position" tone="heat" disabled={!canSell} onPress={onSell} />
      </View>
    </SectionCard>
  );
}

function MetricRow({
  label,
  value,
  tone = "cyan",
}: {
  label: string;
  value: string;
  tone?: "cyan" | "acid" | "heat";
}) {
  const color =
    tone === "acid"
      ? palette.accent.acidGreen
      : tone === "heat"
        ? palette.danger.heat
        : palette.accent.cyan;

  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
      }}
    >
      <Text
        selectable
        style={{
          color: palette.fg.muted,
          fontSize: 11,
          textTransform: "uppercase",
          letterSpacing: 1.2,
          fontFamily: monoFamily,
        }}
      >
        {label}
      </Text>
      <Text
        selectable
        style={{
          color,
          fontSize: 14,
          fontFamily: monoFamily,
          fontVariant: ["tabular-nums"],
        }}
      >
        {value}
      </Text>
    </View>
  );
}

function TicketButton({
  label,
  tone,
  disabled = false,
  onPress,
}: {
  label: string;
  tone: "cyan" | "heat";
  disabled?: boolean;
  onPress: () => void;
}) {
  const activeColor = tone === "heat" ? palette.danger.heat : palette.accent.cyan;

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={{
        flex: 1,
        alignItems: "center",
        borderWidth: 1,
        borderColor: disabled ? `${palette.fg.muted}25` : `${activeColor}60`,
        borderRadius: 16,
        borderCurve: "continuous",
        backgroundColor: disabled ? `${palette.fg.muted}10` : `${activeColor}10`,
        paddingVertical: 12,
        paddingHorizontal: 14,
      }}
    >
      <Text
        selectable
        style={{
          color: disabled ? palette.fg.muted : activeColor,
          fontSize: 13,
          fontWeight: "700",
          textTransform: "uppercase",
          letterSpacing: 1.1,
          fontFamily: monoFamily,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
