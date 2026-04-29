import { Text, View } from "react-native";
import type { Position } from "@/engine/types";
import { FIRST_TRADE_HINT_TICKER } from "@/engine/demo-market";
import { getLiveStrategyHint } from "@/engine/strategy-guidance";
import { terminalColors, terminalFont } from "@/theme/terminal";

export interface FirstSessionCueInput {
  surface: "home" | "terminal";
  positions: Record<string, Position>;
  firstTradeComplete: boolean;
  selectedTicker: string;
  heat?: number;
}

export interface FirstSessionCueCopy {
  step: "01" | "02" | "03" | "04";
  title: string;
  detail: string;
  tone: "cyan" | "amber" | "green";
  lines: string[];
}

export function getFirstSessionCueCopy({
  surface,
  positions,
  firstTradeComplete,
  selectedTicker,
  heat = 0,
}: FirstSessionCueInput): FirstSessionCueCopy {
  const selectedPosition = positions[selectedTicker];
  const firstOpenPosition = Object.values(positions)[0];
  const strategy = getLiveStrategyHint({
    selectedTicker,
    firstTradeComplete,
    heat,
    hasOpenPosition: Boolean(selectedPosition ?? firstOpenPosition),
  });

  if (firstTradeComplete) {
    return {
      step: "04",
      title: "FIRST PROFIT BANKED",
      detail: strategy.detail,
      tone: "green",
      lines: ["[DONE] handle claimed", "[DONE] position closed", ...strategy.lines.slice(0, 1)],
    };
  }

  if (selectedPosition) {
    const pnl = selectedPosition.unrealizedPnl ?? 0;
    return {
      step: "03",
      title: pnl > 0 ? "SELL THE GREEN TAPE" : "WAIT FOR GREEN TAPE",
      detail:
        pnl > 0
          ? `${selectedTicker} is green now. Switch to SELL, keep the lot at ${selectedPosition.quantity}, and close before opening another lane.`
          : `${selectedTicker} is open. Use WAIT MARKET TICK until PnL turns green, then sell the same lot.`,
      tone: pnl > 0 ? "green" : "amber",
      lines: [
        `[LIVE] ${selectedTicker} x${selectedPosition.quantity}`,
        `[PNL] ${pnl >= 0 ? "+" : ""}${pnl.toFixed(2)} 0BOL`,
        pnl > 0 ? "[NEXT] sell position" : "[NEXT] wait tick",
      ],
    };
  }

  if (firstOpenPosition) {
    return {
      step: "03",
      title: "RETURN TO OPEN CARGO",
      detail: `${firstOpenPosition.ticker} is already in inventory. Select that cargo, switch to SELL on green tape, and close before opening a second learning thread.`,
      tone: "amber",
      lines: [
        `[OPEN] ${firstOpenPosition.ticker} x${firstOpenPosition.quantity}`,
        "[NEXT] select position",
        "[NEXT] close on profit",
      ],
    };
  }

  if (surface === "terminal") {
    return {
      step: "02",
      title: selectedTicker === FIRST_TRADE_HINT_TICKER ? "BUY THE STARTER SIGNAL" : strategy.title,
      detail: strategy.detail,
      tone: strategy.tone,
      lines: selectedTicker === FIRST_TRADE_HINT_TICKER
        ? [`[LOCK] ${selectedTicker}`, ...strategy.lines.slice(0, 1), "[NEXT] execute buy", ...strategy.lines.slice(1, 2)]
        : strategy.lines,
    };
  }

  return {
    step: "01",
    title: "ENTER S1LKROAD",
    detail: strategy.detail,
    tone: "cyan",
    lines: ["[READY] local handle", ...strategy.lines.slice(0, 2)],
  };
}

export function FirstSessionCue(props: FirstSessionCueInput) {
  const cue = getFirstSessionCueCopy(props);
  const accent =
    cue.tone === "green"
      ? terminalColors.green
      : cue.tone === "amber"
        ? terminalColors.amber
        : terminalColors.cyan;

  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: accent,
        backgroundColor: terminalColors.panelAlt,
        padding: 0,
      }}
    >
      <View
        style={{
          borderBottomWidth: 1,
          borderBottomColor: terminalColors.borderDim,
          paddingHorizontal: 12,
          paddingVertical: 7,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
        }}
      >
        <Text style={{ fontFamily: terminalFont, color: terminalColors.muted, fontSize: 9, letterSpacing: 1.2 }}>
          ORACLE ROUTE // STEP {cue.step}
        </Text>
        <Text style={{ fontFamily: terminalFont, color: accent, fontSize: 9, fontWeight: "700" }}>
          LIVE_SCRIPT
        </Text>
      </View>
      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 10, padding: 14 }}>
        <Text style={{ width: 34, fontFamily: terminalFont, color: accent, fontSize: 24, fontWeight: "700" }}>{cue.step}</Text>
        <View style={{ flex: 1, gap: 8 }}>
          <Text numberOfLines={2} style={{ fontFamily: terminalFont, color: accent, fontSize: 12, fontWeight: "700", lineHeight: 16 }}>
            {cue.title}
          </Text>
          <Text style={{ fontFamily: terminalFont, color: terminalColors.text, fontSize: 11, lineHeight: 18 }}>
            {cue.detail}
          </Text>
          <View style={{ gap: 4 }}>
            {cue.lines.map((line) => (
              <Text key={line} style={{ fontFamily: terminalFont, color: terminalColors.muted, fontSize: 10 }}>
                {line}
              </Text>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}
