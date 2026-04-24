import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import NeonBorder from "@/components/neon-border";
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
  const riskColor =
    event.riskLevel === "critical"
      ? terminalColors.red
      : event.riskLevel === "high"
        ? terminalColors.amber
        : event.riskLevel === "medium"
          ? terminalColors.amber
          : terminalColors.green;

  const navigate = () => {
    if (event.type === "eagent_scan") {
      router.push("/home");
      return;
    }
    if (event.type === "gang_takeover" || event.type === "district_blackout") {
      router.push("/home");
      return;
    }
    router.push({ pathname: "/terminal", params: event.ticker ? { ticker: event.ticker } : undefined });
  };

  return (
    <NeonBorder
      active
      style={{
        marginTop: 14,
        marginHorizontal: 12,
        borderColor: color,
        shadowColor: color,
        shadowOpacity: urgent ? 0.7 : 0.28,
        shadowRadius: urgent ? 14 : 7,
      }}
    >
      <Pressable onPress={navigate}>
      <Text style={{ fontFamily: terminalFont, color: terminalColors.muted, fontSize: 9 }}>
        FLASH EVENT // {event.type.replace(/_/g, " ").toUpperCase()}
      </Text>
      <Text style={{ marginTop: 6, fontFamily: terminalFont, color, fontSize: 30 }}>
        {formatCountdown(remainingMs)}
      </Text>
      <Text style={{ marginTop: 6, fontFamily: terminalFont, color: terminalColors.amber, fontSize: 14 }}>
        {event.headline.toUpperCase()}
      </Text>
      <Text style={{ marginTop: 4, fontFamily: terminalFont, color: terminalColors.muted, fontSize: 10 }}>
        {event.description}
      </Text>
      <View style={{ alignSelf: "flex-start", marginTop: 8, borderWidth: 1, borderColor: riskColor, paddingHorizontal: 8, paddingVertical: 3 }}>
        <Text style={{ fontFamily: terminalFont, color: riskColor, fontSize: 9 }}>
          RISK {event.riskLevel.toUpperCase()}
        </Text>
      </View>
      </Pressable>
    </NeonBorder>
  );
}

export { FlashEventBanner };
