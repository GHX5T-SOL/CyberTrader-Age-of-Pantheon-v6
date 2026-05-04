import { Text, View, Pressable } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import MenuScreen from "@/components/menu-screen";
import NeonBorder from "@/components/neon-border";
import { terminalFont, terminalColors } from "@/theme/terminal";
import { useDemoStore } from "@/state/demo-store";
import { getFactionDefinition, getFactionStanding } from "@/engine/factions";

export default function MissionDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const mission = useDemoStore((s) => s.missionHistory.find((m) => m.id === id))
    || useDemoStore((s) => s.activeMission)
    || useDemoStore((s) => s.pendingMission);

  if (!mission) {
    return (
      <MenuScreen title="MISSION DETAIL">
        <NeonBorder active>
          <Text style={{ fontFamily: terminalFont, color: terminalColors.red, fontSize: 12 }}>
            Mission not found.
          </Text>
        </NeonBorder>
        <Pressable onPress={() => router.back()} style={{ marginTop: 10 }}>
          <Text style={{ fontFamily: terminalFont, color: terminalColors.cyan, fontSize: 12 }}>
            Back
          </Text>
        </Pressable>
      </MenuScreen>
    );
  }

  const factionDef = getFactionDefinition(mission.faction);
  const reputation = getFactionStanding(mission.faction, useDemoStore.getState().npcReputation);

  return (
    <MenuScreen title={`MISSION ${mission.id}`}>
      <NeonBorder active>
        <Text style={{ fontFamily: terminalFont, color: terminalColors.cyan, fontSize: 12 }}>Name: {mission.name}</Text>
        <Text style={{ fontFamily: terminalFont, color: terminalColors.cyan, fontSize: 12 }}>Faction: {factionDef.name}</Text>
        <Text style={{ fontFamily: terminalFont, color: terminalColors.cyan, fontSize: 12 }}>Reputation: {reputation}</Text>
        <Text style={{ fontFamily: terminalFont, color: terminalColors.cyan, fontSize: 12 }}>Reward: {mission.reward?.toString() ?? "N/A"}</Text>
        <Text style={{ fontFamily: terminalFont, color: terminalColors.cyan, fontSize: 12 }}>State: {mission.state}</Text>
      </NeonBorder>
      <Pressable onPress={() => router.back()} style={{ marginTop: 10 }}>
        <Text style={{ fontFamily: terminalFont, color: terminalColors.cyan, fontSize: 12 }}>
          Back
        </Text>
      </Pressable>
    </MenuScreen>
  );
}
