import { Text, View } from "react-native";
import type { Position } from "@/engine/types";
import { HoloPanel } from "@/components/holo-panel";
import { palette } from "@/theme/colors";

const monoFamily = process.env.EXPO_OS === "ios" ? "Menlo" : "monospace";

interface PositionsPanelProps {
  positions: Record<string, Position>;
}

export function PositionsPanel({ positions }: PositionsPanelProps) {
  const openPositions = Object.values(positions);

  return (
    <HoloPanel
      eyebrow="positions"
      title="open inventory"
      tone={openPositions.length ? "cyan" : "amber"}
    >
      {openPositions.length === 0 ? (
        <Text selectable style={{ color: palette.fg.muted, lineHeight: 22 }}>
          No open inventory. Buy one lot, let the tape move, then sell to close the
          first loop.
        </Text>
      ) : (
        <View style={{ gap: 10 }}>
          {openPositions.map((position) => (
            <View
              key={position.id}
              style={{
                borderWidth: 1,
                borderColor: palette.alpha.cyan35,
                borderRadius: 16,
                backgroundColor: palette.alpha.black50,
                padding: 12,
                gap: 6,
              }}
            >
              <Row label={position.ticker} value={`${position.quantity} units`} tone="acid" />
              <Row label="avg entry" value={`${position.avgEntry.toFixed(2)} 0BOL`} />
              <Row
                label="unrealized"
                value={`${position.unrealizedPnl >= 0 ? "+" : ""}${position.unrealizedPnl.toFixed(2)} 0BOL`}
                tone={position.unrealizedPnl >= 0 ? "acid" : "heat"}
              />
            </View>
          ))}
        </View>
      )}
    </HoloPanel>
  );
}

function Row({
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
    <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 10 }}>
      <Text
        selectable
        style={{
          color,
          fontFamily: monoFamily,
          fontSize: 12,
          textTransform: "uppercase",
          letterSpacing: 1,
        }}
      >
        {label}
      </Text>
      <Text
        selectable
        style={{
          color: palette.fg.primary,
          fontFamily: monoFamily,
          fontSize: 13,
          fontVariant: ["tabular-nums"],
        }}
      >
        {value}
      </Text>
    </View>
  );
}
