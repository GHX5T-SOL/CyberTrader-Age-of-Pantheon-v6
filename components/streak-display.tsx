import { Text, View } from "react-native";
import type { TradeStreak } from "@/engine/types";
import { terminalColors, terminalFont } from "@/theme/terminal";

interface StreakDisplayProps {
  streak: TradeStreak;
  nowMs: number;
}

export default function StreakDisplay({ streak, nowMs }: StreakDisplayProps) {
  const remainingMs = Math.max(0, (streak.expiresAt ?? nowMs) - nowMs);
  const remainingMinutes = Math.floor(remainingMs / 60_000);
  const remainingSeconds = Math.floor((remainingMs % 60_000) / 1000);
  const color = streak.count >= 5 ? terminalColors.amber : streak.count > 0 ? terminalColors.cyan : terminalColors.muted;
  const glow = streak.count >= 10 ? 0.8 : streak.count >= 5 ? 0.5 : 0.2;

  return (
    <View
      style={{
        marginTop: 14,
        marginHorizontal: 12,
        borderWidth: 1,
        borderColor: color,
        backgroundColor: terminalColors.panel,
        padding: 10,
        shadowColor: color,
        shadowOpacity: glow,
        shadowRadius: 10,
      }}
    >
      <Text style={{ fontFamily: terminalFont, color, fontSize: 13 }}>
        STREAK: {streak.count} FIRE // XP x{streak.multiplier.toFixed(1)}
      </Text>
      <Text style={{ marginTop: 4, fontFamily: terminalFont, color: terminalColors.muted, fontSize: 10 }}>
        PROFIT AGAIN IN {remainingMinutes}m {remainingSeconds}s OR THE CHAIN BREAKS
      </Text>
    </View>
  );
}

export { StreakDisplay };
