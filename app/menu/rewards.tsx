import { Text, View } from "react-native";
import ActionButton from "@/components/action-button";
import MenuScreen from "@/components/menu-screen";
import NeonBorder from "@/components/neon-border";
import { useDemoStore } from "@/state/demo-store";
import { terminalColors, terminalFont } from "@/theme/terminal";

export default function RewardsMenuRoute() {
  const rank = useDemoStore((state) => state.profile?.rank ?? 1);
  const rewards = [
    [1, "+50,000 0BOL"],
    [3, "Free energy pack 24h"],
    [5, "AgentOS Unlock"],
    [8, "Tor Exit Node"],
    [12, "City Route Map"],
  ] as const;

  return (
    <MenuScreen title="REWARDS TERMINAL">
      <View style={{ gap: 10 }}>
        {rewards.map(([level, label]) => {
          const eligible = rank >= level;
          const claimed = eligible && level <= 3;
          return (
            <NeonBorder key={level} active={eligible && !claimed}>
              <Text style={{ fontFamily: terminalFont, color: claimed ? terminalColors.green : eligible ? terminalColors.amber : terminalColors.dim, fontSize: 12 }}>
                Rank {level}: {label} ({claimed ? "CLAIMED" : eligible ? "READY" : "LOCKED"})
              </Text>
              {eligible && !claimed ? (
                <View style={{ marginTop: 10 }}>
                  <ActionButton variant="amber" label="[ CLAIM ]" onPress={() => {}} />
                </View>
              ) : null}
            </NeonBorder>
          );
        })}
      </View>
    </MenuScreen>
  );
}

