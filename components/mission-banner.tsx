import { Pressable, Text, View } from "react-native";
import { getNpc } from "@/data/npcs";
import { getFactionRoutePressureSummary } from "@/engine/factions";
import type { FactionContractSignal, Mission } from "@/engine/types";
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

interface MissionContractStripProps {
  signal?: FactionContractSignal | null;
  locked?: boolean;
  pressureSummary?: string;
}

function MissionContractStrip({ signal, locked = false, pressureSummary }: MissionContractStripProps) {
  if (!signal) {
    return null;
  }

  const accent = locked ? terminalColors.dim : signal.heatPosture === "high" ? terminalColors.amber : terminalColors.cyan;
  const textColor = locked ? terminalColors.dim : terminalColors.muted;
  const summary = pressureSummary ?? getFactionRoutePressureSummary(signal);

  return (
    <View
      style={{
        marginTop: 8,
        marginBottom: 2,
        paddingVertical: 5,
        paddingHorizontal: 8,
        borderLeftWidth: 1,
        borderLeftColor: accent,
        backgroundColor: terminalColors.panelAlt,
        opacity: locked ? 0.48 : 1,
      }}
    >
      <Text
        style={{
          fontFamily: terminalFont,
          color: accent,
          fontSize: 9,
          lineHeight: 13,
        }}
        numberOfLines={2}
        adjustsFontSizeToFit
        minimumFontScale={0.75}
      >
        CONTRACT // {signal.factionName.toUpperCase()} // {signal.stageLabel.toUpperCase()}
      </Text>
      <Text
        style={{
          marginTop: 2,
          fontFamily: terminalFont,
          color: textColor,
          fontSize: 9,
          lineHeight: 13,
        }}
      >
        HEAT {signal.heatPosture.toUpperCase()} // {signal.routeConsequence.toUpperCase()} // +{signal.reputationDelta} REP
      </Text>
      <Text
        style={{
          marginTop: 2,
          fontFamily: terminalFont,
          color: textColor,
          fontSize: 9,
          lineHeight: 13,
        }}
        numberOfLines={2}
        adjustsFontSizeToFit
        minimumFontScale={0.75}
      >
        ROUTE // {summary}
      </Text>
    </View>
  );
}

export default function MissionBanner({
  mission,
  nowMs,
  onAccept,
  onDecline,
}: MissionBannerProps) {
  const npc = getNpc(mission.npcId);
  const remainingMs = Math.max(0, mission.expiresAtTimestamp - nowMs);
  const urgent = remainingMs <= 2 * 60_000;
  const pending = !mission.accepted && !mission.completed && !mission.failed;

  return (
    <View
      style={{
        marginTop: 14,
        marginHorizontal: 12,
        borderWidth: 1,
        borderColor: urgent ? terminalColors.red : terminalColors.borderDim,
        backgroundColor: terminalColors.panel,
        padding: 12,
      }}
    >
      <Text style={{ fontFamily: terminalFont, color: terminalColors.amber, fontSize: 10 }}>
        {pending ? "INCOMING CONTACT" : "ACTIVE MISSION"} // {(mission.npcName || npc.name).toUpperCase()}
      </Text>
      <Text style={{ marginTop: 6, fontFamily: terminalFont, color: terminalColors.text, fontSize: 12 }}>
        {mission.description}
      </Text>
      <MissionContractStrip signal={mission.contractSignal} pressureSummary={mission.routePressureSummary} />
      <Text style={{ marginTop: 6, fontFamily: terminalFont, color: urgent ? terminalColors.red : terminalColors.cyan, fontSize: 16 }}>
        ETA {formatCountdown(remainingMs)}
      </Text>
      <Text style={{ marginTop: 4, fontFamily: terminalFont, color: terminalColors.muted, fontSize: 10 }}>
        REWARD {mission.reward0Bol.toFixed(0)} 0BOL // XP {mission.rewardXp}
      </Text>
      {pending ? (
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

export { MissionBanner, MissionContractStrip };
