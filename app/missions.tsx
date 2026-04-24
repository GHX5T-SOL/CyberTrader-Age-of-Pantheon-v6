import { Pressable, Text, View } from "react-native";
import MenuScreen from "@/components/menu-screen";
import MissionBanner from "@/components/mission-banner";
import NeonBorder from "@/components/neon-border";
import { NPCS } from "@/data/npcs";
import { useDemoStore } from "@/state/demo-store";
import { terminalColors, terminalFont } from "@/theme/terminal";

export default function MissionsRoute() {
  const clock = useDemoStore((state) => state.clock);
  const pendingMission = useDemoStore((state) => state.pendingMission);
  const activeMission = useDemoStore((state) => state.activeMission);
  const missionHistory = useDemoStore((state) => state.missionHistory);
  const npcReputation = useDemoStore((state) => state.npcReputation);
  const progression = useDemoStore((state) => state.progression);
  const acceptMission = useDemoStore((state) => state.acceptMission);
  const declineMission = useDemoStore((state) => state.declineMission);

  return (
    <MenuScreen title="MISSION CONTACTS">
      {pendingMission || activeMission ? (
        <MissionBanner
          mission={(activeMission ?? pendingMission)!}
          nowMs={clock.nowMs}
          onAccept={acceptMission}
          onDecline={declineMission}
        />
      ) : (
        <NeonBorder active>
          <Text style={{ fontFamily: terminalFont, color: terminalColors.muted, fontSize: 12 }}>
            NO ACTIVE CONTRACT. KEEP THE DECK WARM.
          </Text>
        </NeonBorder>
      )}

      <NeonBorder style={{ marginTop: 14 }}>
        <Text style={{ fontFamily: terminalFont, color: terminalColors.cyan, fontSize: 12 }}>CONTACTS</Text>
        {NPCS.map((npc) => {
          const locked = progression.level < npc.unlockedAtRank;
          return (
            <View key={npc.id} style={{ marginTop: 12, borderTopWidth: 1, borderTopColor: terminalColors.borderDim, paddingTop: 10 }}>
              <Text style={{ fontFamily: terminalFont, color: locked ? terminalColors.dim : terminalColors.text, fontSize: 12 }}>
                {npc.name.toUpperCase()} // {npc.faction.toUpperCase()}
              </Text>
              <Text style={{ marginTop: 4, fontFamily: terminalFont, color: terminalColors.muted, fontSize: 10 }}>
                {locked ? `LOCKED RANK ${npc.unlockedAtRank}` : npc.description}
              </Text>
              <Text style={{ marginTop: 4, fontFamily: terminalFont, color: terminalColors.amber, fontSize: 10 }}>
                REP {npcReputation[npc.id] ?? 0}
              </Text>
            </View>
          );
        })}
      </NeonBorder>

      <NeonBorder style={{ marginTop: 14 }}>
        <Text style={{ fontFamily: terminalFont, color: terminalColors.cyan, fontSize: 12 }}>ARCHIVE</Text>
        {missionHistory.length ? (
          missionHistory.slice(0, 8).map((mission) => (
            <View key={mission.id} style={{ marginTop: 10, borderTopWidth: 1, borderTopColor: terminalColors.borderDim, paddingTop: 10 }}>
              <Text style={{ fontFamily: terminalFont, color: mission.status === "completed" ? terminalColors.green : terminalColors.amber, fontSize: 11 }}>
                {mission.status.toUpperCase()} // {mission.title}
              </Text>
              <Text style={{ marginTop: 4, fontFamily: terminalFont, color: terminalColors.muted, fontSize: 10 }}>
                {mission.objective}
              </Text>
            </View>
          ))
        ) : (
          <Text style={{ marginTop: 10, fontFamily: terminalFont, color: terminalColors.dim, fontSize: 11 }}>NO COMPLETED CONTRACTS</Text>
        )}
      </NeonBorder>

      {pendingMission ? (
        <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
          <Pressable onPress={acceptMission} style={{ flex: 1, borderWidth: 1, borderColor: terminalColors.cyan, padding: 10 }}>
            <Text style={{ fontFamily: terminalFont, color: terminalColors.cyan, textAlign: "center", fontSize: 11 }}>[ ACCEPT ]</Text>
          </Pressable>
          <Pressable onPress={declineMission} style={{ flex: 1, borderWidth: 1, borderColor: terminalColors.borderDim, padding: 10 }}>
            <Text style={{ fontFamily: terminalFont, color: terminalColors.muted, textAlign: "center", fontSize: 11 }}>[ DECLINE ]</Text>
          </Pressable>
        </View>
      ) : null}
    </MenuScreen>
  );
}
