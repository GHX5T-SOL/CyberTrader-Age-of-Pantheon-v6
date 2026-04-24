import { Pressable, Text, View } from "react-native";
import { getNpc } from "@/data/npcs";
import type { Mission } from "@/engine/types";
import { terminalColors, terminalFont } from "@/theme/terminal";

interface MissionBannerProps {
  mission: Mission;
  nowMs: number;
  onAccept?: () => void;
  onDecline?: () => void;
}

function formatCountdown(ms: number): string {
  const seconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}m ${String(remainder).padStart(2, "0")}s`;
}

export default function MissionBanner({
  mission,
  nowMs,
  onAccept,
  onDecline,
}: MissionBannerProps) {
  const npc = getNpc(mission.npcId);
  const remainingMs = Math.max(0, mission.endTimestamp - nowMs);
  const urgent = remainingMs <= 2 * 60_000;

  return (
    <View
      style={{
        marginTop: 14,
        marginHorizontal: 12,
        borderWidth: 1,
        borderColor: urgent ? terminalColors.amber : terminalColors.borderDim,
        backgroundColor: terminalColors.panel,
        padding: 12,
      }}
    >
      <Text style={{ fontFamily: terminalFont, color: terminalColors.amber, fontSize: 10 }}>
        {mission.status === "pending" ? "INCOMING CONTACT" : "ACTIVE MISSION"} // {npc.name.toUpperCase()}
      </Text>
      <Text style={{ marginTop: 6, fontFamily: terminalFont, color: terminalColors.text, fontSize: 12 }}>
        {mission.objective}
      </Text>
      <Text style={{ marginTop: 6, fontFamily: terminalFont, color: urgent ? terminalColors.red : terminalColors.cyan, fontSize: 16 }}>
        ETA {formatCountdown(remainingMs)}
      </Text>
      <Text style={{ marginTop: 4, fontFamily: terminalFont, color: terminalColors.muted, fontSize: 10 }}>
        REWARD {mission.rewardObol.toFixed(0)} 0BOL // XP {mission.rewardXp}
      </Text>
      {mission.status === "pending" ? (
        <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
          <Pressable onPress={onAccept} style={{ borderWidth: 1, borderColor: terminalColors.cyan, paddingHorizontal: 10, paddingVertical: 7 }}>
            <Text style={{ fontFamily: terminalFont, color: terminalColors.cyan, fontSize: 11 }}>[ ACCEPT ]</Text>
          </Pressable>
          <Pressable onPress={onDecline} style={{ borderWidth: 1, borderColor: terminalColors.borderDim, paddingHorizontal: 10, paddingVertical: 7 }}>
            <Text style={{ fontFamily: terminalFont, color: terminalColors.muted, fontSize: 11 }}>[ DECLINE ]</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

export { MissionBanner };
