import { Text, View } from "react-native";
import type { Position } from "@/engine/types";
import { palette } from "@/theme/colors";

const monoFamily = process.env.EXPO_OS === "ios" ? "Menlo" : "monospace";

interface ObjectiveStripProps {
  positions: Record<string, Position>;
  firstTradeComplete: boolean;
  selectedTicker: string;
}

export function getObjectiveCopy({
  positions,
  firstTradeComplete,
  selectedTicker,
}: ObjectiveStripProps): { step: string; title: string; detail: string; tone: "cyan" | "magenta" } {
  const selectedPosition = positions[selectedTicker];
  const hasAnyPosition = Object.keys(positions).length > 0;

  if (firstTradeComplete) {
    return {
      step: "04",
      title: "Loop survived",
      detail: "Bank profit, manage Heat, and prepare the next run.",
      tone: "cyan",
    };
  }

  if (selectedPosition) {
    return {
      step: "03",
      title: "Exit window",
      detail: "Watch unrealized PnL. Sell once the tape turns green.",
      tone: "magenta",
    };
  }

  if (hasAnyPosition) {
    return {
      step: "02",
      title: "Hold signal",
      detail: "You have inventory open. Wait a tick, then close clean.",
      tone: "magenta",
    };
  }

  return {
    step: "01",
    title: "Open first position",
    detail: "Select a lower-heat asset, choose a lot size, then buy.",
    tone: "cyan",
  };
}

export function ObjectiveStrip(props: ObjectiveStripProps) {
  const objective = getObjectiveCopy(props);
  const accent = objective.tone === "magenta" ? palette.accent.magenta : palette.accent.cyan;

  return (
    <View
      style={{
        flexDirection: "row",
        gap: 12,
        alignItems: "center",
        borderWidth: 1,
        borderColor: `${accent}88`,
        borderRadius: 20,
        backgroundColor: objective.tone === "magenta" ? palette.alpha.magenta10 : palette.alpha.cyan10,
        padding: 14,
      }}
    >
      <Text selectable style={{ color: accent, fontSize: 28, fontWeight: "900", fontFamily: monoFamily }}>
        {objective.step}
      </Text>
      <View style={{ flex: 1, gap: 3 }}>
        <Text selectable style={{ color: palette.fg.primary, fontSize: 15, fontWeight: "900", textTransform: "uppercase", fontFamily: monoFamily }}>
          {objective.title}
        </Text>
        <Text selectable style={{ color: palette.fg.muted, fontSize: 12, lineHeight: 17 }}>
          {objective.detail}
        </Text>
      </View>
    </View>
  );
}
