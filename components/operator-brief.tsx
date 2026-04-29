import { Pressable, Text, View } from "react-native";
import type { Position } from "@/engine/types";
import { FIRST_TRADE_HINT_TICKER } from "@/engine/demo-market";
import {
  HIGH_HEAT_STRATEGY_THRESHOLD,
  STARTER_GUIDANCE_QUANTITY,
} from "@/engine/strategy-guidance";
import { terminalColors, terminalFont } from "@/theme/terminal";

export type OperatorBriefSurface = "home" | "terminal";
export type OperatorBriefTone = "cyan" | "amber" | "green" | "red";
export type OperatorBriefActionKind =
  | "enter-terminal"
  | "select-starter"
  | "buy-starter"
  | "wait-tick"
  | "sell-green"
  | "close-thread"
  | "cool-heat"
  | "upgrade-lane";

export interface OperatorBriefAction {
  kind: OperatorBriefActionKind;
  label: string;
  ticker?: string;
}

export interface OperatorBriefInput {
  surface: OperatorBriefSurface;
  positions: Record<string, Position>;
  firstTradeComplete: boolean;
  selectedTicker: string;
  heat: number;
}

export interface OperatorBriefCopy {
  signal: "NOMINAL" | "WATCH" | "HOT";
  progressLabel: string;
  heatLabel: string;
  heatTone: OperatorBriefTone;
  heatSegments: readonly boolean[];
  nextAction: OperatorBriefAction;
  lines: string[];
}

export function getOperatorBriefCopy({
  surface,
  positions,
  firstTradeComplete,
  selectedTicker,
  heat,
}: OperatorBriefInput): OperatorBriefCopy {
  const selectedPosition = positions[selectedTicker];
  const firstOpenPosition = Object.values(positions)[0];
  const heatTone = getHeatTone(heat);
  const base = {
    signal: getSignal(heat),
    progressLabel: firstTradeComplete ? "1/1 FIRST PROFIT BANKED" : "0/1 FIRST PROFIT",
    heatLabel: getHeatLabel(heat),
    heatTone,
    heatSegments: getHeatSegments(heat),
  } satisfies Omit<OperatorBriefCopy, "nextAction" | "lines">;

  if (!firstTradeComplete && selectedPosition) {
    const pnl = selectedPosition.unrealizedPnl ?? 0;
    return {
      ...base,
      nextAction: pnl > 0
        ? { kind: "sell-green", label: `[ SELL ${selectedPosition.ticker} GREEN ]`, ticker: selectedPosition.ticker }
        : { kind: "wait-tick", label: "[ WAIT MARKET TICK ]", ticker: selectedPosition.ticker },
      lines: [
        `CARGO ${selectedPosition.ticker} x${selectedPosition.quantity}`,
        pnl > 0 ? "green tape detected" : "hold one thread until green",
      ],
    };
  }

  if (!firstTradeComplete && firstOpenPosition) {
    return {
      ...base,
      nextAction: {
        kind: "close-thread",
        label: `[ CLOSE ${firstOpenPosition.ticker} THREAD ]`,
        ticker: firstOpenPosition.ticker,
      },
      lines: [`OPEN ${firstOpenPosition.ticker} x${firstOpenPosition.quantity}`, "finish before opening a second lane"],
    };
  }

  if (!firstTradeComplete && surface === "terminal" && selectedTicker !== FIRST_TRADE_HINT_TICKER) {
    return {
      ...base,
      nextAction: { kind: "select-starter", label: `[ SELECT ${FIRST_TRADE_HINT_TICKER} ]`, ticker: FIRST_TRADE_HINT_TICKER },
      lines: [`starter script is ${FIRST_TRADE_HINT_TICKER} x${STARTER_GUIDANCE_QUANTITY}`, `${selectedTicker} can wait`],
    };
  }

  if (!firstTradeComplete && surface === "terminal") {
    return {
      ...base,
      nextAction: { kind: "buy-starter", label: `[ EXECUTE ${FIRST_TRADE_HINT_TICKER} BUY ]`, ticker: FIRST_TRADE_HINT_TICKER },
      lines: [`lot ${FIRST_TRADE_HINT_TICKER} x${STARTER_GUIDANCE_QUANTITY}`, "one buy, one wait, one sell"],
    };
  }

  if (!firstTradeComplete) {
    return {
      ...base,
      nextAction: { kind: "enter-terminal", label: "[ ENTER S1LKROAD 4.0 ]", ticker: FIRST_TRADE_HINT_TICKER },
      lines: [`starter script is ${FIRST_TRADE_HINT_TICKER} x${STARTER_GUIDANCE_QUANTITY}`, "first goal is green 0BOL"],
    };
  }

  if (heat >= HIGH_HEAT_STRATEGY_THRESHOLD) {
    return {
      ...base,
      nextAction: { kind: "cool-heat", label: "[ COOL HEAT BEFORE SCALE ]" },
      lines: ["contraband stop line reached", "safe lane until the deck cools"],
    };
  }

  if (firstOpenPosition) {
    return {
      ...base,
      nextAction: {
        kind: "close-thread",
        label: `[ CLOSE ${firstOpenPosition.ticker} THREAD ]`,
        ticker: firstOpenPosition.ticker,
      },
      lines: [`open cargo ${firstOpenPosition.ticker}`, "bank or clear before next route"],
    };
  }

  return {
    ...base,
    nextAction: { kind: "upgrade-lane", label: "[ PICK UPGRADE LANE ]" },
    lines: ["safe: VBLM/MTRX", "upgrade: PGAS/ORRS/SNPS"],
  };
}

export function OperatorBrief({
  surface,
  positions,
  firstTradeComplete,
  selectedTicker,
  heat,
  onAction,
}: OperatorBriefInput & {
  onAction?: (action: OperatorBriefAction) => void;
}) {
  const copy = getOperatorBriefCopy({
    surface,
    positions,
    firstTradeComplete,
    selectedTicker,
    heat,
  });
  const heatColor = toneColor(copy.heatTone);

  return (
    <View style={{ borderWidth: 1, borderColor: terminalColors.borderDim, backgroundColor: terminalColors.panelEven }}>
      <View
        style={{
          borderBottomWidth: 1,
          borderBottomColor: terminalColors.borderDim,
          backgroundColor: terminalColors.panelAlt,
          paddingHorizontal: 12,
          paddingVertical: 7,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
        }}
      >
        <Text style={{ flex: 1, fontFamily: terminalFont, color: terminalColors.muted, fontSize: 9, letterSpacing: 1.2 }}>
          OPERATOR_BRIEF // SESSION_STATE
        </Text>
        <Text style={{ fontFamily: terminalFont, color: heatColor, fontSize: 9, fontWeight: "700" }}>
          SIGNAL: {copy.signal}
        </Text>
      </View>

      <View style={{ padding: 12, gap: 11 }}>
        <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={{ fontFamily: terminalFont, color: terminalColors.dim, fontSize: 8, fontWeight: "700" }}>
              PROGRESS // D1_STREAK
            </Text>
            <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.72} style={{ fontFamily: terminalFont, color: terminalColors.text, fontSize: 10 }}>
              {copy.progressLabel}
            </Text>
          </View>

          <View style={{ alignItems: "flex-end", gap: 5 }}>
            <Text style={{ fontFamily: terminalFont, color: terminalColors.dim, fontSize: 8, fontWeight: "700" }}>
              HEAT_LADDER
            </Text>
            <View style={{ flexDirection: "row", gap: 2 }}>
              {copy.heatSegments.map((active, index) => (
                <View
                  key={`${copy.heatLabel}-${index}`}
                  style={{
                    width: 12,
                    height: 6,
                    backgroundColor: active ? heatColor : terminalColors.borderDim,
                  }}
                />
              ))}
            </View>
          </View>
        </View>

        <View style={{ gap: 4 }}>
          {copy.lines.map((line) => (
            <Text key={line} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.72} style={{ fontFamily: terminalFont, color: terminalColors.muted, fontSize: 10 }}>
              // {line.toUpperCase()}
            </Text>
          ))}
        </View>

        <Pressable
          disabled={!onAction}
          onPress={() => onAction?.(copy.nextAction)}
          style={{
            minHeight: 44,
            borderWidth: 1,
            borderColor: `${toneColor(actionTone(copy.nextAction.kind))}44`,
            backgroundColor: `${toneColor(actionTone(copy.nextAction.kind))}0D`,
            paddingHorizontal: 12,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
          }}
        >
          <Text style={{ fontFamily: terminalFont, color: terminalColors.muted, fontSize: 9, fontWeight: "700" }}>
            NEXT_ACTION
          </Text>
          <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.68} style={{ flex: 1, textAlign: "right", fontFamily: terminalFont, color: toneColor(actionTone(copy.nextAction.kind)), fontSize: 10, fontWeight: "700", letterSpacing: 1.2 }}>
            {copy.nextAction.label}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function getHeatSegments(heat: number): readonly boolean[] {
  const filled = Math.max(1, Math.min(5, Math.ceil(Math.max(0, heat) / 20)));
  return [0, 1, 2, 3, 4].map((index) => index < filled);
}

function getSignal(heat: number): OperatorBriefCopy["signal"] {
  if (heat >= 70) {
    return "HOT";
  }
  if (heat >= 30) {
    return "WATCH";
  }
  return "NOMINAL";
}

function getHeatLabel(heat: number): string {
  if (heat >= 70) {
    return "PRIORITY TARGET";
  }
  if (heat >= HIGH_HEAT_STRATEGY_THRESHOLD) {
    return "STOP LINE";
  }
  if (heat >= 30) {
    return "WATCHED";
  }
  return "SAFE";
}

function getHeatTone(heat: number): OperatorBriefTone {
  if (heat >= 70) {
    return "red";
  }
  if (heat >= 30) {
    return "amber";
  }
  return "green";
}

function actionTone(kind: OperatorBriefActionKind): OperatorBriefTone {
  if (kind === "sell-green" || kind === "upgrade-lane") {
    return "green";
  }
  if (kind === "cool-heat" || kind === "wait-tick" || kind === "close-thread") {
    return "amber";
  }
  return "cyan";
}

function toneColor(tone: OperatorBriefTone): string {
  if (tone === "green") {
    return terminalColors.green;
  }
  if (tone === "amber") {
    return terminalColors.amber;
  }
  if (tone === "red") {
    return terminalColors.red;
  }
  return terminalColors.cyan;
}

