import { Text, View } from "react-native";
import type { FlashEvent } from "@/engine/types";
import { terminalColors, terminalFont } from "@/theme/terminal";

interface FlashEventBannerProps {
  event: FlashEvent;
  nowMs: number;
}

function formatCountdown(ms: number): string {
  const seconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
}

export default function FlashEventBanner({ event, nowMs }: FlashEventBannerProps) {
  const remainingMs = Math.max(0, event.endTimestamp - nowMs);
  const urgent = remainingMs <= 30_000;
  const color = urgent ? terminalColors.red : terminalColors.cyan;

  return (
    <View
      style={{
        marginTop: 14,
        marginHorizontal: 12,
        borderWidth: 1,
        borderColor: color,
        backgroundColor: terminalColors.panel,
        padding: 12,
        shadowColor: color,
        shadowOpacity: urgent ? 0.55 : 0.25,
        shadowRadius: urgent ? 12 : 6,
      }}
    >
      <Text style={{ fontFamily: terminalFont, color: terminalColors.muted, fontSize: 9 }}>
        FLASH EVENT // {event.type.replace(/_/g, " ").toUpperCase()}
      </Text>
      <Text style={{ marginTop: 6, fontFamily: terminalFont, color, fontSize: 26 }}>
        {formatCountdown(remainingMs)}
      </Text>
      <Text style={{ marginTop: 6, fontFamily: terminalFont, color: terminalColors.text, fontSize: 13 }}>
        {event.headline.toUpperCase()}
      </Text>
      <Text style={{ marginTop: 4, fontFamily: terminalFont, color: terminalColors.muted, fontSize: 10 }}>
        {event.description}
      </Text>
    </View>
  );
}

export { FlashEventBanner };
