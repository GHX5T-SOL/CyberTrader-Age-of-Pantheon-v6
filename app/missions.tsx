import { Pressable, Text, View } from "react-native";
import { useState } from "react";
import MenuScreen from "@/components/menu-screen";
import MissionBanner, { MissionContractStrip } from "@/components/mission-banner";
import NeonBorder from "@/components/neon-border";
import { NPCS } from "@/data/npcs";
import {
  getAgentOsFactionByNpcFaction,
  getAgentOsFactionGate,
  getAgentOsGateProgress,
  getFactionContractSignal,
  getFactionDefinition,
  getFactionStanding,
} from "@/engine/factions";
import { useDemoStore } from "@/state/demo-store";
import { terminalColors, terminalFont } from "@/theme/terminal";

export default function MissionsRoute() {
  const clock = useDemoStore((state) => state.clock);
  const pendingMission = useDemoStore((state) => state.pendingMission);
  const activeMission = useDemoStore((state) => state.activeMission);
  const missionCount = (pendingMission ? 1 : 0) + (activeMission ? 1 : 0);
  const missionHistory = useDemoStore((state) => state.missionHistory);
  const npcReputation = useDemoStore((state) => state.npcReputation);
  const progression = useDemoStore((state) => state.progression);
  const [showUnlockedOnly, setShowUnlockedOnly] = useState(false);
  const profile = useDemoStore((state) => state.profile);
  const firstTradeComplete = useDemoStore((state) => state.firstTradeComplete);
  const heat = useDemoStore((state) => state.resources.heat);
  const acceptMission = useDemoStore((state) => state.acceptMission);
  const declineMission = useDemoStore((state) => state.declineMission);
  const agentOsGate = getAgentOsFactionGate({
    rank: progression.level,
    firstTradeComplete,
    heat,
    faction: profile?.faction ?? null,
  });
  const agentOsProgress = getAgentOsGateProgress(agentOsGate);

  return (
    <MenuScreen title={`MISSION CONTACTS (${missionCount})`}>
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

      <NeonBorder style={{ marginTop: 14 }} active={agentOsGate.canChooseFaction}>
        <Text style={{ fontFamily: terminalFont, color: agentOsGate.unlocked ? terminalColors.green : terminalColors.amber, fontSize: 12 }}>
          AGENTOS CONTRACT GATE // {agentOsProgress.percent}%
        </Text>
        <View style={{ height: 6, backgroundColor: terminalColors.borderDim, marginTop: 8 }}>
          <View
            style={{
              height: 6,
              width: `${agentOsProgress.percent}%`,
              backgroundColor: agentOsGate.unlocked ? terminalColors.green : terminalColors.amber,
            }}
          />
        </View>
        <Text style={{ marginTop: 8, fontFamily: terminalFont, color: terminalColors.muted, fontSize: 10, lineHeight: 15 }}>
          {agentOsGate.canChooseFaction
            ? "Faction choice ready. Pick an allegiance from the OS Upgrade Path."
            : `${agentOsProgress.completed}/${agentOsProgress.total} unlock signals stable. Rank 5, one profitable sell, and Heat 70 or lower open the relay.`}
        </Text>
      </NeonBorder>

      <NeonBorder style={{ marginTop: 14 }}>
        <Text style={{ fontFamily: terminalFont, color: terminalColors.cyan, fontSize: 12 }}>CONTACTS</Text>
        {/* Toggle to show only unlocked contacts */}
        <Pressable onPress={() => setShowUnlockedOnly(!showUnlockedOnly)} style={{ marginTop: 4, padding: 4, borderWidth: 1, borderColor: terminalColors.dim }}>
          <Text style={{ fontFamily: terminalFont, color: terminalColors.muted, fontSize: 10 }}>
            {showUnlockedOnly ? 'SHOW ALL' : 'SHOW UNLOCKED ONLY'}
          </Text>
        </Pressable>
        {[...NPCS]
          .filter(npc => !showUnlockedOnly || progression.level >= npc.unlockedAtRank)
          .sort((a, b) => {
          const repA = npcReputation[a.id] ?? 0;
          const repB = npcReputation[b.id] ?? 0;
          return repB - repA;
        }).map((npc) => {
          const locked = progression.level < npc.unlockedAtRank;
          const factionId = getAgentOsFactionByNpcFaction(npc.faction);
          const faction = factionId ? getFactionDefinition(factionId) : null;
          const reputation = npcReputation[npc.id] ?? 0;
          const standing = factionId ? getFactionStanding(factionId, reputation) : null;
          const contractSignal = factionId
            ? getFactionContractSignal({
                faction: factionId,
                reputation,
              })
            : null;
          return (
            <View key={npc.id} style={{ marginTop: 12, borderTopWidth: 1, borderTopColor: terminalColors.borderDim, paddingTop: 10 }}>
              <Text style={{ fontFamily: terminalFont, color: locked ? terminalColors.dim : terminalColors.text, fontSize: 12 }}>
                {npc.name.toUpperCase()} // {npc.faction.toUpperCase()}
              </Text>
              <Text style={{ marginTop: 4, fontFamily: terminalFont, color: terminalColors.muted, fontSize: 10 }}>
                {locked ? `LOCKED RANK ${npc.unlockedAtRank}` : npc.personality}
              </Text>
              {!locked ? (
                <Text style={{ marginTop: 4, fontFamily: terminalFont, color: terminalColors.cyan, fontSize: 10, lineHeight: 15 }}>
                  HINT // {npc.strategyHint}
                </Text>
              ) : null}
              <Text style={{ marginTop: 4, fontFamily: terminalFont, color: terminalColors.amber, fontSize: 10 }}>
                REP {reputation}
              </Text>
              <MissionContractStrip signal={contractSignal} locked={locked} />
              {faction && standing ? (
                <>
                  <Text style={{ marginTop: 4, fontFamily: terminalFont, color: terminalColors.green, fontSize: 10, lineHeight: 15 }}>
                    AGENTOS // {faction.name.toUpperCase()} {standing.tier.toUpperCase()} // {faction.heatPosture.toUpperCase()} HEAT POSTURE
                  </Text>
                  {/* Show faction description for richer lore */}
                  <Text style={{ marginTop: 2, fontFamily: terminalFont, color: terminalColors.muted, fontSize: 9 }}>
                    {faction.description}
                  </Text>
                </>
              ) : (
                <Text style={{ marginTop: 4, fontFamily: terminalFont, color: terminalColors.dim, fontSize: 10, lineHeight: 15 }}>
                  AGENTOS // OBSERVER SIGNAL - FACTION CHOICE NOT BOUND HERE
                </Text>
              )}
            </View>
          );
        })}
      </NeonBorder>

      <NeonBorder style={{ marginTop: 14 }}>
        <Text style={{ fontFamily: terminalFont, color: terminalColors.cyan, fontSize: 12 }}>ARCHIVE</Text>
        {missionHistory.length ? (
          missionHistory.slice(0, 8).map((mission) => (
            <View key={mission.id} style={{ marginTop: 10, borderTopWidth: 1, borderTopColor: terminalColors.borderDim, paddingTop: 10 }}>
              <Text style={{ fontFamily: terminalFont, color: mission.completed ? terminalColors.green : terminalColors.amber, fontSize: 11 }}>
                {(mission.completed ? "COMPLETED" : mission.failed ? "FAILED" : mission.status.toUpperCase())} // {mission.title}
              </Text>
              <Text style={{ marginTop: 4, fontFamily: terminalFont, color: terminalColors.muted, fontSize: 10 }}>
                {mission.description}
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
