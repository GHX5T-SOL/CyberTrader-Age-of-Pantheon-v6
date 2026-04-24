import * as React from "react";
import { Pressable, Text, View } from "react-native";
import type { DailyChallenge } from "@/engine/types";
import { terminalColors, terminalFont } from "@/theme/terminal";

interface DailyChallengesPanelProps {
  challenges: DailyChallenge[];
  onClaim: (id: string) => void;
}

export default function DailyChallengesPanel({
  challenges,
  onClaim,
}: DailyChallengesPanelProps) {
  const [open, setOpen] = React.useState(true);

  return (
    <View style={{ marginTop: 16, marginHorizontal: 12, borderWidth: 1, borderColor: terminalColors.borderDim, backgroundColor: terminalColors.panel, padding: 12 }}>
      <Pressable onPress={() => setOpen((value) => !value)} style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Text style={{ fontFamily: terminalFont, color: terminalColors.cyan, fontSize: 12 }}>CHALLENGES</Text>
        <Text style={{ fontFamily: terminalFont, color: terminalColors.muted, fontSize: 12 }}>{open ? "v" : ">"}</Text>
      </Pressable>
      {open ? (
        <View style={{ marginTop: 10, gap: 10 }}>
          {challenges.map((challenge) => {
            const percent = Math.min(100, (challenge.progress / challenge.target) * 100);
            return (
              <View key={challenge.id}>
                <Text style={{ fontFamily: terminalFont, color: challenge.completed ? terminalColors.green : terminalColors.text, fontSize: 10 }}>
                  {challenge.completed ? "[OK] " : ""}{challenge.title}
                </Text>
                <View style={{ height: 5, backgroundColor: terminalColors.borderDim, marginTop: 5 }}>
                  <View style={{ height: 5, width: `${percent}%`, backgroundColor: challenge.completed ? terminalColors.green : terminalColors.cyan }} />
                </View>
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 4 }}>
                  <Text style={{ fontFamily: terminalFont, color: terminalColors.muted, fontSize: 9 }}>
                    {Math.floor(challenge.progress)}/{challenge.target}
                  </Text>
                  {challenge.completed && !challenge.claimed ? (
                    <Pressable onPress={() => onClaim(challenge.id)}>
                      <Text style={{ fontFamily: terminalFont, color: terminalColors.amber, fontSize: 9 }}>[ CLAIM ]</Text>
                    </Pressable>
                  ) : (
                    <Text style={{ fontFamily: terminalFont, color: terminalColors.muted, fontSize: 9 }}>
                      {challenge.claimed ? "CLAIMED" : `${challenge.rewardObol} 0BOL`}
                    </Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

export { DailyChallengesPanel };
