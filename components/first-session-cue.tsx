import { Text, View } from "react-native";
import type { Position } from "@/engine/types";
import { terminalColors, terminalFont } from "@/theme/terminal";

export interface FirstSessionCueInput {
  surface: "home" | "terminal";
  positions: Record<string, Position>;
  firstTradeComplete: boolean;
  selectedTicker: string;
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
}: FirstSessionCueInput): FirstSessionCueCopy {
  const selectedPosition = positions[selectedTicker];
  const firstOpenPosition = Object.values(positions)[0];

  if (firstTradeComplete) {
    return {
      step: "04",
      title: "FIRST PROFIT BANKED",
      detail: "The demo loop is complete. Keep Heat controlled, scale only when the tape gives you room, and build XP toward the next OS tier.",
      tone: "green",
      lines: ["[DONE] handle claimed", "[DONE] position closed", "[NEXT] manage heat and rank"],
    };
  }

  if (selectedPosition) {
    const pnl = selectedPosition.unrealizedPnl ?? 0;
    return {
      step: "03",
      title: pnl > 0 ? "SELL THE GREEN TAPE" : "WAIT FOR GREEN TAPE",
      detail:
        pnl > 0
          ? `${selectedTicker} is profitable now. Switch to SELL, keep the lot at ${selectedPosition.quantity}, and execute the close.`
          : `${selectedTicker} is open. Use WAIT MARKET TICK until PnL turns positive, then sell the same lot.`,
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
      detail: `${firstOpenPosition.ticker} is already in inventory. Tap the open position, sell on green, and avoid opening a second learning thread.`,
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
      title: "BUY THE STARTER SIGNAL",
      detail: `${selectedTicker} is locked as the low-heat starter. Keep the default lot, execute BUY, then wait one market tick before selling.`,
      tone: "cyan",
      lines: [`[LOCK] ${selectedTicker}`, "[NEXT] execute buy", "[NEXT] wait market tick"],
    };
  }

  return {
    step: "01",
    title: "ENTER S1LKROAD",
    detail: "Your first objective is one clean local trade: enter the terminal, buy the starter signal, wait for a green tick, and sell.",
    tone: "cyan",
    lines: ["[READY] local handle", "[NEXT] enter market", "[GOAL] first profitable sell"],
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
        backgroundColor: terminalColors.panel,
        padding: 12,
        gap: 8,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <Text style={{ fontFamily: terminalFont, color: accent, fontSize: 20 }}>{cue.step}</Text>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: terminalFont, color: accent, fontSize: 12 }}>{cue.title}</Text>
          <Text style={{ marginTop: 4, fontFamily: terminalFont, color: terminalColors.text, fontSize: 11, lineHeight: 17 }}>
            {cue.detail}
          </Text>
        </View>
      </View>
      <View style={{ gap: 4 }}>
        {cue.lines.map((line) => (
          <Text key={line} style={{ fontFamily: terminalFont, color: terminalColors.muted, fontSize: 10 }}>
            {line}
          </Text>
        ))}
      </View>
    </View>
  );
}
