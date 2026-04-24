import { Text, View } from "react-native";
import type { Position } from "@/engine/types";
import { SectionCard } from "@/components/section-card";
import { SystemLine } from "@/components/system-line";
import { palette } from "@/theme/colors";

interface TutorialPanelProps {
  phase: "home" | "market";
  positions: Record<string, Position>;
  firstTradeComplete: boolean;
  selectedTicker: string;
}

export function TutorialPanel({
  phase,
  positions,
  firstTradeComplete,
  selectedTicker,
}: TutorialPanelProps) {
  const hasPosition = Object.keys(positions).length > 0;
  const objective = getObjective({ phase, hasPosition, firstTradeComplete, selectedTicker });

  return (
    <SectionCard eyebrow="tutorial" title={objective.title} tone={objective.tone}>
      <Text selectable style={{ color: palette.fg.primary, lineHeight: 22 }}>
        {objective.detail}
      </Text>
      <View style={{ gap: 6 }}>
        {objective.lines.map((line) => (
          <SystemLine key={line} tone={objective.tone}>
            {line}
          </SystemLine>
        ))}
      </View>
    </SectionCard>
  );
}

function getObjective(input: {
  phase: "home" | "market";
  hasPosition: boolean;
  firstTradeComplete: boolean;
  selectedTicker: string;
}): {
  title: string;
  detail: string;
  tone: "cyan" | "acid" | "amber";
  lines: string[];
} {
  if (input.firstTradeComplete) {
    return {
      title: "first loop complete",
      detail:
        "The demo loop is proven. You can reset and repeat it, or keep trading to watch the terminal state evolve.",
      tone: "acid",
      lines: ["[done] handle claimed", "[done] buy executed", "[done] sell closed"],
    };
  }

  if (input.hasPosition) {
    return {
      title: "close the position",
      detail:
        "You hold inventory now. Let the price tick at least once, then sell from the trade ticket to complete the loop.",
      tone: "amber",
      lines: ["[live] position open", "[next] watch delta", "[next] sell position"],
    };
  }

  if (input.phase === "market") {
    return {
      title: "execute first buy",
      detail:
        `Start with ${input.selectedTicker}. The default lot is small, readable, and enough to prove balance, Energy, and Heat updates.`,
      tone: "cyan",
      lines: ["[next] select ticker", "[next] execute buy", "[watch] resources shift"],
    };
  }

  return {
    title: "enter the market",
    detail:
      "The cockpit is stable. Route into S1LKROAD and run one complete trade so the deck can prove itself.",
    tone: "cyan",
    lines: ["[done] boot", "[done] handle", "[next] route to s1lkroad"],
  };
}
