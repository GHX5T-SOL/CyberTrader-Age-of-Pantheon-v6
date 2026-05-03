import * as React from "react";
import { Pressable, Text, View } from "react-native";
import ActionButton from "@/components/action-button";
import MenuScreen from "@/components/menu-screen";
import NeonBorder from "@/components/neon-border";
import OsStatusMatrix from "@/components/os-status-matrix";
import {
  FACTION_DEFINITIONS,
  getAgentOsFactionGate,
  getAgentOsGateProgress,
  getFactionDefinition,
  getFactionSwitchRule,
} from "@/engine/factions";
import { getOsProgressionState } from "@/engine/os-progression";
import type { Faction } from "@/engine/types";
import { useDemoStore } from "@/state/demo-store";
import { terminalColors, terminalFont } from "@/theme/terminal";

export default function ProgressionMenuRoute() {
  const profile = useDemoStore((state) => state.profile);
  const progression = useDemoStore((state) => state.progression);
  const firstTradeComplete = useDemoStore((state) => state.firstTradeComplete);
  const heat = useDemoStore((state) => state.resources.heat);
  const factionChoice = useDemoStore((state) => state.factionChoice);
  const npcReputation = useDemoStore((state) => state.npcReputation);
  const chooseFaction = useDemoStore((state) => state.chooseFaction);
  const rank = progression.level;
  const selectedFaction = profile?.faction ?? null;
  const [candidateFaction, setCandidateFaction] = React.useState<Faction>(
    selectedFaction ?? "FREE_SPLINTERS",
  );
  const agentOsGate = getAgentOsFactionGate({
    rank,
    firstTradeComplete,
    heat,
    faction: selectedFaction,
  });
  const agentOsProgress = getAgentOsGateProgress(agentOsGate);
  const switchRule = getFactionSwitchRule(factionChoice ?? (selectedFaction
    ? {
        faction: selectedFaction,
        chosenAt: profile?.createdAt ?? "LOCAL SESSION",
        freeSwitchUsed: false,
        previousFaction: null,
      }
    : null));
  const canChangeFaction = agentOsGate.unlocked && (!selectedFaction || switchRule.canSwitch);
  const canCommitFaction = canChangeFaction && candidateFaction !== selectedFaction;
  const candidateDefinition = getFactionDefinition(candidateFaction);
  const nextRank = progression.nextXpRequired === null ? null : rank + 1;
  const xpNeeded = progression.nextXpRequired === null
    ? 0
    : Math.max(0, progression.nextXpRequired - progression.xp);
  const osState = getOsProgressionState({
    rank,
    firstTradeComplete,
    heat,
    faction: selectedFaction,
    npcReputation,
  });
  const pantheonTier = osState.tiers.find((tier) => tier.id === "PANTHEON");

  React.useEffect(() => {
    if (selectedFaction) {
      setCandidateFaction(selectedFaction);
    }
  }, [selectedFaction]);

  return (
    <MenuScreen title="OS UPGRADE PATH">
      <View style={{ gap: 12 }}>
        <OsStatusMatrix state={osState} />

        <NeonBorder active={agentOsGate.osTier === "PIRATE"}>
          <Text style={{ fontFamily: terminalFont, color: terminalColors.cyan, fontSize: 13 }}>
            AG3NT_0S//pIRAT3 - {agentOsGate.osTier === "PIRATE" ? "CURRENT" : "COMPLETE"}
          </Text>
          <Text style={{ marginTop: 8, fontFamily: terminalFont, color: terminalColors.muted, fontSize: 11, lineHeight: 17 }}>
            Local trades, low-heat market access, dev identity.
          </Text>
        </NeonBorder>

        <NeonBorder active={agentOsGate.osTier === "AGENT" || agentOsGate.canChooseFaction}>
          <Text style={{ fontFamily: terminalFont, color: agentOsGate.unlocked ? terminalColors.green : terminalColors.amber, fontSize: 13 }}>
            AgentOS - {selectedFaction ? `BOUND // ${getFactionDefinition(selectedFaction).name.toUpperCase()}` : agentOsGate.unlocked ? "READY FOR FACTION CHOICE" : "LOCKED"}
          </Text>
          <Text style={{ marginTop: 8, fontFamily: terminalFont, color: terminalColors.text, fontSize: 11, lineHeight: 17 }}>
            Rank-5 faction layer: missions, reputation, active eAgent pressure, and one free allegiance switch.
          </Text>
          <View style={{ height: 6, backgroundColor: terminalColors.borderDim, marginTop: 10 }}>
            <View
              style={{
                height: 6,
                width: `${agentOsProgress.percent}%`,
                backgroundColor: agentOsGate.unlocked ? terminalColors.green : terminalColors.amber,
              }}
            />
          </View>
          <Text style={{ marginTop: 6, fontFamily: terminalFont, color: terminalColors.muted, fontSize: 10 }}>
            LINK STABILITY {agentOsProgress.percent}% // {agentOsProgress.completed}/{agentOsProgress.total} SIGNALS
          </Text>
          <View style={{ marginTop: 10, gap: 5 }}>
            {agentOsGate.requirements.map((requirement) => (
              <Text
                key={requirement.id}
                style={{
                  fontFamily: terminalFont,
                  color: requirement.met ? terminalColors.green : terminalColors.muted,
                  fontSize: 10,
                }}
              >
                {requirement.met ? "[OK]" : "[--]"} {requirement.label.toUpperCase()}
              </Text>
            ))}
          </View>
          <Text style={{ marginTop: 10, fontFamily: terminalFont, color: switchRule.freeSwitchAvailable ? terminalColors.cyan : terminalColors.dim, fontSize: 10, lineHeight: 16 }}>
            SWITCH RULE: {switchRule.reason.toUpperCase()}
          </Text>
        </NeonBorder>

        <NeonBorder active={osState.pantheonReadiness.ready}>
          <Text style={{ fontFamily: terminalFont, color: osState.pantheonReadiness.ready ? terminalColors.cyan : terminalColors.dim, fontSize: 13 }}>
            PantheonOS - {osState.pantheonReadiness.ready ? "READY" : `LOCKED (${osState.pantheonReadiness.progressPercent}%)`}
          </Text>
          <Text style={{ marginTop: 8, fontFamily: terminalFont, color: terminalColors.muted, fontSize: 11, lineHeight: 17 }}>
            {pantheonTier?.narrativeLine ?? "Shard reconstruction, guild control, endgame authority."}
          </Text>
          <Text style={{ marginTop: 8, fontFamily: terminalFont, color: terminalColors.amber, fontSize: 10, lineHeight: 15 }}>
            SHARD SIGNAL {osState.pantheonReadiness.shardSignal}/100 // {osState.nextTier === "PANTHEON" ? osState.nextAction : "NEON VOID MAP READY"}
          </Text>
        </NeonBorder>

        <NeonBorder>
          <Text style={{ fontFamily: terminalFont, color: terminalColors.amber, fontSize: 12 }}>
            FACTION ALIGNMENT MATRIX
          </Text>
          <View style={{ marginTop: 10, gap: 10 }}>
            {FACTION_DEFINITIONS.map((faction) => {
              const candidate = faction.id === candidateFaction;
              const bound = faction.id === selectedFaction;
              const accent = bound ? terminalColors.green : candidate ? terminalColors.cyan : terminalColors.border;
              return (
                <Pressable
                  key={faction.id}
                  disabled={!canChangeFaction}
                  onPress={() => {
                    setCandidateFaction(faction.id);
                  }}
                  style={{
                    borderLeftWidth: 2,
                    borderLeftColor: accent,
                    borderTopWidth: 1,
                    borderTopColor: terminalColors.borderDim,
                    paddingLeft: 10,
                    paddingTop: 10,
                    paddingBottom: 2,
                    backgroundColor: candidate ? terminalColors.panelAlt : "transparent",
                    opacity: agentOsGate.unlocked ? 1 : 0.58,
                  }}
                >
                  <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 8 }}>
                    <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.72} style={{ flex: 1, fontFamily: terminalFont, color: bound ? terminalColors.green : terminalColors.cyan, fontSize: 11 }}>
                      {faction.name.toUpperCase()} // {faction.handle.toUpperCase()}
                    </Text>
                    <Text style={{ fontFamily: terminalFont, color: bound ? terminalColors.green : candidate ? terminalColors.amber : terminalColors.dim, fontSize: 9 }}>
                      {bound ? "BOUND" : candidate ? "QUEUED" : "OPEN"}
                    </Text>
                  </View>
                  <Text style={{ marginTop: 5, fontFamily: terminalFont, color: terminalColors.muted, fontSize: 10, lineHeight: 15 }}>
                    {faction.gameplayStake}
                  </Text>
                  <Text style={{ marginTop: 5, fontFamily: terminalFont, color: terminalColors.dim, fontSize: 9, lineHeight: 14 }}>
                    BIAS: {faction.missionBias.join("/").toUpperCase()} // REWARD x{faction.rewardModifier.toFixed(2)} // HEAT {faction.heatPosture.toUpperCase()}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <View style={{ marginTop: 12 }}>
            <ActionButton
              label={
                !agentOsGate.unlocked
                  ? "[ AGENTOS LOCKED ]"
                  : !canChangeFaction
                    ? "[ ALIGNMENT LOCKED ]"
                    : canCommitFaction
                      ? `[ COMMIT ${candidateDefinition.name.toUpperCase()} ]`
                      : `[ CURRENT ${candidateDefinition.name.toUpperCase()} ]`
              }
              variant={canCommitFaction ? "primary" : agentOsGate.unlocked ? "amber" : "muted"}
              disabled={!canCommitFaction}
              glowing={canCommitFaction}
              onPress={() => {
                void chooseFaction(candidateFaction);
              }}
            />
            <Text style={{ marginTop: 8, fontFamily: terminalFont, color: terminalColors.dim, fontSize: 9, lineHeight: 14, textAlign: "center" }}>
              {agentOsGate.unlocked
                ? "Faction alignment changes future mission bias and reputation rewards. One free switch is available before PantheonOS authority."
                : "Alignment stays unavailable until rank, profit, and Heat checks are clean."}
            </Text>
          </View>
        </NeonBorder>

        <NeonBorder>
          <Text style={{ fontFamily: terminalFont, color: terminalColors.text, fontSize: 12 }}>RANK XP: {progression.xp}</Text>
          <View style={{ height: 6, backgroundColor: terminalColors.borderDim, marginTop: 8 }}>
            <View
              style={{
                height: 6,
                width: `${Math.min(100, progression.nextXpRequired === null ? 100 : (progression.xp / progression.nextXpRequired) * 100)}%`,
                backgroundColor: terminalColors.amber,
              }}
            />
          </View>
          <Text style={{ marginTop: 8, fontFamily: terminalFont, color: terminalColors.amber, fontSize: 11 }}>
            {nextRank === null ? "NEXT: MAX RANK" : `NEXT: RANK ${nextRank} - ${xpNeeded} XP REMAINING`}
          </Text>
        </NeonBorder>
      </View>
    </MenuScreen>
  );
}
